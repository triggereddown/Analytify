-- AlterTable
ALTER TABLE "users" ADD COLUMN     "freezeTokens" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "streak_freezes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coveredDate" TEXT NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_freezes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streak_freezes_userId_idx" ON "streak_freezes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "streak_freezes_userId_coveredDate_key" ON "streak_freezes"("userId", "coveredDate");

-- AddForeignKey
ALTER TABLE "streak_freezes" ADD CONSTRAINT "streak_freezes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
