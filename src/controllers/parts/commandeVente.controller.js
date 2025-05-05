const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getCommandeAvecArticles, getPrixTotal, traiterPanier } = require('../service/CommandeService');
const { reduireStockEtCalculerPrix } = require('../service/FactureService');

exports.createCommandeVente = async (req, res) => {
  const {
    reference,
    status,
    libelle,
    nom_client,
    mail_phone,
    panier = []
  } = req.body;

  const transaction = await prisma.$transaction(async (prisma) => {
    try {
      const { success: articlesDisponibles, errors: articlesInsuffisants } = await traiterPanier(panier);

      if (articlesDisponibles.length === 0) {
        return res.status(400).json({
          message: 'Commande annulée : stock insuffisant pour tous les articles.',
          erreurs_stock: articlesInsuffisants
        });
      }

      // Création de la commande
      const commande = await prisma.commandeVente.create({
        data: {
          reference,
          status,
          libelle,
          nom_client,
          mail_phone
        }
      });

      // Préparation des articles de commande
      const articlesCommandeData = articlesDisponibles.map(article => ({
        commandeRef: reference,
        codeArt: article.code_art,
        lib1: article.lib1,
        quantite: article.quantite_adebite,
        prixArticle: article.prix_final
      }));

      // Création des articles de commande
      await prisma.piecesCommande.createMany({
        data: articlesCommandeData
      });

      return {
        message: 'Commande enregistrée.',
        articles_commande: articlesCommandeData,
        erreurs_stock: articlesInsuffisants.length > 0 ? articlesInsuffisants : null
      };
    } catch (err) {
      console.error(err);
      throw new Error('Erreur lors de la création de la commande.');
    }
  });

  res.status(201).json(transaction);
};

exports.updateStatusCommande = async (req, res) => {
  const { reference } = req.params;
  const { status } = req.body;

  try {
    const commande = await prisma.commandeVente.update({
      where: { reference },
      data: { status }
    });

    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Status de commande mis à jour", 
      commande 
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour du status", 
      error: err.message 
    });
  }
};

exports.getfind = async (req, res) => {
  try {
    let {
      reference,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 10
    } = req.query;

    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const offset = (page - 1) * pageSize;

    const where = {};
    if (reference) where.reference = reference;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [count, commandes] = await Promise.all([
      prisma.commandeVente.count({ where }),
      prisma.commandeVente.findMany({
        where,
        skip: offset,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          pieces: {
            include: {
              product: true
            }
          }
        }
      })
    ]);

    // Calcul du prix total pour chaque commande
    const commandesAvecTotal = await Promise.all(
      commandes.map(async commande => {
        const { prix_total } = await getPrixTotal(commande.reference);
        return {
          ...commande,
          total_commande: prix_total
        };
      })
    );

    res.json({
      total: count,
      page,
      pageSize,
      data: commandesAvecTotal
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes paginées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
};

exports.detailCommande = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await getCommandeAvecArticles(reference);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({
      message: "Erreur interne lors de la récupération de la commande",
      error: error.message
    });
  }
};

exports.testCommande = async (req, res) => {
  const { panier } = req.body;

  try {
    const result = await traiterPanier(panier);
    res.json(result);
  } catch (error) {
    console.error('Erreur :', error.message);
    res.status(500).json({ error: error.message });
  }
};