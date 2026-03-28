-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."FileUploadStatus" AS ENUM ('pending', 'uploading', 'completed');

-- CreateEnum
CREATE TYPE "public"."ShareType" AS ENUM ('file', 'folder', 'collection', 'paste');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('user', 'uploader');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "size" BIGINT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "folderId" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileUpload" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentBytes" BIGINT NOT NULL DEFAULT 0,
    "totalBytes" BIGINT NOT NULL,
    "status" "public"."FileUploadStatus" NOT NULL DEFAULT 'pending',
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Paste" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Paste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Share" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."ShareType" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "fileId" TEXT,
    "folderId" TEXT,
    "collectionId" TEXT,
    "pasteId" TEXT,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Token" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "userAgent" TEXT,
    "name" TEXT,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "type" "public"."UserType" NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CollectionToFile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionToFile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_id_key" ON "public"."Collection"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "File_id_key" ON "public"."File"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_id_key" ON "public"."FileUpload"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_id_key" ON "public"."Folder"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Paste_id_key" ON "public"."Paste"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Share_collectionId_key" ON "public"."Share"("collectionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Share_fileId_key" ON "public"."Share"("fileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Share_folderId_key" ON "public"."Share"("folderId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Share_id_key" ON "public"."Share"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Share_pasteId_key" ON "public"."Share"("pasteId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Token_hash_key" ON "public"."Token"("hash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Token_id_key" ON "public"."Token"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "public"."User"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username" ASC);

-- CreateIndex
CREATE INDEX "_CollectionToFile_B_index" ON "public"."_CollectionToFile"("B" ASC);

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileUpload" ADD CONSTRAINT "FileUpload_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paste" ADD CONSTRAINT "Paste_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_pasteId_fkey" FOREIGN KEY ("pasteId") REFERENCES "public"."Paste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CollectionToFile" ADD CONSTRAINT "_CollectionToFile_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CollectionToFile" ADD CONSTRAINT "_CollectionToFile_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
