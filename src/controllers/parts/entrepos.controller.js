const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Créer un entrepôt
exports.createEntrepot = async (req, res) => {
  try {
    const { libelle } = req.body;
    
    // Vérifier si l'entrepôt existe déjà
    const existingEntrepot = await prisma.entrepot.findFirst({
      where: { libelle }
    });

    if (existingEntrepot) {
      return res.status(400).json({ message: 'Un entrepôt avec ce libellé existe déjà' });
    }

    const entrepot = await prisma.entrepot.create({
      data: { libelle }
    });

    res.status(201).json(entrepot);
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la création de l'entrepôt",
      error: error.message 
    });
  }
};

// ✅ Récupérer tous les entrepôts (avec pagination)
exports.getAllEntrepots = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    
    const [entrepots, totalCount] = await Promise.all([
      prisma.entrepot.findMany({
        skip,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          stocks: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.entrepot.count()
    ]);

    res.status(200).json({
      total: totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / pageSize),
      data: entrepots
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la récupération des entrepôts",
      error: error.message 
    });
  }
};

// ✅ Récupérer un entrepôt par ID avec ses stocks
exports.getEntrepotById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const entrepot = await prisma.entrepot.findUnique({
      where: { id: parseInt(id) },
      include: {
        stocks: {
          include: {
            product: true
          }
        }
      }
    });

    if (!entrepot) {
      return res.status(404).json({ message: 'Entrepôt non trouvé' });
    }

    res.status(200).json(entrepot);
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la récupération de l'entrepôt",
      error: error.message 
    });
  }
};

// ✅ Mettre à jour un entrepôt
exports.updateEntrepot = async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle } = req.body;

    // Vérifier si le nouveau libellé existe déjà
    const existingEntrepot = await prisma.entrepot.findFirst({
      where: { 
        libelle,
        NOT: { id: parseInt(id) }
      }
    });

    if (existingEntrepot) {
      return res.status(400).json({ message: 'Un entrepôt avec ce libellé existe déjà' });
    }

    const updatedEntrepot = await prisma.entrepot.update({
      where: { id: parseInt(id) },
      data: { libelle }
    });

    res.status(200).json(updatedEntrepot);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Entrepôt non trouvé' });
    }
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de l'entrepôt",
      error: error.message 
    });
  }
};

// ✅ Supprimer un entrepôt (avec vérification des stocks)
exports.deleteEntrepot = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'entrepôt contient des stocks
    const stocksCount = await prisma.stock.count({
      where: { entrepotId: parseInt(id) }
    });

    if (stocksCount > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer : entrepôt contient des stocks',
        stocksCount
      });
    }

    const deletedEntrepot = await prisma.entrepot.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ 
      message: 'Entrepôt supprimé avec succès',
      deletedEntrepot 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Entrepôt non trouvé' });
    }
    res.status(500).json({ 
      message: "Erreur lors de la suppression de l'entrepôt",
      error: error.message 
    });
  }
};