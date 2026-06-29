-- Supabase Schema for EnglishPath

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    current_level VARCHAR(2) DEFAULT 'A1' CHECK (current_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    xp INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    goal_reason TEXT,
    goal_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.completed_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    level VARCHAR(2) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    module_id VARCHAR(50) NOT NULL,
    lesson_id VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, level, module_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.personal_dictionary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    word VARCHAR(100) NOT NULL,
    definition TEXT NOT NULL,
    translation TEXT,
    example TEXT,
    level VARCHAR(2) DEFAULT 'B1',
    review_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, word)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_dictionary ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Profiles Policies
CREATE POLICY "Allow public read of profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Completed Lessons Policies
CREATE POLICY "Allow users to read own completed lessons" ON public.completed_lessons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own completed lessons" ON public.completed_lessons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own completed lessons" ON public.completed_lessons
    FOR DELETE USING (auth.uid() = user_id);

-- Personal Dictionary Policies
CREATE POLICY "Allow users to read own dictionary" ON public.personal_dictionary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own dictionary" ON public.personal_dictionary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own dictionary" ON public.personal_dictionary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own dictionary" ON public.personal_dictionary
    FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger function to create profiles entry on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, current_level, xp, daily_streak, last_active)
  VALUES (new.id, new.email, 'A1', 0, 0, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
