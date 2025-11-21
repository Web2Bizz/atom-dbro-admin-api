-- Изменение внешнего ключа users_organisation_id_organizations_id_fk для каскадного удаления с установкой NULL
DO $$ BEGIN
	-- Удаляем существующий внешний ключ
	IF EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'users_organisation_id_organizations_id_fk'
	) THEN
		ALTER TABLE "users" DROP CONSTRAINT "users_organisation_id_organizations_id_fk";
	END IF;
END $$;
--> statement-breakpoint

-- Создаем новый внешний ключ с ON DELETE SET NULL
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'users_organisation_id_organizations_id_fk'
	) THEN
		ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_organizations_id_fk" 
		FOREIGN KEY ("organisation_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE no action;
	END IF;
END $$;

