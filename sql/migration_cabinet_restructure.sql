-- =============================================
-- МИГРАЦИЯ: Реструктуризация кабинета
-- Рабочие даты специалиста, профиль, RLS
-- =============================================

-- =============================================
-- ТАБЛИЦА: Рабочие даты специалиста (конкретные даты, не шаблон)
-- =============================================

CREATE TABLE IF NOT EXISTS specialist_work_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '20:00',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(specialist_id, work_date)
);

CREATE INDEX idx_specialist_work_dates ON specialist_work_dates(specialist_id, work_date);

-- RLS
ALTER TABLE specialist_work_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read work_dates" ON specialist_work_dates FOR SELECT USING (true);
CREATE POLICY "Public insert work_dates" ON specialist_work_dates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update work_dates" ON specialist_work_dates FOR UPDATE USING (true);
CREATE POLICY "Public delete work_dates" ON specialist_work_dates FOR DELETE USING (true);

-- Разрешить специалистам управлять blocked_slots
CREATE POLICY "Public insert blocked_slots" ON blocked_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete blocked_slots" ON blocked_slots FOR DELETE USING (true);

-- Разрешить обновление профиля специалиста
CREATE POLICY "Public update specialists" ON specialists FOR UPDATE USING (true);

-- =============================================
-- RPC: Обновление профиля специалиста
-- =============================================

CREATE OR REPLACE FUNCTION update_specialist_profile(
    p_specialist_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_specialty TEXT,
    p_skills_summary TEXT,
    p_photo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_specialist RECORD;
BEGIN
    UPDATE specialists
    SET first_name = p_first_name,
        last_name = p_last_name,
        specialty = p_specialty,
        skills_summary = p_skills_summary,
        photo_url = COALESCE(p_photo_url, photo_url)
    WHERE id = p_specialist_id AND is_active = true
    RETURNING id, first_name, last_name, specialty, skills_summary, photo_url
    INTO v_specialist;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Специалист не найден');
    END IF;

    RETURN json_build_object(
        'id', v_specialist.id,
        'first_name', v_specialist.first_name,
        'last_name', v_specialist.last_name,
        'specialty', v_specialist.specialty,
        'skills_summary', v_specialist.skills_summary,
        'photo_url', v_specialist.photo_url
    );
END;
$$;

-- =============================================
-- RPC: Обновлённый get_available_slots
-- Проверяет specialist_work_dates, затем specialist_schedule
-- =============================================

CREATE OR REPLACE FUNCTION get_available_slots(
    p_specialist_id UUID,
    p_date DATE,
    p_duration INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIME;
    v_end_time TIME;
    v_day_of_week INTEGER;
    v_schedule RECORD;
    v_work_date RECORD;
    v_slot_time TIME;
    v_slots JSON[];
    v_is_blocked BOOLEAN;
    v_is_booked BOOLEAN;
    v_found BOOLEAN := false;
BEGIN
    -- 1. Проверяем specialist_work_dates (приоритет)
    SELECT start_time, end_time
    INTO v_work_date
    FROM specialist_work_dates
    WHERE specialist_id = p_specialist_id AND work_date = p_date;

    IF FOUND THEN
        v_start_time := v_work_date.start_time;
        v_end_time := v_work_date.end_time;
        v_found := true;
    END IF;

    -- 2. Если нет в work_dates, проверяем шаблон specialist_schedule
    IF NOT v_found THEN
        v_day_of_week := EXTRACT(DOW FROM p_date);

        SELECT start_time, end_time, is_working
        INTO v_schedule
        FROM specialist_schedule
        WHERE specialist_id = p_specialist_id AND day_of_week = v_day_of_week;

        IF NOT FOUND OR NOT v_schedule.is_working THEN
            RETURN '[]'::JSON;
        END IF;

        v_start_time := v_schedule.start_time;
        v_end_time := v_schedule.end_time;
    END IF;

    -- 3. Генерируем слоты
    v_slots := ARRAY[]::JSON[];
    v_slot_time := v_start_time;

    WHILE v_slot_time + (p_duration || ' minutes')::INTERVAL <= v_end_time LOOP
        -- Проверяем блокировку
        SELECT EXISTS(
            SELECT 1 FROM blocked_slots
            WHERE specialist_id = p_specialist_id AND date = p_date AND time = v_slot_time
        ) INTO v_is_blocked;

        -- Проверяем занятость
        SELECT EXISTS(
            SELECT 1 FROM bookings
            WHERE specialist_id = p_specialist_id
              AND date = p_date
              AND status IN ('confirmed', 'pending')
              AND time < v_slot_time + (p_duration || ' minutes')::INTERVAL
              AND time + (duration || ' minutes')::INTERVAL > v_slot_time
        ) INTO v_is_booked;

        IF NOT v_is_blocked AND NOT v_is_booked THEN
            v_slots := array_append(v_slots, to_json(v_slot_time::TEXT));
        END IF;

        v_slot_time := v_slot_time + '30 minutes'::INTERVAL;
    END LOOP;

    RETURN array_to_json(v_slots);
END;
$$;
