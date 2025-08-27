-- CreateEnum
CREATE TYPE "public"."ClientStatus" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "adresse" TEXT NOT NULL,
    "datePermis" TIMESTAMP(3) NOT NULL,
    "status" "public"."ClientStatus" NOT NULL DEFAULT 'ACTIF',
    "numeroPermis" TEXT,
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "profession" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_nom_prenom_idx" ON "public"."clients"("nom", "prenom");

-- CreateIndex
CREATE INDEX "clients_telephone_idx" ON "public"."clients"("telephone");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "public"."clients"("email");
