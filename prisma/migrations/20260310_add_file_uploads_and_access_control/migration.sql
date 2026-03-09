-- Add file upload and access control fields to ResearchActivity
ALTER TABLE "ResearchActivity" ADD COLUMN "paperUrl" TEXT;
ALTER TABLE "ResearchActivity" ADD COLUMN "dataUrl" TEXT;
ALTER TABLE "ResearchActivity" ADD COLUMN "supplementaryUrl" TEXT;
ALTER TABLE "ResearchActivity" ADD COLUMN "accessLevel" "PublicationAccessLevel" NOT NULL DEFAULT 'FREE';

-- Add supplementary file URL to Publication
ALTER TABLE "Publication" ADD COLUMN "supplementaryUrl" TEXT;
