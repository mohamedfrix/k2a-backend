-- CreateEnum
CREATE TYPE "public"."RentalServiceType" AS ENUM ('INDIVIDUAL', 'EVENTS', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "public"."vehicles" ADD COLUMN     "acceleration" TEXT,
ADD COLUMN     "consumption" TEXT,
ADD COLUMN     "engine" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxSpeed" TEXT,
ADD COLUMN     "power" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trunkCapacity" TEXT;

-- CreateTable
CREATE TABLE "public"."vehicle_rental_services" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "rentalServiceType" "public"."RentalServiceType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_rental_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_rental_services_vehicleId_rentalServiceType_key" ON "public"."vehicle_rental_services"("vehicleId", "rentalServiceType");

-- AddForeignKey
ALTER TABLE "public"."vehicle_rental_services" ADD CONSTRAINT "vehicle_rental_services_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
