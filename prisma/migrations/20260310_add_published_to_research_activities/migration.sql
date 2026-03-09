-- Add published flag to ResearchActivity
ALTER TABLE "ResearchActivity" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
