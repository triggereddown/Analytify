-- CreateTable
CREATE TABLE "growth_areas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_check_ins" (
    "id" TEXT NOT NULL,
    "growthAreaId" TEXT NOT NULL,
    "checkedDate" TEXT NOT NULL,
    "minutes" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_areas_userId_archivedAt_idx" ON "growth_areas"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "growth_areas_userId_name_key" ON "growth_areas"("userId", "name");

-- CreateIndex
CREATE INDEX "growth_check_ins_growthAreaId_checkedDate_idx" ON "growth_check_ins"("growthAreaId", "checkedDate");

-- CreateIndex
CREATE UNIQUE INDEX "growth_check_ins_growthAreaId_checkedDate_key" ON "growth_check_ins"("growthAreaId", "checkedDate");

-- AddForeignKey
ALTER TABLE "growth_areas" ADD CONSTRAINT "growth_areas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_check_ins" ADD CONSTRAINT "growth_check_ins_growthAreaId_fkey" FOREIGN KEY ("growthAreaId") REFERENCES "growth_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
