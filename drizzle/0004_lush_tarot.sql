DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE table_name = 'achievements' 
		AND constraint_name = 'achievements_title_unique'
		AND constraint_type = 'UNIQUE'
	) THEN
		ALTER TABLE "achievements" ADD CONSTRAINT "achievements_title_unique" UNIQUE("title");
	END IF;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;