-- Remove existing unique constraint on licensePlate
ALTER TABLE "public"."vehicles" DROP CONSTRAINT IF EXISTS "vehicles_licensePlate_key";

-- Create partial unique index for active vehicles only
CREATE UNIQUE INDEX "vehicles_licensePlate_active_unique" 
ON "public"."vehicles" ("licensePlate") 
WHERE "isActive" = true;

-- Also ensure VIN uniqueness only for active vehicles  
ALTER TABLE "public"."vehicles" DROP CONSTRAINT IF EXISTS "vehicles_vin_key";
CREATE UNIQUE INDEX "vehicles_vin_active_unique" 
ON "public"."vehicles" ("vin") 
WHERE "isActive" = true AND "vin" IS NOT NULL;
