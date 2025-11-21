DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'organization_types') THEN
		ALTER TABLE "organizations" ADD COLUMN "organization_types" jsonb;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'gallery') THEN
		ALTER TABLE "organizations" ADD COLUMN "gallery" jsonb;
	END IF;
END $$;