-- CreateEnum
CREATE TYPE "MemoryNoteCategory" AS ENUM ('idea', 'fact', 'task', 'reflection', 'resource');

-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "memory_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "MemoryNoteCategory" NOT NULL,
    "tags" TEXT[],
    "sourceContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "memory_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "goal" TEXT,
    "totalDays" INTEGER NOT NULL,
    "status" "LearningPathStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_tasks" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "learning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_notes_userId_createdAt_idx" ON "memory_notes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "memory_notes_userId_category_idx" ON "memory_notes"("userId", "category");

-- CreateIndex
CREATE INDEX "learning_paths_userId_status_idx" ON "learning_paths"("userId", "status");

-- CreateIndex
CREATE INDEX "learning_tasks_pathId_idx" ON "learning_tasks"("pathId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_tasks_pathId_dayNumber_key" ON "learning_tasks"("pathId", "dayNumber");

-- AddForeignKey
ALTER TABLE "memory_notes" ADD CONSTRAINT "memory_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
