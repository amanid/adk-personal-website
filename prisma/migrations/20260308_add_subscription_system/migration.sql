-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('DOCUMENT_ACCESS', 'DATA_ACCESS', 'FULL_ACCESS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "PublicationAccessLevel" AS ENUM ('FREE', 'GATED');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'WORKING_PAPER', 'THESIS_DISSERTATION', 'BOOK_CHAPTER', 'TECHNICAL_REPORT', 'PREPRINT', 'ANALYTICAL_REPORT');

-- CreateEnum
CREATE TYPE "ResearchActivityType" AS ENUM ('CONFERENCE_ATTENDED', 'TALK_GIVEN', 'PEER_REVIEW', 'GRANT_RECEIVED', 'MILESTONE', 'WORKSHOP', 'AWARD', 'OTHER');

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "isBestAnswer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "votes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "accessLevel" "PublicationAccessLevel" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "bookTitle" TEXT,
ADD COLUMN     "bookTitleFr" TEXT,
ADD COLUMN     "citationCount" INTEGER,
ADD COLUMN     "conferenceLocation" TEXT,
ADD COLUMN     "conferenceName" TEXT,
ADD COLUMN     "conferenceNameFr" TEXT,
ADD COLUMN     "dataUrl" TEXT,
ADD COLUMN     "doi" TEXT,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "institutionFr" TEXT,
ADD COLUMN     "issue" TEXT,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "pages" TEXT,
ADD COLUMN     "publicationType" "PublicationType" NOT NULL DEFAULT 'ANALYTICAL_REPORT',
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "publisherFr" TEXT,
ADD COLUMN     "url" TEXT,
ADD COLUMN     "volume" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "votes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuestionVote" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerVote" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchActivity" (
    "id" TEXT NOT NULL,
    "type" "ResearchActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "titleFr" TEXT,
    "description" TEXT,
    "descriptionFr" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "locationFr" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVote_questionId_userId_key" ON "QuestionVote"("questionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerVote_answerId_userId_key" ON "AnswerVote"("answerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "QuestionVote" ADD CONSTRAINT "QuestionVote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
