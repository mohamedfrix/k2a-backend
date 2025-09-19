-- CreateTable
CREATE TABLE "vehicle_accessories" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_accessories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_accessories_vehicleId_idx" ON "vehicle_accessories"("vehicleId");

-- AddForeignKey
ALTER TABLE "vehicle_accessories" ADD CONSTRAINT "vehicle_accessories_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
