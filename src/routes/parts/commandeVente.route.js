const express = require('express');
const { creerCommande, getfind, createCommandeVente, detailCommande, testCommande } = require('../../controllers/parts/commandeVente.controller');
const router = express.Router();

router.get('/' , getfind);
router.post('/' , createCommandeVente);
router.get('/:reference' , detailCommande);
router.post('/test' , testCommande);

module.exports = router;