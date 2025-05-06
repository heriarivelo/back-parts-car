const express = require('express');
const router = express.Router();
const entrepot = require('../../controllers/parts/entrepos.controller');

router.post('/', entrepot.createEntrepot);
router.get('/', entrepot.getAllEntrepots);
router.get('/:id', entrepot.getEntrepotById);
router.put('/:id', entrepot.updateEntrepot);
router.delete('/:id', entrepot.deleteEntrepot);

module.exports = router;
