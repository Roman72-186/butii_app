-- =============================================
-- МИГРАЦИЯ: Авторизация клиентов (телефон + пароль)
-- =============================================
-- Выполнить в Supabase SQL Editor

-- Новые столбцы в clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bonuses INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES clients(id);

-- Уникальность телефона (для логина)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clients_phone_key'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_phone_key UNIQUE (phone);
    END IF;
END $$;

-- =============================================
-- RPC: Регистрация клиента
-- =============================================

CREATE OR REPLACE FUNCTION client_register(p_phone TEXT, p_password TEXT, p_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client RECORD;
    v_ref_code TEXT;
BEGIN
    -- Проверка: телефон уже есть?
    IF EXISTS (SELECT 1 FROM clients WHERE phone = p_phone AND password_hash IS NOT NULL) THEN
        RETURN json_build_object('error', 'Пользователь с таким телефоном уже зарегистрирован');
    END IF;

    -- Генерируем реферальный код
    v_ref_code := 'REF' || upper(substr(md5(random()::text), 1, 8));

    -- Если клиент уже есть (без пароля, например из бронирования) — обновляем
    IF EXISTS (SELECT 1 FROM clients WHERE phone = p_phone) THEN
        UPDATE clients
        SET password_hash = crypt(p_password, gen_salt('bf')),
            name = p_name,
            referral_code = v_ref_code
        WHERE phone = p_phone
        RETURNING id, name, phone, bonuses, referral_code INTO v_client;
    ELSE
        INSERT INTO clients (phone, password_hash, name, bonuses, referral_code)
        VALUES (p_phone, crypt(p_password, gen_salt('bf')), p_name, 0, v_ref_code)
        RETURNING id, name, phone, bonuses, referral_code INTO v_client;
    END IF;

    RETURN json_build_object(
        'id', v_client.id,
        'name', v_client.name,
        'phone', v_client.phone,
        'bonuses', COALESCE(v_client.bonuses, 0),
        'referral_code', v_client.referral_code
    );
END;
$$;

-- =============================================
-- RPC: Вход клиента
-- =============================================

CREATE OR REPLACE FUNCTION client_login(p_phone TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client RECORD;
BEGIN
    SELECT id, name, phone, bonuses, referral_code
    INTO v_client
    FROM clients
    WHERE phone = p_phone
      AND password_hash IS NOT NULL
      AND password_hash = crypt(p_password, password_hash);

    IF FOUND THEN
        RETURN json_build_object(
            'id', v_client.id,
            'role', 'client',
            'name', v_client.name,
            'phone', v_client.phone,
            'bonuses', COALESCE(v_client.bonuses, 0),
            'referral_code', v_client.referral_code
        );
    END IF;

    RETURN json_build_object('error', 'Неверный телефон или пароль');
END;
$$;
