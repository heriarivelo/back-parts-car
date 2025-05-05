const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { get_Info_stock_detaille, get_detail_vente_article } = require('../service/StockService');

// Recherche multicritère dans le stock
const getOrSearch = async (req, res) => {
  try {
    const {
      lib1,
      marque,
      oem,
      auto,
      page = 1,
      limit = 10
    } = req.body;

    const skip = (page - 1) * limit;
    const whereConditions = {};

    if (lib1) {
      whereConditions.lib1 = { contains: lib1, mode: 'insensitive' };
    }

    if (marque) {
      whereConditions.marque1_marque2 = { contains: marque, mode: 'insensitive' };
    }

    if (oem) {
      whereConditions.oem1_oem2 = { contains: oem, mode: 'insensitive' };
    }

    if (auto) {
      whereConditions.auto_final = { contains: auto, mode: 'insensitive' };
    }

    const [total, stocks] = await Promise.all([
      prisma.vStock.count({ where: whereConditions }),
      prisma.vStock.findMany({
        where: whereConditions,
        skip,
        take: parseInt(limit),
        orderBy: { lib1: 'asc' }
      })
    ]);

    return res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      results: stocks
    });

  } catch (error) {
    console.error("Erreur recherche multicritère :", error);
    res.status(500).json({ 
      error: "Erreur lors de la recherche dans le stock",
      details: error.message 
    });
  }
};

// Obtenir le détail du stock pour un article
const find_stock_detaille = async (req, res) => {
  try {
    const { lib } = req.query;

    if (!lib) {
      return res.status(400).json({ error: "Le paramètre 'lib' est requis." });
    }

    const data = await get_Info_stock_detaille(lib);
    return res.status(200).json(data);

  } catch (err) {
    console.error("Erreur dans find_stock_detaille :", err);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
};

// Obtenir le détail des ventes pour un article
const getDetailArticleVendu = async (req, res) => {
  try {
    const { lib } = req.query;

    if (!lib) {
      return res.status(400).json({ error: "Le paramètre 'lib' est requis." });
    }

    const data = await get_detail_vente_article(lib);
    return res.status(200).json(data);

  } catch (err) {
    console.error("Erreur dans getDetailArticleVendu :", err);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
};

// Obtenir les stocks par entrepôt
const getStocksEntreposes = async (req, res) => {
  try {
    const { entrepotId } = req.query;

    if (!entrepotId) {
      return res.status(400).json({ error: "Le paramètre 'entrepotId' est requis." });
    }

    const entrepot = await prisma.entrepot.findUnique({
      where: { id: parseInt(entrepotId) }
    });

    if (!entrepot) {
      return res.status(404).json({ error: "Entrepôt non trouvé." });
    }

    const stocks = await prisma.stock.findMany({
      where: {
        entrepots: entrepot.libelle
      },
      include: {
        product: true
      }
    });

    res.status(200).json(stocks);
  } catch (error) {
    console.error("Erreur lors de la récupération des stocks :", error);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: error.message 
    });
  }
};

// Rechercher par code article
const findByCode_article = async (req, res) => {
  try {
    const { code_art } = req.query;

    if (!code_art) {
      return res.status(400).json({ error: "Le paramètre 'code_art' est requis." });
    }

    const stocks = await prisma.stock.findMany({
      where: {
        codeArt: { contains: code_art, mode: 'insensitive' }
      },
      include: {
        product: true,
        entrepot: true
      }
    });

    if (stocks.length === 0) {
      return res.status(404).json({ error: 'Aucun stock trouvé' });
    }

    res.status(200).json(stocks);
  } catch (err) {
    res.status(500).json({ 
      error: "Erreur serveur",
      details: err.message 
    });
  }
};

// Mettre à jour l'entrepôt d'un stock
const updateEntrepotStock = async (req, res) => {
  try {
    const { stockId, entrepotId } = req.body;

    if (!stockId || !entrepotId) {
      return res.status(400).json({ message: "stockId et entrepotId sont requis." });
    }

    const entrepot = await prisma.entrepot.findUnique({
      where: { id: parseInt(entrepotId) }
    });

    if (!entrepot) {
      return res.status(404).json({ message: "Entrepôt non trouvé." });
    }

    const updatedStock = await prisma.stock.update({
      where: { id: parseInt(stockId) },
      data: {
        entrepots: entrepot.libelle,
        entrepotId: entrepot.id
      }
    });

    return res.status(200).json({ 
      message: "Entrepôt mis à jour avec succès.", 
      stock: updatedStock 
    });
  } catch (error) {
    console.error("Erreur mise à jour entrepôt :", error);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: error.message 
    });
  }
};

module.exports = {
  getOrSearch,
  find_stock_detaille,
  getStocksEntreposes,
  updateEntrepotStock,
  getDetailArticleVendu,
  findByCode_article
};