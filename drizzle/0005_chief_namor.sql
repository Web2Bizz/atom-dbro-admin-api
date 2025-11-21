-- Создаем таблицу quests если её нет, или добавляем недостающие колонки
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quests') THEN
		CREATE TABLE "quests" (
			"id" serial PRIMARY KEY NOT NULL,
			"title" varchar(255) NOT NULL,
			"description" text,
			"status" varchar(20) DEFAULT 'active' NOT NULL,
			"experience_reward" integer DEFAULT 0 NOT NULL,
			"achievement_id" integer NOT NULL,
			"owner_id" integer NOT NULL,
			"created_at" timestamp DEFAULT now(),
			"updated_at" timestamp DEFAULT now()
		);
	ELSE
		-- Добавляем колонки если таблица уже существует
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'achievement_id') THEN
			ALTER TABLE "quests" ADD COLUMN "achievement_id" integer;
		ELSE
			-- Если колонка существует, но имеет другой тип, изменяем тип
			IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'achievement_id' AND data_type != 'integer') THEN
				-- Удаляем внешний ключ если он есть
				ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_achievement_id_achievements_id_fk";
				-- Изменяем тип колонки
				ALTER TABLE "quests" ALTER COLUMN "achievement_id" TYPE integer USING achievement_id::integer;
			END IF;
		END IF;
		
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'owner_id') THEN
			ALTER TABLE "quests" ADD COLUMN "owner_id" integer;
		END IF;
		
		-- Делаем колонки NOT NULL только если в них нет NULL значений
		IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'achievement_id' AND is_nullable = 'YES') THEN
			-- Проверяем, есть ли NULL значения
			IF NOT EXISTS (SELECT 1 FROM quests WHERE achievement_id IS NULL) THEN
				ALTER TABLE "quests" ALTER COLUMN "achievement_id" SET NOT NULL;
			END IF;
		END IF;
		IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'owner_id' AND is_nullable = 'YES') THEN
			IF NOT EXISTS (SELECT 1 FROM quests WHERE owner_id IS NULL) THEN
				ALTER TABLE "quests" ALTER COLUMN "owner_id" SET NOT NULL;
			END IF;
		END IF;
	END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"quest_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "user_quests_user_id_quest_id_unique" UNIQUE("user_id","quest_id")
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'quest_id') THEN
		ALTER TABLE "achievements" ADD COLUMN "quest_id" integer;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quests" ADD CONSTRAINT "quests_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quests" ADD CONSTRAINT "quests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
