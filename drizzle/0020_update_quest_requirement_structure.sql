-- Миграция для обновления структуры requirement в steps квестов
-- Заменяет requirement.value на requirement.currentValue и requirement.targetValue
DO $$
DECLARE
    quest_record RECORD;
    updated_steps JSONB;
    step_item JSONB;
    step_index INT;
    requirement_obj JSONB;
    old_value NUMERIC;
BEGIN
    -- Проходим по всем квестам, у которых есть steps
    FOR quest_record IN 
        SELECT id, steps 
        FROM quests 
        WHERE steps IS NOT NULL AND jsonb_typeof(steps) = 'array'
    LOOP
        updated_steps := quest_record.steps;
        
        -- Проходим по каждому этапу в steps
        FOR step_index IN 0..jsonb_array_length(updated_steps) - 1 LOOP
            step_item := updated_steps->step_index;
            
            -- Проверяем, есть ли requirement в этапе
            IF step_item ? 'requirement' AND step_item->'requirement' IS NOT NULL THEN
                requirement_obj := step_item->'requirement';
                
                -- Проверяем, есть ли старое поле value
                IF requirement_obj ? 'value' THEN
                    -- Получаем старое значение value
                    old_value := (requirement_obj->>'value')::NUMERIC;
                    
                    -- Создаем новый объект requirement с currentValue и targetValue
                    requirement_obj := jsonb_build_object(
                        'currentValue', 0,
                        'targetValue', COALESCE(old_value, 0)
                    );
                    
                    -- Обновляем requirement в этапе
                    step_item := jsonb_set(step_item, '{requirement}', requirement_obj);
                    
                    -- Обновляем этап в массиве steps
                    updated_steps := jsonb_set(
                        updated_steps, 
                        ARRAY[step_index::text], 
                        step_item
                    );
                ELSIF NOT (requirement_obj ? 'currentValue') OR NOT (requirement_obj ? 'targetValue') THEN
                    -- Если requirement есть, но нет currentValue или targetValue, 
                    -- устанавливаем значения по умолчанию
                    requirement_obj := jsonb_build_object(
                        'currentValue', COALESCE((requirement_obj->>'currentValue')::NUMERIC, 0),
                        'targetValue', COALESCE((requirement_obj->>'targetValue')::NUMERIC, 0)
                    );
                    
                    -- Обновляем requirement в этапе
                    step_item := jsonb_set(step_item, '{requirement}', requirement_obj);
                    
                    -- Обновляем этап в массиве steps
                    updated_steps := jsonb_set(
                        updated_steps, 
                        ARRAY[step_index::text], 
                        step_item
                    );
                END IF;
            END IF;
        END LOOP;
        
        -- Обновляем квест с новыми steps
        UPDATE quests 
        SET steps = updated_steps, updated_at = NOW()
        WHERE id = quest_record.id;
    END LOOP;
    
    RAISE NOTICE 'Миграция структуры requirement завершена';
END $$;
--> statement-breakpoint

