const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCommandeEtArticles = async (reference_commande) => {
  return await prisma.$transaction(async (prisma) => {
    const commande = await prisma.commandeVente.findUnique({
      where: { reference: reference_commande },
      include: {
        pieces: {
          include: {
            product: true
          }
        }
      }
    });

    if (!commande) {
      throw new Error("Commande introuvable");
    }

    return { 
      commande, 
      articlesCommande: commande.pieces 
    };
  });
};

const reduireStockEtCalculerPrix = async (article) => {
  return await prisma.$transaction(async (prisma) => {
    let quantiteRestante = article.quantite;
    let prixTotal = 0;

    // Trouver les stocks disponibles pour cet article
    const stocks = await prisma.stock.findMany({
      where: { 
        codeArt: article.codeArt,
        quantite: { gt: prisma.stock.fields.quantiteVendu }
      },
      orderBy: { createdAt: 'asc' }
    });

    for (const stock of stocks) {
      if (quantiteRestante <= 0) break;

      const disponible = stock.quantite - stock.quantiteVendu;
      if (disponible <= 0) continue;

      const aVendre = Math.min(quantiteRestante, disponible);
      
      // Mettre à jour le stock
      await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantiteVendu: {
            increment: aVendre
          }
        }
      });

      quantiteRestante -= aVendre;
      prixTotal += aVendre * stock.prixFinal;
    }

    if (quantiteRestante > 0) {
      throw new Error(`Stock insuffisant pour l'article ${article.lib1}`);
    }

    return prixTotal;
  });
};

const creerFacture = async (reference_commande, prix_total) => {
  return await prisma.facture.create({
    data: {
      referenceCommande: reference_commande,
      prixTotal: prix_total,
      status: 'VALIDEE'
    }
  });
};

const mettreAJourStatusCommande = async (commande) => {
  await prisma.commandeVente.update({
    where: { reference: commande.reference },
    data: { status: 'FACTUREE' } // Utilisation d'un enum si défini
  });
};

const creerFactureEtMajStock = async (reference_commande) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const { commande, articlesCommande } = await getCommandeEtArticles(reference_commande);

      let totalFacture = 0;
      for (const article of articlesCommande) {
        const prix = await reduireStockEtCalculerPrix(article);
        totalFacture += prix;
      }

      const facture = await creerFacture(reference_commande, totalFacture);
      await mettreAJourStatusCommande(commande);

      return { 
        success: true, 
        facture, 
        message: "Facture créée et stock mis à jour." 
      };
    });
  } catch (error) {
    return { 
      success: false, 
      message: error.message 
    };
  }
};

module.exports = { 
  getCommandeEtArticles,
  reduireStockEtCalculerPrix,
  creerFacture,
  mettreAJourStatusCommande,
  creerFactureEtMajStock
};