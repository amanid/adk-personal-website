-- Add authors and tags arrays to ResearchActivity
ALTER TABLE "ResearchActivity" ADD COLUMN "authors" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ResearchActivity" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
