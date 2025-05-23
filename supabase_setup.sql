-- Создание таблицы для хранения заявок на регистрацию
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_code TEXT NOT NULL
);

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_username TEXT NOT NULL UNIQUE,
  last_name TEXT,
  first_name TEXT,
  middle_name TEXT,
  password TEXT NOT NULL,
  about_me TEXT,
  tags JSONB,
  user_role TEXT CHECK (user_role IN ('student', 'teacher', 'employer')),
  age INTEGER,
  university TEXT,
  faculty TEXT,
  course INTEGER,
  workplace TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_registration_requests_telegram_username ON registration_requests(telegram_username);
CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(telegram_username); 