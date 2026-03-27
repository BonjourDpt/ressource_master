-- Add capacity to resources (hours/week)
ALTER TABLE "Resource"
ADD COLUMN "capacity" DOUBLE PRECISION NOT NULL DEFAULT 37.5;

