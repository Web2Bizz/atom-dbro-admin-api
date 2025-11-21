-- Создание таблицы categories
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Создание таблицы quest_categories (связь квестов и категорий)
CREATE TABLE IF NOT EXISTS "quest_categories" (
	"quest_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint

-- Создание таблицы quest_updates
CREATE TABLE IF NOT EXISTS "quest_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"text" text NOT NULL,
	"photos" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Добавление новых полей в таблицу quests
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'organization_type_id') THEN
		ALTER TABLE "quests" ADD COLUMN "organization_type_id" integer;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'latitude') THEN
		ALTER TABLE "quests" ADD COLUMN "latitude" numeric(10, 8);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'longitude') THEN
		ALTER TABLE "quests" ADD COLUMN "longitude" numeric(11, 8);
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'address') THEN
		ALTER TABLE "quests" ADD COLUMN "address" text;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'contacts') THEN
		ALTER TABLE "quests" ADD COLUMN "contacts" jsonb;
	END IF;
END $$;
--> statement-breakpoint

-- Делаем city_id обязательным (NOT NULL) в таблице quests
-- ВАЖНО: Если в таблице quests есть записи с NULL в city_id, их нужно обновить перед применением этой миграции
DO $$ BEGIN
	-- Проверяем, есть ли NULL значения
	IF EXISTS (SELECT 1 FROM "quests" WHERE "city_id" IS NULL) THEN
		-- Если есть города, обновляем NULL на первый доступный город
		IF EXISTS (SELECT 1 FROM "cities" LIMIT 1) THEN
			UPDATE "quests" SET "city_id" = (SELECT "id" FROM "cities" LIMIT 1) WHERE "city_id" IS NULL;
		ELSE
			-- Если городов нет, выдаем предупреждение, но не падаем
			RAISE NOTICE 'В таблице quests есть записи с NULL в city_id, но нет городов. Пожалуйста, обновите данные вручную перед применением NOT NULL ограничения.';
		END IF;
	END IF;
	
	-- Затем делаем колонку NOT NULL (только если нет NULL значений)
	IF NOT EXISTS (SELECT 1 FROM "quests" WHERE "city_id" IS NULL) THEN
		IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'city_id' AND is_nullable = 'YES') THEN
			ALTER TABLE "quests" ALTER COLUMN "city_id" SET NOT NULL;
		END IF;
	ELSE
		RAISE NOTICE 'Не удалось установить NOT NULL для city_id, так как есть NULL значения. Обновите данные и примените миграцию снова.';
	END IF;
END $$;
--> statement-breakpoint

-- Добавление внешних ключей для quests
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quests_organization_type_id_organization_types_id_fk'
	) THEN
		ALTER TABLE "quests" ADD CONSTRAINT "quests_organization_type_id_organization_types_id_fk" 
		FOREIGN KEY ("organization_type_id") REFERENCES "organization_types"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление внешних ключей для quest_categories
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quest_categories_quest_id_quests_id_fk'
	) THEN
		ALTER TABLE "quest_categories" ADD CONSTRAINT "quest_categories_quest_id_quests_id_fk" 
		FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quest_categories_category_id_categories_id_fk'
	) THEN
		ALTER TABLE "quest_categories" ADD CONSTRAINT "quest_categories_category_id_categories_id_fk" 
		FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление внешних ключей для quest_updates
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quest_updates_quest_id_quests_id_fk'
	) THEN
		ALTER TABLE "quest_updates" ADD CONSTRAINT "quest_updates_quest_id_quests_id_fk" 
		FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление полей questId и organisationId в таблицу users
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'quest_id') THEN
		ALTER TABLE "users" ADD COLUMN "quest_id" integer;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organisation_id') THEN
		ALTER TABLE "users" ADD COLUMN "organisation_id" integer;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление внешних ключей для users
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'users_quest_id_quests_id_fk'
	) THEN
		ALTER TABLE "users" ADD CONSTRAINT "users_quest_id_quests_id_fk" 
		FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'users_organisation_id_organizations_id_fk'
	) THEN
		ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_organizations_id_fk" 
		FOREIGN KEY ("organisation_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Удаление таблицы quest_help_types (если она существует)
DO $$ BEGIN
	-- Удаляем внешние ключи
	ALTER TABLE "quest_help_types" DROP CONSTRAINT IF EXISTS "quest_help_types_quest_id_quests_id_fk";
	ALTER TABLE "quest_help_types" DROP CONSTRAINT IF EXISTS "quest_help_types_help_type_id_help_types_id_fk";
	
	-- Удаляем таблицу
	DROP TABLE IF EXISTS "quest_help_types";
EXCEPTION
	WHEN undefined_table THEN NULL;
END $$;

