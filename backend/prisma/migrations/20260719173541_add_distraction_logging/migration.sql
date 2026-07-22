-- CreateEnum
CREATE TYPE "DistractionCategory" AS ENUM ('phone', 'social_media', 'noise', 'people', 'hunger_thirst', 'fatigue', 'other');

-- CreateTable
CREATE TABLE "distraction_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" "DistractionCategory" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distraction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "distraction_logs_userId_createdAt_idx" ON "distraction_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "distraction_logs" ADD CONSTRAINT "distraction_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distraction_logs" ADD CONSTRAINT "distraction_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "pomodoro_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
