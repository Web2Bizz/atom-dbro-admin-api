-- Исправляющая миграция: изменение типов колонок в таблице quests
DO $$ 
DECLARE
    col_udt_name text;
    constraint_name text;
    max_val bigint;
BEGIN
    -- Сначала убеждаемся, что таблица quests существует
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quests') THEN
        RAISE EXCEPTION 'Таблица quests не существует. Сначала примените миграцию 0005_chief_namor.sql';
    END IF;
    
    -- Создаем колонку achievement_id, если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'achievement_id') THEN
        ALTER TABLE quests ADD COLUMN achievement_id integer;
    END IF;
    
    -- Создаем колонку owner_id, если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'owner_id') THEN
        ALTER TABLE quests ADD COLUMN owner_id integer;
    END IF;
    
    -- Проверяем и исправляем achievement_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'achievement_id') THEN
        -- Получаем текущий тип колонки (udt_name более точный, чем data_type)
        SELECT udt_name INTO col_udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'quests' AND column_name = 'achievement_id';
        
        -- Проверяем, что тип не integer (int4) или serial (int4 с sequence)
        -- int4 = integer, int8 = bigint
        IF col_udt_name = 'int8' OR col_udt_name = 'bigserial' THEN
            -- Проверяем, что все значения помещаются в integer
            SELECT MAX(achievement_id) INTO max_val FROM quests;
            IF max_val IS NOT NULL AND max_val > 2147483647 THEN
                RAISE EXCEPTION 'Значение achievement_id (%) превышает максимальное для integer', max_val;
            END IF;
            
            -- Находим и удаляем все внешние ключи
            FOR constraint_name IN
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = 'quests' 
                    AND kcu.column_name = 'achievement_id'
                    AND tc.constraint_type = 'FOREIGN KEY'
            LOOP
                EXECUTE format('ALTER TABLE quests DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END LOOP;
            
            -- Изменяем тип колонки с bigint на integer
            ALTER TABLE quests ALTER COLUMN achievement_id TYPE integer USING achievement_id::integer;
        ELSIF col_udt_name != 'int4' THEN
            -- Для других типов (например, text, varchar) пробуем преобразовать
            BEGIN
                -- Удаляем внешние ключи
                FOR constraint_name IN
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = 'quests' 
                        AND kcu.column_name = 'achievement_id'
                        AND tc.constraint_type = 'FOREIGN KEY'
                LOOP
                    EXECUTE format('ALTER TABLE quests DROP CONSTRAINT IF EXISTS %I', constraint_name);
                END LOOP;
                
                -- Пробуем преобразовать в integer
                ALTER TABLE quests ALTER COLUMN achievement_id TYPE integer USING achievement_id::integer;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Не удалось преобразовать achievement_id из типа % в integer: %', col_udt_name, SQLERRM;
            END;
        END IF;
        
        -- Устанавливаем NOT NULL если колонка nullable и нет NULL значений
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quests' 
                AND column_name = 'achievement_id' 
                AND is_nullable = 'YES'
        ) THEN
            IF NOT EXISTS (SELECT 1 FROM quests WHERE achievement_id IS NULL) THEN
                ALTER TABLE quests ALTER COLUMN achievement_id SET NOT NULL;
            END IF;
        END IF;
    END IF;
    
    -- Проверяем и исправляем owner_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'owner_id') THEN
        SELECT udt_name INTO col_udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'quests' AND column_name = 'owner_id';
        
        IF col_udt_name = 'int8' OR col_udt_name = 'bigserial' THEN
            SELECT MAX(owner_id) INTO max_val FROM quests;
            IF max_val IS NOT NULL AND max_val > 2147483647 THEN
                RAISE EXCEPTION 'Значение owner_id (%) превышает максимальное для integer', max_val;
            END IF;
            
            FOR constraint_name IN
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = 'quests' 
                    AND kcu.column_name = 'owner_id'
                    AND tc.constraint_type = 'FOREIGN KEY'
            LOOP
                EXECUTE format('ALTER TABLE quests DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END LOOP;
            
            ALTER TABLE quests ALTER COLUMN owner_id TYPE integer USING owner_id::integer;
        ELSIF col_udt_name != 'int4' THEN
            BEGIN
                FOR constraint_name IN
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = 'quests' 
                        AND kcu.column_name = 'owner_id'
                        AND tc.constraint_type = 'FOREIGN KEY'
                LOOP
                    EXECUTE format('ALTER TABLE quests DROP CONSTRAINT IF EXISTS %I', constraint_name);
                END LOOP;
                
                ALTER TABLE quests ALTER COLUMN owner_id TYPE integer USING owner_id::integer;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Не удалось преобразовать owner_id из типа % в integer: %', col_udt_name, SQLERRM;
            END;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quests' 
                AND column_name = 'owner_id' 
                AND is_nullable = 'YES'
        ) THEN
            IF NOT EXISTS (SELECT 1 FROM quests WHERE owner_id IS NULL) THEN
                ALTER TABLE quests ALTER COLUMN owner_id SET NOT NULL;
            END IF;
        END IF;
    END IF;
END $$;
--> statement-breakpoint
-- Восстанавливаем внешние ключи только если колонки существуют
DO $$ BEGIN
    -- Проверяем существование колонки achievement_id перед созданием внешнего ключа
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'achievement_id') THEN
        ALTER TABLE "quests" ADD CONSTRAINT "quests_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE no action ON UPDATE no action;
    END IF;
EXCEPTION
 WHEN duplicate_object THEN null;
 WHEN undefined_table THEN null;
 WHEN undefined_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    -- Проверяем существование колонки owner_id перед созданием внешнего ключа
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quests' AND column_name = 'owner_id') THEN
        ALTER TABLE "quests" ADD CONSTRAINT "quests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
EXCEPTION
 WHEN duplicate_object THEN null;
 WHEN undefined_table THEN null;
 WHEN undefined_column THEN null;
END $$;

