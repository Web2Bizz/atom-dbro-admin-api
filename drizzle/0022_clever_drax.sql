-- Добавление поля is_approved в таблицу organizations
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_approved') THEN
		ALTER TABLE "organizations" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Установка значения false для существующих записей, если значение NULL
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_approved') THEN
		UPDATE "organizations" SET "is_approved" = false WHERE "is_approved" IS NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Установка значения по умолчанию false для новых записей
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_approved') THEN
		ALTER TABLE "organizations" ALTER COLUMN "is_approved" SET DEFAULT false;
	END IF;
END $$;
--> statement-breakpoint

-- Установка NOT NULL ограничения для is_approved, если его еще нет
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_approved' AND is_nullable = 'YES') THEN
		UPDATE "organizations" SET "is_approved" = false WHERE "is_approved" IS NULL;
		ALTER TABLE "organizations" ALTER COLUMN "is_approved" SET NOT NULL;
	END IF;
END $$;