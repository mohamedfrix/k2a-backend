-- CreateEnum
CREATE TYPE "public"."RentRequestStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'CONTACTED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "public"."rent_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "vehicleId" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER NOT NULL,
    "pricePerDay" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "status" "public"."RentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rent_request_status_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "oldStatus" "public"."RentRequestStatus",
    "newStatus" "public"."RentRequestStatus" NOT NULL,
    "changedBy" TEXT,
    "notes" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rent_request_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rent_requests_requestId_key" ON "public"."rent_requests"("requestId");

-- CreateIndex
CREATE INDEX "rent_requests_status_idx" ON "public"."rent_requests"("status");

-- CreateIndex
CREATE INDEX "rent_requests_clientEmail_idx" ON "public"."rent_requests"("clientEmail");

-- CreateIndex
CREATE INDEX "rent_requests_vehicleId_idx" ON "public"."rent_requests"("vehicleId");

-- CreateIndex
CREATE INDEX "rent_requests_createdAt_idx" ON "public"."rent_requests"("createdAt");

-- CreateIndex
CREATE INDEX "rent_requests_status_createdAt_idx" ON "public"."rent_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "rent_requests_startDate_endDate_idx" ON "public"."rent_requests"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "rent_request_status_history_requestId_idx" ON "public"."rent_request_status_history"("requestId");

-- CreateIndex
CREATE INDEX "rent_request_status_history_changedAt_idx" ON "public"."rent_request_status_history"("changedAt");

-- AddForeignKey
ALTER TABLE "public"."rent_requests" ADD CONSTRAINT "rent_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rent_request_status_history" ADD CONSTRAINT "rent_request_status_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."rent_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
