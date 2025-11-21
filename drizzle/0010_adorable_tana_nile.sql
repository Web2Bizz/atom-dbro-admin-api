CREATE TABLE IF NOT EXISTS "quest_help_types" (
	"quest_id" integer NOT NULL,
	"help_type_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'city_id') THEN
		ALTER TABLE "quests" ADD COLUMN "city_id" integer;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'cover_image') THEN
		ALTER TABLE "quests" ADD COLUMN "cover_image" varchar(500);
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'gallery') THEN
		ALTER TABLE "quests" ADD COLUMN "gallery" jsonb;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'steps') THEN
		ALTER TABLE "quests" ADD COLUMN "steps" jsonb;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'city_id') THEN
		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE table_name = 'quests' 
			AND constraint_name = 'quests_city_id_cities_id_fk'
		) THEN
			ALTER TABLE "quests" ADD CONSTRAINT "quests_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE no action ON UPDATE no action;
		END IF;
	END IF;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quest_help_types" ADD CONSTRAINT "quest_help_types_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quest_help_types" ADD CONSTRAINT "quest_help_types_help_type_id_help_types_id_fk" FOREIGN KEY ("help_type_id") REFERENCES "help_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
