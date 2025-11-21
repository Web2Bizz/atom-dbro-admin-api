DO $$ BEGIN
 ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_city_id_cities_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "city_id";

