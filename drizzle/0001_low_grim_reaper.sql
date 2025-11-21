DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM information_schema.table_constraints
  WHERE constraint_name = 'help_types_name_unique'
   AND table_name = 'help_types'
 ) THEN
  ALTER TABLE "help_types" ADD CONSTRAINT "help_types_name_unique" UNIQUE("name");
 END IF;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;