const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getArticle = async (req, res) => {
    try {
        const { 
            code_art, 
            marque, 
            oem, 
            auto_final, 
            lib,
            page = 1,
            limit = 10
        } = req.body;

        const offset = (page - 1) * limit;
        const whereConditions = {};

        if (lib) {
            whereConditions.lib = { contains: lib, mode: 'insensitive' };
        }
    
        if (marque) {
            whereConditions.marque = { contains: marque, mode: 'insensitive' };
        }
    
        if (oem) {
            whereConditions.oem1 = { contains: oem1, mode: 'insensitive' };
        }
    
        if (auto_final) {
            whereConditions.auto_final = { contains: auto_final, mode: 'insensitive' };
        }

        if (code_art) {
            whereConditions.codeArt = { contains: code_art, mode: 'insensitive' };
        }

        const [count, products] = await Promise.all([
            prisma.product.count({ where: whereConditions }),
            prisma.product.findMany({
                where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
                skip: offset,
                take: parseInt(limit)
            })
        ]);

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            results: products
        });

    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la récupération des produits",
            error: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const updated = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json({ message: 'Produit mis à jour', updated });
    } catch (err) {
        res.status(400).json({ 
            message: "Erreur lors de la mise à jour du produit",
            error: err.message 
        });
    }
};

module.exports = { getArticle, update };