const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPrixTotal, getCommandeAvecArticles } = require("../../services/parts/commandeVente.service");
const { mettreAJourStatusCommande } = require("../../services/parts/facture.service");

// Générer une facture (prévisualisation)
const GenererFacture = async (req, res) => {
    try {
        const { reference_commande } = req.query;

        if (!reference_commande) {
            return res.status(400).json({ message: "Le paramètre reference_commande est requis" });
        }

        const result = await getCommandeAvecArticles(reference_commande);
        
        res.status(200).json({
            commande: result,
            success: true
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la génération de la facture",
            error: error.message 
        });
    }
}

// Lister les factures avec pagination
const PrendreFacture = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [total, factures] = await Promise.all([
            prisma.facture.count(),
            prisma.facture.findMany({
                skip: offset,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    commandeVente: true,
                    remises: true
                }
            })
        ]);

        // Calculer le prix final après remise pour chaque facture
        const facturesAvecPrixFinal = factures.map(facture => {
            const totalRemises = facture.remises.reduce((sum, remise) => {
                return sum + (remise.prix || (facture.prixTotal * remise.taux / 100));
            }, 0);
            
            return {
                ...facture,
                prixFinal: facture.prixTotal - totalRemises
            };
        });

        res.status(200).json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            data: facturesAvecPrixFinal
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la récupération des factures",
            error: error.message 
        });
    }
}

// Voir une facture spécifique
const VoirFacture = async (req, res) => {
    try {
        const { reference_facture } = req.body;

        if (!reference_facture) {
            return res.status(400).json({ message: "Le paramètre reference_facture est requis" });
        }

        const facture = await prisma.facture.findUnique({
            where: { referenceFacture: reference_facture },
            include: {
                commandeVente: {
                    include: {
                        pieces: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                remises: true
            }
        });

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        // Calcul du total après remise
        const totalRemises = facture.remises.reduce((sum, remise) => {
            return sum + (remise.prix || (facture.prixTotal * remise.taux / 100));
        }, 0);

        res.status(200).json({
            facture: {
                ...facture,
                prixFinal: facture.prixTotal - totalRemises
            },
            success: true
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la récupération de la facture",
            error: error.message 
        });
    }
}

// Valider et créer une facture avec remise
const ValidationFacture = async (req, res) => {
    const {
        reference_commande,
        reference_fact,
        prix_total,
        type_remise,
        remise,
        status = 'VALIDEE'
    } = req.body;

    // Validation des données
    if (!reference_commande || !reference_fact || !prix_total) {
        return res.status(400).json({ error: 'Paramètres requis manquants.' });
    }

    let taux = 0, prix = 0;
    if (type_remise === 'espece') {
        prix = parseFloat(remise);
    } else if (type_remise === 'pourcentage') {
        taux = parseFloat(remise);
        if (taux < 0 || taux > 100) {
            return res.status(400).json({ error: 'Le pourcentage de remise doit être entre 0 et 100.' });
        }
    } else if (type_remise) {
        return res.status(400).json({ error: 'type_remise invalide (espece ou pourcentage).' });
    }

    try {
        const result = await prisma.$transaction(async (prisma) => {
            // Création de la facture
            const facture = await prisma.facture.create({
                data: {
                    referenceFacture: reference_fact,
                    commandeRef: reference_commande,
                    prixTotal: parseFloat(prix_total),
                    status
                }
            });

            // Création de la remise si applicable
            let remiseRecord = null;
            if (type_remise) {
                remiseRecord = await prisma.remise.create({
                    data: {
                        referenceFacture: reference_fact,
                        taux,
                        prix
                    }
                });
            }

            // Mise à jour du statut de la commande
            await mettreAJourStatusCommande(reference_commande);

            return { facture, remise: remiseRecord };
        });

        res.status(201).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Erreur création facture:', error);
        res.status(500).json({ 
            error: 'Erreur interne', 
            details: error.message 
        });
    }
};

// Obtenir les détails d'une facture
const getDetailFacture = async (req, res) => {
    try {
        const { reference } = req.body;
        
        if (!reference) {
            return res.status(400).json({ message: "Le paramètre reference est requis" });
        }

        const details = await getPrixTotal(reference);
        res.status(200).json({
            success: true,
            ...details
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la récupération des détails",
            error: error.message 
        });
    }
}

// Création manuelle de facture
const Creation_manuelle = async (req, res) => {
    try {
        const { reference_commande, reference_Fact, prix_total } = req.body;

        if (!reference_commande || !reference_Fact || !prix_total) {
            return res.status(400).json({ message: "Tous les paramètres sont requis" });
        }

        await prisma.$transaction(async (prisma) => {
            // Création de la facture
            await prisma.facture.create({
                data: {
                    referenceFacture: reference_Fact,
                    commandeRef: reference_commande,
                    prixTotal: parseFloat(prix_total),
                    status: 'VALIDEE'
                }
            });

            // Mise à jour du statut de la commande
            await mettreAJourStatusCommande(reference_commande);
        });

        res.status(201).json({ 
            success: true,
            message: "Facture créée avec succès" 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la création manuelle",
            error: error.message 
        });
    }
}

module.exports = { 
    Creation_manuelle, 
    getDetailFacture, 
    ValidationFacture,
    GenererFacture,  
    PrendreFacture,
    VoirFacture 
};