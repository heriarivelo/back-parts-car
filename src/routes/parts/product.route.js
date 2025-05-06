const express = require('express');
const { getArticle,  } = require('../../controllers/parts/productController');
const router = express.Router();

router.post('/', getArticle);

module.exports = router;