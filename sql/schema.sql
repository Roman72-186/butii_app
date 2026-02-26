-- =============================================
-- BEAUTY STUDIO — Схема базы данных Supabase
-- =============================================
-- Выполнить в Supabase SQL Editor

-- Расширение для хеширования паролей
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- ТАБЛИЦЫ
-- =============================================

-- Админы
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Специалисты
CREATE TABLE specialists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    patronymic TEXT,
    specialty TEXT NOT NULL,
    skills_summary TEXT,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Клиенты (пользователи Mini App)
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Услуги
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Связь специалист ↔ услуга
CREATE TABLE specialist_services (
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (specialist_id, service_id)
);

-- Расписание специалистов (шаблон по дням недели)
CREATE TABLE specialist_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '20:00',
    is_working BOOLEAN DEFAULT true,
    UNIQUE(specialist_id, day_of_week)
);

-- Заблокированные слоты (ручная блокировка специалистом)
CREATE TABLE blocked_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(specialist_id, date, time)
);

-- Записи (бронирования)
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    specialist_id UUID REFERENCES specialists(id),
    service_id UUID REFERENCES services(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    customer_name TEXT,
    customer_phone TEXT,
    comment TEXT,
    source TEXT DEFAULT 'mini_app',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ИНДЕКСЫ
-- =============================================

CREATE INDEX idx_bookings_specialist_date ON bookings(specialist_id, date);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_blocked_slots_specialist_date ON blocked_slots(specialist_id, date);
CREATE INDEX idx_clients_telegram_id ON clients(telegram_id);

-- =============================================
-- RPC: Авторизация (телефон + пароль)
-- =============================================

CREATE OR REPLACE FUNCTION admin_login(p_phone TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Проверяем среди специалистов
    SELECT id, first_name, last_name, specialty, phone
    INTO v_record
    FROM specialists
    WHERE phone = p_phone
      AND password_hash = crypt(p_password, password_hash)
      AND is_active = true;

    IF FOUND THEN
        RETURN json_build_object(
            'id', v_record.id,
            'role', 'specialist',
            'name', v_record.first_name || ' ' || v_record.last_name,
            'specialty', v_record.specialty
        );
    END IF;

    -- Проверяем среди админов
    SELECT id, name, phone
    INTO v_record
    FROM admins
    WHERE phone = p_phone
      AND password_hash = crypt(p_password, password_hash);

    IF FOUND THEN
        RETURN json_build_object(
            'id', v_record.id,
            'role', 'admin',
            'name', v_record.name
        );
    END IF;

    RETURN json_build_object('error', 'Неверный телефон или пароль');
END;
$$;

-- =============================================
-- RPC: Создание специалиста (из админки)
-- =============================================

CREATE OR REPLACE FUNCTION create_specialist(
    p_last_name TEXT,
    p_first_name TEXT,
    p_patronymic TEXT,
    p_specialty TEXT,
    p_skills TEXT,
    p_phone TEXT,
    p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO specialists (last_name, first_name, patronymic, specialty, skills_summary, phone, password_hash)
    VALUES (p_last_name, p_first_name, p_patronymic, p_specialty, p_skills, p_phone, crypt(p_password, gen_salt('bf')))
    RETURNING id INTO v_id;

    -- Создаём расписание по умолчанию (Пн-Сб, 9-20)
    INSERT INTO specialist_schedule (specialist_id, day_of_week, start_time, end_time, is_working)
    SELECT v_id, d, '09:00', '20:00', d BETWEEN 1 AND 6
    FROM generate_series(0, 6) AS d;

    RETURN v_id;
END;
$$;

-- =============================================
-- RPC: Создание админа
-- =============================================

CREATE OR REPLACE FUNCTION create_admin(p_name TEXT, p_phone TEXT, p_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO admins (name, phone, password_hash)
    VALUES (p_name, p_phone, crypt(p_password, gen_salt('bf')))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- =============================================
-- RPC: Доступные слоты для записи
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
    v_schedule RECORD;
    v_day_of_week INTEGER;
    v_slot_time TIME;
    v_slot_end TIME;
    v_slots JSON[];
    v_is_blocked BOOLEAN;
    v_is_booked BOOLEAN;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Получаем расписание на этот день
    SELECT start_time, end_time, is_working
    INTO v_schedule
    FROM specialist_schedule
    WHERE specialist_id = p_specialist_id AND day_of_week = v_day_of_week;

    IF NOT FOUND OR NOT v_schedule.is_working THEN
        RETURN '[]'::JSON;
    END IF;

    v_slots := ARRAY[]::JSON[];
    v_slot_time := v_schedule.start_time;

    WHILE v_slot_time + (p_duration || ' minutes')::INTERVAL <= v_schedule.end_time LOOP
        -- Проверяем блокировку
        SELECT EXISTS(
            SELECT 1 FROM blocked_slots
            WHERE specialist_id = p_specialist_id AND date = p_date AND time = v_slot_time
        ) INTO v_is_blocked;

        -- Проверяем занятость (все слоты, которые пересекаются с этим)
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

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_services ENABLE ROW LEVEL SECURITY;

-- Разрешаем чтение для анонимных пользователей (Mini App)
CREATE POLICY "Public read specialists" ON specialists FOR SELECT USING (is_active = true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read schedule" ON specialist_schedule FOR SELECT USING (true);
CREATE POLICY "Public read blocked" ON blocked_slots FOR SELECT USING (true);
CREATE POLICY "Public read specialist_services" ON specialist_services FOR SELECT USING (true);

-- Разрешаем вставку записей из Mini App
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Public update bookings" ON bookings FOR UPDATE USING (true);

-- Клиенты
CREATE POLICY "Public insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Public update clients" ON clients FOR UPDATE USING (true);

-- Полный доступ через service_role (используется в RPC функциях через SECURITY DEFINER)
-- Для админки: запись/обновление через RPC или service_role

-- =============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ: Создаём первого админа
-- Пароль: admin123 (сменить после первого входа!)
-- =============================================

SELECT create_admin('Администратор', '+79991234567', 'admin123');
