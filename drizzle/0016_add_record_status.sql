-- Добавление поля record_status во все таблицы для мягкого удаления
-- Регионы
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regions' AND column_name = 'record_status') THEN
		ALTER TABLE "regions" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Установка значения 'CREATED' для существующих записей в regions
DO $$ BEGIN
	UPDATE "regions" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

-- Установка NOT NULL ограничения для record_status в regions
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regions' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "regions" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Установка значения по умолчанию для новых записей в regions
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regions' AND column_name = 'record_status') THEN
		ALTER TABLE "regions" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Города
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'record_status') THEN
		ALTER TABLE "cities" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "cities" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "cities" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'record_status') THEN
		ALTER TABLE "cities" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Пользователи
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'record_status') THEN
		ALTER TABLE "users" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "users" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "users" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'record_status') THEN
		ALTER TABLE "users" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Виды помощи
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_types' AND column_name = 'record_status') THEN
		ALTER TABLE "help_types" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "help_types" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_types' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "help_types" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_types' AND column_name = 'record_status') THEN
		ALTER TABLE "help_types" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Категории
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'record_status') THEN
		ALTER TABLE "categories" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "categories" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "categories" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'record_status') THEN
		ALTER TABLE "categories" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Типы организаций
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_types' AND column_name = 'record_status') THEN
		ALTER TABLE "organization_types" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "organization_types" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_types' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "organization_types" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_types' AND column_name = 'record_status') THEN
		ALTER TABLE "organization_types" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Организации
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'record_status') THEN
		ALTER TABLE "organizations" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "organizations" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "organizations" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'record_status') THEN
		ALTER TABLE "organizations" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Достижения
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'record_status') THEN
		ALTER TABLE "achievements" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "achievements" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "achievements" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'record_status') THEN
		ALTER TABLE "achievements" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Квесты
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'record_status') THEN
		ALTER TABLE "quests" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "quests" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "quests" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'record_status') THEN
		ALTER TABLE "quests" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

-- Обновления квестов
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quest_updates' AND column_name = 'record_status') THEN
		ALTER TABLE "quest_updates" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED';
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	UPDATE "quest_updates" SET "record_status" = 'CREATED' WHERE "record_status" IS NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quest_updates' AND column_name = 'record_status' AND is_nullable = 'YES') THEN
		ALTER TABLE "quest_updates" ALTER COLUMN "record_status" SET NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quest_updates' AND column_name = 'record_status') THEN
		ALTER TABLE "quest_updates" ALTER COLUMN "record_status" SET DEFAULT 'CREATED';
	END IF;
END $$;
