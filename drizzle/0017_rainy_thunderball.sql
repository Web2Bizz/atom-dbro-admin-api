-- Создание таблицы categories (если не существует) и добавление record_status
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Добавление record_status в categories, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'categories' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "categories" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Создание таблицы organization_types (если не существует)
CREATE TABLE IF NOT EXISTS "organization_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"record_status" varchar(20) DEFAULT 'CREATED' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Создание таблицы quest_categories (если не существует)
CREATE TABLE IF NOT EXISTS "quest_categories" (
	"quest_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint

-- Создание таблицы quest_updates (если не существует) и добавление record_status
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

-- Добавление record_status в quest_updates, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quest_updates' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "quest_updates" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Удаление таблицы quest_help_types (если существует)
DO $$ BEGIN
	-- Отключаем RLS, если таблица существует
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quest_help_types') THEN
		ALTER TABLE "quest_help_types" DISABLE ROW LEVEL SECURITY;
	END IF;
END $$;
--> statement-breakpoint

DROP TABLE IF EXISTS "quest_help_types" CASCADE;
--> statement-breakpoint

-- Удаление constraint, если существует
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_city_id_cities_id_fk";
--> statement-breakpoint

-- Установка NOT NULL для city_id (с проверкой)
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'city_id' AND is_nullable = 'YES'
	) THEN
		-- Проверяем, нет ли NULL значений
		IF NOT EXISTS (SELECT 1 FROM "quests" WHERE "city_id" IS NULL) THEN
			ALTER TABLE "quests" ALTER COLUMN "city_id" SET NOT NULL;
		END IF;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в achievements, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'achievements' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "achievements" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в cities, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'cities' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "cities" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в help_types, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'help_types' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "help_types" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление organization_type_id в organizations, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'organizations' AND column_name = 'organization_type_id'
	) THEN
		ALTER TABLE "organizations" ADD COLUMN "organization_type_id" integer;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в organizations, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'organizations' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "organizations" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление organization_type_id в quests, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'organization_type_id'
	) THEN
		ALTER TABLE "quests" ADD COLUMN "organization_type_id" integer;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление latitude в quests, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'latitude'
	) THEN
		ALTER TABLE "quests" ADD COLUMN "latitude" numeric(10, 8);
	END IF;
END $$;
--> statement-breakpoint

-- Добавление longitude в quests, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'longitude'
	) THEN
		ALTER TABLE "quests" ADD COLUMN "longitude" numeric(11, 8);
	END IF;
END $$;
--> statement-breakpoint

-- Добавление address в quests, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'address'
	) THEN
		ALTER TABLE "quests" ADD COLUMN "address" text;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление contacts в quests, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'contacts'
	) THEN
		ALTER TABLE "quests" ADD COLUMN "contacts" jsonb;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в quests, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'quests' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "quests" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в regions, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'regions' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "regions" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление avatar_urls в users, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'avatar_urls'
	) THEN
		ALTER TABLE "users" ADD COLUMN "avatar_urls" jsonb;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление role в users, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'role'
	) THEN
		ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'USER' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Изменение типа quest_id в users с integer на integer[]
DO $$ BEGIN
	-- Если колонка не существует, создаем её как массив
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'quest_id'
	) THEN
		ALTER TABLE "users" ADD COLUMN "quest_id" integer[] DEFAULT ARRAY[]::integer[];
	ELSE
		-- Если колонка существует, проверяем её тип
		IF EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_name = 'users' 
			AND column_name = 'quest_id' 
			AND data_type = 'integer'
		) THEN
			-- Удаляем внешний ключ, если он существует
			ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_quest_id_quests_id_fk";
			
			-- Преобразуем существующие данные: NULL -> пустой массив, integer -> массив с одним элементом
			UPDATE "users" 
			SET "quest_id" = CASE 
				WHEN "quest_id" IS NOT NULL THEN ARRAY["quest_id"]::integer
				ELSE ARRAY[]::integer[]
			END
			WHERE "quest_id" IS NOT NULL OR "quest_id" IS NULL;
			
			-- Изменяем тип колонки на integer[]
			ALTER TABLE "users" ALTER COLUMN "quest_id" TYPE integer[] USING 
				CASE 
					WHEN "quest_id" IS NOT NULL THEN ARRAY["quest_id"]::integer
					ELSE ARRAY[]::integer[]
				END;
			
			-- Устанавливаем значение по умолчанию
			ALTER TABLE "users" ALTER COLUMN "quest_id" SET DEFAULT ARRAY[]::integer[];
		ELSE
			-- Если колонка уже имеет тип integer[], но может содержать NULL значения, обновляем их
			IF EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'users' 
				AND column_name = 'quest_id' 
				AND data_type = 'ARRAY'
			) THEN
				-- Обновляем все NULL значения на пустой массив
				UPDATE "users" 
				SET "quest_id" = ARRAY[]::integer[]
				WHERE "quest_id" IS NULL;
				
				-- Устанавливаем значение по умолчанию, если его нет
				IF EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'users' 
					AND column_name = 'quest_id' 
					AND column_default IS NULL
				) THEN
					ALTER TABLE "users" ALTER COLUMN "quest_id" SET DEFAULT ARRAY[]::integer[];
				END IF;
			END IF;
		END IF;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление organisation_id в users, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'organisation_id'
	) THEN
		ALTER TABLE "users" ADD COLUMN "organisation_id" integer;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление record_status в users, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'record_status'
	) THEN
		ALTER TABLE "users" ADD COLUMN "record_status" varchar(20) DEFAULT 'CREATED' NOT NULL;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление constraint для quest_categories_quest_id_quests_id_fk, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quest_categories_quest_id_quests_id_fk'
	) THEN
		ALTER TABLE "quest_categories" ADD CONSTRAINT "quest_categories_quest_id_quests_id_fk" 
		FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление constraint для quest_categories_category_id_categories_id_fk, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quest_categories_category_id_categories_id_fk'
	) THEN
		ALTER TABLE "quest_categories" ADD CONSTRAINT "quest_categories_category_id_categories_id_fk" 
		FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление constraint для quest_updates_quest_id_quests_id_fk, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quest_updates_quest_id_quests_id_fk'
	) THEN
		ALTER TABLE "quest_updates" ADD CONSTRAINT "quest_updates_quest_id_quests_id_fk" 
		FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление constraint для organizations_organization_type_id_organization_types_id_fk, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'organizations_organization_type_id_organization_types_id_fk'
	) THEN
		ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_type_id_organization_types_id_fk" 
		FOREIGN KEY ("organization_type_id") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление constraint для quests_organization_type_id_organization_types_id_fk, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'quests_organization_type_id_organization_types_id_fk'
	) THEN
		ALTER TABLE "quests" ADD CONSTRAINT "quests_organization_type_id_organization_types_id_fk" 
		FOREIGN KEY ("organization_type_id") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Добавление constraint для users_organisation_id_organizations_id_fk, если его нет
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'users_organisation_id_organizations_id_fk'
	) THEN
		ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_organizations_id_fk" 
		FOREIGN KEY ("organisation_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint

-- Удаление колонки organization_types из organizations, если она существует
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'organizations' AND column_name = 'organization_types'
	) THEN
		ALTER TABLE "organizations" DROP COLUMN "organization_types";
	END IF;
END $$;
--> statement-breakpoint

-- Удаление колонки city_id из users, если она существует
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'city_id'
	) THEN
		ALTER TABLE "users" DROP COLUMN "city_id";
	END IF;
END $$;
