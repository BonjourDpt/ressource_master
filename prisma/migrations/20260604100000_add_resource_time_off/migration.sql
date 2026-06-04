-- CreateTable
CREATE TABLE "ResourceTimeOff" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "offPct" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceTimeOff_weekStart_idx" ON "ResourceTimeOff"("weekStart");

-- CreateIndex
CREATE INDEX "ResourceTimeOff_resourceId_weekStart_idx" ON "ResourceTimeOff"("resourceId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTimeOff_resourceId_weekStart_key" ON "ResourceTimeOff"("resourceId", "weekStart");

-- AddForeignKey
ALTER TABLE "ResourceTimeOff" ADD CONSTRAINT "ResourceTimeOff_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
