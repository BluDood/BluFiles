-- AlterTable
ALTER TABLE "User" ADD COLUMN     "collectionLimit" INTEGER,
ADD COLUMN     "fileLimit" INTEGER,
ADD COLUMN     "folderLimit" INTEGER,
ADD COLUMN     "pasteLimit" INTEGER,
ADD COLUMN     "shareLimit" INTEGER,
ADD COLUMN     "storageLimit" BIGINT,
ADD COLUMN     "tokenLimit" INTEGER;
