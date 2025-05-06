require('dotenv').config();
const express = require('express');
const cors = require('cors');


const authRoutes = require('./routes/auth.routes');
const importation = require('./routes/parts/importExcel.route');
const stocksRoute = require('./routes/parts/stocks.route');
const articleRoute = require('./routes/parts/product.route');
const commandeRoute = require('./routes/parts/commandeVente.route');
const factureRoute = require('./routes/parts/facture.route');
const entrepotRoute = require('./routes/parts/entrepots.route');
const analytics = require('./routes/parts/analytics.route');
const pieces = require('./routes/parts/piece.route');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/import" , importation);
app.use("/api/article" , articleRoute);
app.use("/api/stock" , stocksRoute);
app.use("/api/commande" , commandeRoute);
app.use("/api/facture" , factureRoute);
app.use("/api/entrepot" , entrepotRoute);
app.use("/api/analytics" , analytics)
app.use("/api/pieces" , pieces)


const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
