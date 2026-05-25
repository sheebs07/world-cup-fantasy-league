/*
  Warnings:

  - A unique constraint covering the columns `[fifaId]` on the table `Country` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fifaId` to the `Country` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "fifaId" TEXT NOT NULL,
ADD COLUMN     "flagUrl" TEXT,
ALTER COLUMN "group" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Country_fifaId_key" ON "Country"("fifaId");
