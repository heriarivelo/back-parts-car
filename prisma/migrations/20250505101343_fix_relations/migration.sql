-- CreateEnum
CREATE TYPE "CommandeStatus" AS ENUM ('EN_ATTENTE', 'TRAITEMENT', 'LIVREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('DISPONIBLE', 'RUPTURE', 'COMMANDE', 'PREORDER', 'RESERVE', 'RETOUR', 'DEFECTUEUX');

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "code_art" TEXT NOT NULL,
    "marque" TEXT,
    "oem" TEXT,
    "auto_final" TEXT,
    "lib" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Import" (
    "id" SERIAL NOT NULL,
    "tauxDeChange" DECIMAL(65,30) NOT NULL,
    "fretAvecDD" DECIMAL(65,30) NOT NULL,
    "fretSansDD" DECIMAL(65,30) NOT NULL,
    "douane" DECIMAL(65,30) NOT NULL,
    "tva" DECIMAL(65,30) NOT NULL,
    "marge" DECIMAL(65,30) NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportedPart" (
    "id" SERIAL NOT NULL,
    "importId" INTEGER NOT NULL,
    "code_art" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "oem" TEXT NOT NULL,
    "auto_final" TEXT NOT NULL,
    "lib1" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "qtt_arrive" INTEGER NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DECIMAL(65,30) NOT NULL,
    "salePrice" DECIMAL(65,30) NOT NULL,
    "margin" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportedPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrepot" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrepot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "code_art" TEXT NOT NULL,
    "entrepots" INTEGER NOT NULL DEFAULT 0,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantite_vendu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prix_final" DECIMAL(65,30),
    "status" "StockStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandeVente" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "nom_client" TEXT,
    "mail_phone" TEXT,
    "libelle" TEXT,
    "status" "CommandeStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandeVente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiecesCommande" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "code_art" TEXT NOT NULL,
    "lib1" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "prix_article" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiecesCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" SERIAL NOT NULL,
    "reference_commande" TEXT NOT NULL,
    "reference_fact" TEXT NOT NULL,
    "prix_total" DOUBLE PRECISION NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remise" (
    "id" SERIAL NOT NULL,
    "reference_fact" TEXT NOT NULL,
    "taux" DOUBLE PRECISION NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_art_key" ON "Product"("code_art");

-- CreateIndex
CREATE UNIQUE INDEX "Entrepot_libelle_key" ON "Entrepot"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "CommandeVente_reference_key" ON "CommandeVente"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_reference_fact_key" ON "Facture"("reference_fact");

-- AddForeignKey
ALTER TABLE "ImportedPart" ADD CONSTRAINT "ImportedPart_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedPart" ADD CONSTRAINT "ImportedPart_code_art_fkey" FOREIGN KEY ("code_art") REFERENCES "Product"("code_art") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_code_art_fkey" FOREIGN KEY ("code_art") REFERENCES "Product"("code_art") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_entrepots_fkey" FOREIGN KEY ("entrepots") REFERENCES "Entrepot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiecesCommande" ADD CONSTRAINT "PiecesCommande_reference_fkey" FOREIGN KEY ("reference") REFERENCES "CommandeVente"("reference") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiecesCommande" ADD CONSTRAINT "PiecesCommande_code_art_fkey" FOREIGN KEY ("code_art") REFERENCES "Product"("code_art") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_reference_commande_fkey" FOREIGN KEY ("reference_commande") REFERENCES "CommandeVente"("reference") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remise" ADD CONSTRAINT "Remise_reference_fact_fkey" FOREIGN KEY ("reference_fact") REFERENCES "Facture"("reference_fact") ON DELETE RESTRICT ON UPDATE CASCADE;
