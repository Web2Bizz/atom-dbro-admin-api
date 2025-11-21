-- Исправляющая миграция: добавление колонки quest_id в таблицу achievements
DO $$ BEGIN
    -- Проверяем существование таблицы achievements
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        RAISE EXCEPTION 'Таблица achievements не существует';
    END IF;
    
    -- Добавляем колонку quest_id, если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'quest_id') THEN
        ALTER TABLE achievements ADD COLUMN quest_id integer;
        RAISE NOTICE 'Колонка quest_id добавлена в таблицу achievements';
    ELSE
        RAISE NOTICE 'Колонка quest_id уже существует в таблице achievements';
    END IF;
END $$;
--> statement-breakpoint
-- Добавляем внешний ключ, если его нет
DO $$ BEGIN
    -- Проверяем, существует ли уже внешний ключ
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'achievements' 
            AND constraint_name = 'achievements_quest_id_quests_id_fk'
            AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Проверяем, что таблица quests существует перед созданием внешнего ключа
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quests') THEN
            ALTER TABLE "achievements" ADD CONSTRAINT "achievements_quest_id_quests_id_fk" 
                FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE no action ON UPDATE no action;
            RAISE NOTICE 'Внешний ключ achievements_quest_id_quests_id_fk добавлен';
        ELSE
            RAISE NOTICE 'Таблица quests не существует, внешний ключ не создан';
        END IF;
    ELSE
        RAISE NOTICE 'Внешний ключ achievements_quest_id_quests_id_fk уже существует';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Внешний ключ уже существует';
    WHEN undefined_table THEN 
        RAISE NOTICE 'Таблица quests не существует';
    WHEN OTHERS THEN 
        RAISE NOTICE 'Ошибка при создании внешнего ключа: %', SQLERRM;
END $$;

