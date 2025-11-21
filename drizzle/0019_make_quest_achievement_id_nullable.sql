-- Гарантируем, что achievement_id в таблице quests nullable
-- Это позволяет создавать квесты без достижений
DO $$ BEGIN
    -- Проверяем, существует ли колонка achievement_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quests' AND column_name = 'achievement_id'
    ) THEN
        -- Убираем ограничение NOT NULL, если оно есть
        -- Используем DROP NOT NULL, который не вызовет ошибку, если ограничения нет
        BEGIN
            ALTER TABLE "quests" ALTER COLUMN "achievement_id" DROP NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                -- Игнорируем ошибку, если ограничение NOT NULL уже отсутствует
                NULL;
        END;
    END IF;
END $$;
--> statement-breakpoint

