const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une commande pour un utilisateur
const createCommandePourUser = async (reference, mail_phone, articles_commande) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      // Création de la commande
      const commande = await prisma.commandeVente.create({
        data: {
          reference,
          mail_phone,
          status: 'EN_ATTENTE' // Utilisation d'un enum si défini dans votre schéma
        }
      });

      // Préparation des articles de commande
      const articles = articles_commande.map(article => ({
        commandeRef: commande.reference,
        codeArt: article.code_art,
        lib1: article.lib1,
        quantite: article.quantite,
        prixArticle: article.prix_article
      }));

      // Création des articles de commande
      await prisma.piecesCommande.createMany({
        data: articles
      });

      return { 
        success: true, 
        message: 'Commande et articles créés avec succès',
        commande 
      };
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    return { 
      success: false, 
      message: 'Erreur lors de la création de la commande',
      error: error.message 
    };
  }
};

// Obtenir une commande avec ses articles
const getCommandeAvecArticles = async (reference) => {
  try {
    const commande = await prisma.commandeVente.findUnique({
      where: { reference },
      include: {
        pieces: {
          include: {
            product: true
          }
        }
      }
    });

    if (!commande) {
      throw new Error("Commande non trouvée");
    }

    return {
      success: true,
      commande,
      articles: commande.pieces
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Obtenir le prix total d'une commande
const getPrixTotal = async (reference_commande) => {
  try {
    const result = await prisma.piecesCommande.aggregate({
      where: { commandeRef: reference_commande },
      _sum: {
        prixArticle: true
      },
      _count: {
        id: true
      }
    });

    return { 
      prix_total: result._sum.prixArticle || 0,
      nombre_articles: result._count.id
    };
  } catch (error) {
    throw error;
  }
};

// Traitement du panier et débit des stocks
const traiterPanier = async (panier) => {
  const stocks_touche = [];
  const stocks_insuffisants = [];

  try {
    await prisma.$transaction(async (prisma) => {
      for (const item of panier) {
        const { lib1, quantite_voulu } = item;

        // Trouver les stocks disponibles pour cet article
        const stocksDispo = await prisma.stock.findMany({
          where: {
            lib1,
            quantite: { gt: prisma.stock.fields.quantiteVendu }
          },
          orderBy: { createdAt: 'asc' }
        });

        let restant = quantite_voulu;

        for (const stock of stocksDispo) {
          if (restant <= 0) break;

          const disponible = stock.quantite - stock.quantiteVendu;
          const quantiteADebiter = Math.min(restant, disponible);

          // Mettre à jour le stock
          const updatedStock = await prisma.stock.update({
            where: { id: stock.id },
            data: {
              quantiteVendu: {
                increment: quantiteADebiter
              }
            }
          });

          stocks_touche.push({
            stock_id: stock.id,
            code_art: stock.codeArt,
            lib1: stock.lib1,
            quantite_disponible: updatedStock.quantite - updatedStock.quantiteVendu,
            quantite_vendue: updatedStock.quantiteVendu,
            quantite_adebite: quantiteADebiter,
            prix_final: stock.prixFinal,
            entrepot: stock.entrepots,
            modif: quantiteADebiter
          });

          restant -= quantiteADebiter;
        }

        if (restant > 0) {
          stocks_insuffisants.push({
            lib1,
            quantite_demandee: quantite_voulu,
            quantite_insuffisante: restant
          });
        }
      }
    });

    return {
      success: stocks_touche,
      errors: stocks_insuffisants
    };
  } catch (error) {
    console.error('Erreur dans traiterPanier:', error);
    throw error;
  }
};

module.exports = { 
  traiterPanier, 
  createCommandePourUser, 
  getCommandeAvecArticles, 
  getPrixTotal  
};