const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const get_stock_ttl = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const [total, stocks] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) FROM "v_stock"`,
      prisma.$queryRaw`
        SELECT * FROM "v_stock"
        LIMIT ${limit} OFFSET ${offset}
      `
    ]);

    // Conversion du résultat du count (selon votre base de données)
    const totalCount = parseInt(total[0].count || total[0].COUNT);

    return {
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      results: stocks
    };
  } catch (err) {
    console.error('Erreur dans get_stock_ttl:', err);
    throw err;
  }
};

const get_Info_stock_detaille = async (lib1) => {
  try {
    // Utilisation directe de la table Stock avec jointure au produit
    const stocks = await prisma.stock.findMany({
      where: { 
        lib1: { 
          contains: lib1,
          mode: 'insensitive'
        } 
      },
      include: {
        product: true,
        entrepot: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return stocks;
  } catch (err) {
    console.error('Erreur dans get_Info_stock_detaille:', err);
    throw err;
  }
};

const get_detail_vente_article = async (lib1) => {
  try {
    // Utilisation de la vue via une requête raw
    const details = await prisma.$queryRaw`
      SELECT * FROM "v_commande_vente"
      WHERE "lib1" ILIKE ${`%${lib1}%`}
    `;

    return details;
  } catch (err) {
    console.error('Erreur dans get_detail_vente_article:', err);
    throw err;
  }
};

module.exports = { 
  get_stock_ttl, 
  get_Info_stock_detaille, 
  get_detail_vente_article 
};