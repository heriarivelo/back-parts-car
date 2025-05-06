const express = require('express');
const { GenererFacture, ValidationFacture, getDetailFacture, Creation_manuelle, VoirFacture, PrendreFacture } = require('../../controllers/parts/facture.controller');
const router = express.Router();


router.get('/', GenererFacture);
router.get('/All', PrendreFacture);
router.post('/valider', ValidationFacture);
router.get('/vue', VoirFacture);
router.post('/', Creation_manuelle);

module.exports = router;


// ALTER TABLE articles_commande
// DROP COLUMN code_art;
