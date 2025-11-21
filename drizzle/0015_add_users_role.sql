-- Добавление поля role в таблицу users
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
		ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'USER';
	END IF;
END $$;
--> statement-breakpoint

-- Установка значения 'USER' для существующих записей
DO $$ BEGIN
	UPDATE "users" SET "role" = 'USER' WHERE "role" IS NULL;
END $$;
--> statement-breakpoint

-- Установка NOT NULL ограничения для role
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND is_nullable = 'YES') THEN
		ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Установка значения по умолчанию для новых записей
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
		ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
	END IF;
END $$;

