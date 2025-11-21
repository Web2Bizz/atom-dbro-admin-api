DO $$ BEGIN
 ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_quest_id_quests_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "quest_id";

