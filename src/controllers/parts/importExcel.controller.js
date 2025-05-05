const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const create_article_importation = async (req, res) => {
  try {
    const { description, marge, fretAvecDD, fretSansDD, douane, tva, tauxDeChange, fileName, importation } = req.body;
    const status = "Importée";

    // Validation des données
    if (!description || marge == null || !Array.isArray(importation)) {
      return res.status(400).json({ message: 'Champs requis manquants ou invalides.' });
    }

    // Démarrer une transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Création de l'import
      const importRecord = await prisma.import.create({
        data: {
          description,
          marge,
          fretAvecDD: fretAvecDD || 0,
          fretSansDD: fretSansDD || 0,
          douane: douane || 0,
          tva: tva || 0,
          tauxDeChange: tauxDeChange || 1,
          fileName: fileName || '',
          status,
          importedAt: new Date()
        }
      });

      // Traitement de chaque article importé
      for (const item of importation) {
        if (!item.CODE_ART) continue;

        // Création ou mise à jour du produit
        const product = await prisma.product.upsert({
          where: { codeArt: item.CODE_ART },
          update: {
            marque: item.marque || undefined,
            oem: item.oem || undefined,
            autoFinal: item.auto_final || undefined,
            lib: item.LIB1 || undefined
          },
          create: {
            codeArt: item.CODE_ART,
            marque: item.marque || '',
            oem: item.oem || '',
            autoFinal: item.auto_final || '',
            lib: item.LIB1 || ''
          }
        });

        // Création de la partie importée
        await prisma.importedPart.create({
          data: {
            importId: importRecord.id,
            codeArt: item.CODE_ART,
            marque: item.marque || '',
            oem: item.oem || '',
            autoFinal: item.auto_final || '',
            lib1: item.LIB1 || '',
            quantity: item.Qte || 0,
            qttArrive: item.qte_arv || 0,
            poids: item.POIDS_NET || 0,
            purchasePrice: item.PRIX_UNIT || 0,
            salePrice: item.prix_de_vente || 0,
            margin: marge || 0
          }
        });

        // Création ou mise à jour du stock
        await prisma.stock.upsert({
          where: { codeArt: item.CODE_ART },
          update: {
            quantite: { increment: item.qte_arv || 0 },
            prixFinal: item.prix_de_vente || undefined,
            lib1: item.LIB1 || undefined
          },
          create: {
            codeArt: item.CODE_ART,
            lib1: item.LIB1 || '',
            quantite: item.qte_arv || 0,
            quantiteVendu: 0,
            prixFinal: item.prix_de_vente || 0,
            entrepots: 0
          }
        });
      }

      return { importId: importRecord.id };
    });

    return res.status(200).json({
      message: 'Importation insérée avec succès.',
      import_id: result.importId
    });

  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur.', 
      error: error.message 
    });
  }
};

async function enregistrerImportation(importData, importParts) {
    try {
      return await prisma.$transaction(async (prisma) => {
        // 1. Création de l'enregistrement d'importation principal
        const importRecord = await prisma.import.create({
          data: {
            description: importData.description,
            marge: importData.marge,
            fretAvecDD: importData.fretAvecDD || 0,
            fretSansDD: importData.fretSansDD || 0,
            douane: importData.douane || 0,
            tva: importData.tva || 0,
            tauxDeChange: importData.tauxDeChange || 1,
            fileName: importData.fileName || '',
            status: "Importée",
            importedAt: new Date()
          }
        });
  
        // 2. Traitement de chaque article importé
        for (const part of importParts) {
          if (!part.CODE_ART) continue;
  
          // a. Création ou mise à jour du produit
          const product = await prisma.product.upsert({
            where: { codeArt: part.CODE_ART },
            update: {
              marque: part.marque || undefined,
              oem: part.oem || undefined,
              autoFinal: part.auto_final || undefined,
              lib: part.LIB1 || undefined
            },
            create: {
              codeArt: part.CODE_ART,
              marque: part.marque || '',
              oem: part.oem || '',
              autoFinal: part.auto_final || '',
              lib: part.LIB1 || ''
            }
          });
  
          // b. Création de la partie importée
          await prisma.importedPart.create({
            data: {
              importId: importRecord.id,
              codeArt: part.CODE_ART,
              marque: part.marque || '',
              oem: part.oem || '',
              autoFinal: part.auto_final || '',
              lib1: part.LIB1 || '',
              quantity: part.Qte || 0,
              qttArrive: part.qte_arv || 0,
              poids: part.POIDS_NET || 0,
              purchasePrice: part.PRIX_UNIT || 0,
              salePrice: part.prix_de_vente || 0,
              margin: importData.marge || 0
            }
          });
  
          // c. Mise à jour du stock
          await prisma.stock.upsert({
            where: { codeArt: part.CODE_ART },
            update: {
              quantite: { increment: part.qte_arv || 0 },
              prixFinal: part.prix_de_vente || undefined,
              lib1: part.LIB1 || undefined
            },
            create: {
              codeArt: part.CODE_ART,
              lib1: part.LIB1 || '',
              quantite: part.qte_arv || 0,
              quantiteVendu: 0,
              prixFinal: part.prix_de_vente || 0,
              entrepots: 0
            }
          });
        }
  
        return {
          success: true,
          importId: importRecord.id,
          message: 'Importation enregistrée avec succès'
        };
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      return {
        success: false,
        message: "Échec de l'enregistrement",
        error: error.message
      };
    }
};

module.exports = { create_article_importation, enregistrerImportation };