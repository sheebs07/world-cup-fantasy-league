/*
  Warnings:

  - You are about to drop the column `mlbTeamId` on the `DraftPick` table. All the data in the column will be lost.
  - You are about to drop the `MlbStanding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MlbSyncMeta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MlbTeam` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `countryId` to the `DraftPick` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DraftPick" DROP CONSTRAINT "DraftPick_mlbTeamId_fkey";

-- DropForeignKey
ALTER TABLE "MlbStanding" DROP CONSTRAINT "MlbStanding_mlbTeamId_fkey";

-- AlterTable
ALTER TABLE "DraftPick" DROP COLUMN "mlbTeamId",
ADD COLUMN     "countryId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "MlbStanding";

-- DropTable
DROP TABLE "MlbSyncMeta";

-- DropTable
DROP TABLE "MlbTeam";

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fifaCode" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDiff" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncMeta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_fifaCode_key" ON "Country"("fifaCode");

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
