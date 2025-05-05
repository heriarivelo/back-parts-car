const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createViews() {
  try {
    // Vue 1: v_detail_importation
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW v_detail_importation AS
      SELECT 
        d.id,
        d."code_art",
        p.marque as marque1_marque2,
        p.oem as oem1_oem2,
        p."auto_final",
        p.lib as LIB1,
        d.quantity as qte,
        d."qtt_arrive" as qte_arr,
        d."purchasePrice" as prix_unit,
        d.poids as poids_net,
        d."createdAt",
        d."updatedAt"
      FROM 
        "ImportedPart" d
      JOIN 
        "Product" p ON d."code_art" = p."code_art"
    `;

    // Vue 2: v_stock
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW v_stock AS
      SELECT 
        s.id,
        s.code_art as code_art,
        p.lib as lib1,
        SUM(s.quantite - s.quantite_vendu) AS qte_ttl,
        p.marque as marque1_marque2,
        p.oem as oem1_oem2,
        p."auto_final",
        CASE 
          WHEN AVG(s.prix_final) < 100000 THEN ROUND(AVG(s.prix_final) / 100.0) * 100
          ELSE ROUND(AVG(s.prix_final) / 1000.0) * 1000
        END AS prix_final,
        MAX(s."createdAt") as "createdAt",
        MAX(s."updatedAt") as "updatedAt"
      FROM 
        "Stock" s
      JOIN 
        "Product" p ON s."code_art" = p."code_art"
      GROUP BY 
        s.id, s."code_art", p.lib, p.marque, p.oem, p.auto_final
    `;

    // Vue 3: v_commande_vente
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW v_commande_vente AS
      SELECT 
        c.id,
        c.reference,
        c.mail_phone as mail_phone,
        pc.lib1,
        SUM(pc.quantite) AS total_quantite,
        pc.prix_article as prix_article,
        SUM(pc.quantite * pc.prix_article) AS prix_total,
        MAX(pc."createdAt") as "createdAt",
        MAX(pc."updatedAt") as "updatedAt"
      FROM 
        "CommandeVente" c
      JOIN 
        "PiecesCommande" pc ON c.reference = pc.reference
      GROUP BY 
        c.id, c.reference, c.mail_phone, pc.lib1, pc.prix_article
    `;

    console.log('Vues créées avec succès!');
  } catch (error) {
    console.error('Erreur lors de la création des vues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createViews();