import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

// Real Supabase client (only initialized if credentials exist)
export const supabase = !isDemoMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock Profile Types
export interface UserProfile {
  id: string;
  email: string;
  current_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  xp: number;
  daily_streak: number;
  last_active: string;
  goal_reason: string;
  goal_time: string;
  created_at: string;
}

export interface CompletedLesson {
  id: string;
  user_id: string;
  level: string;
  module_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface PersonalDictionaryItem {
  id: string;
  user_id: string;
  word: string;
  definition: string;
  translation: string;
  example: string;
  level: string;
  review_count: number;
  last_reviewed: string | null;
  next_review: string;
  created_at: string;
}

// Client-side local storage key constants
const STORAGE_KEYS = {
  PROFILE: 'englishpath_profile',
  COMPLETED_LESSONS: 'englishpath_completed_lessons',
  DICTIONARY: 'englishpath_dictionary',
  SESSION: 'englishpath_session',
};

// Initial default profile for local storage demo mode
const DEFAULT_PROFILE: UserProfile = {
  id: 'demo-user-123',
  email: 'explorador@englishpath.com',
  current_level: 'A1',
  xp: 0,
  daily_streak: 1,
  last_active: new Date().toISOString(),
  goal_reason: 'Viagens & Carreira',
  goal_time: '15 minutos/dia',
  created_at: new Date().toISOString(),
};

// Helper to get item from localStorage safely
const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to set item in localStorage safely
const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting key ${key} in localStorage:`, error);
  }
};

// Local storage implementation for Demo Mode
export const dbService = {
  async getProfile(): Promise<UserProfile | null> {
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        return null;
      }
      return data as UserProfile;
    } else {
      // Demo Mode
      const profile = getLocalStorageItem<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
      // Automatically check/update streak
      const now = new Date();
      const lastActive = new Date(profile.last_active);
      const diffTime = Math.abs(now.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak lost
        profile.daily_streak = 0;
      } else if (diffDays === 1 && now.getDate() !== lastActive.getDate()) {
        // Increment streak if it's the next day
        profile.daily_streak += 1;
      }
      profile.last_active = now.toISOString();
      setLocalStorageItem(STORAGE_KEYS.PROFILE, profile);
      return profile;
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile in Supabase:', error);
        return null;
      }
      return data as UserProfile;
    } else {
      // Demo Mode
      const profile = getLocalStorageItem<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
      const updated = { ...profile, ...updates, last_active: new Date().toISOString() };
      setLocalStorageItem(STORAGE_KEYS.PROFILE, updated);
      return updated;
    }
  },

  async addXp(amount: number): Promise<UserProfile | null> {
    const profile = await this.getProfile();
    if (!profile) return null;
    const newXp = (profile.xp || 0) + amount;
    return this.updateProfile({ xp: newXp });
  },

  async getCompletedLessons(): Promise<CompletedLesson[]> {
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('completed_lessons')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching completed lessons from Supabase:', error);
        return [];
      }
      return data as CompletedLesson[];
    } else {
      // Demo Mode
      return getLocalStorageItem<CompletedLesson[]>(STORAGE_KEYS.COMPLETED_LESSONS, []);
    }
  },

  async completeLesson(level: string, moduleId: string, lessonId: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('completed_lessons')
        .upsert({
          user_id: user.id,
          level,
          module_id: moduleId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,level,module_id,lesson_id' });

      if (error) {
        console.error('Error completing lesson in Supabase:', error);
        return false;
      }
      await this.addXp(100); // 100 XP per lesson
      return true;
    } else {
      // Demo Mode
      const lessons = getLocalStorageItem<CompletedLesson[]>(STORAGE_KEYS.COMPLETED_LESSONS, []);
      const exists = lessons.some(
        l => l.level === level && l.module_id === moduleId && l.lesson_id === lessonId
      );
      if (!exists) {
        lessons.push({
          id: Math.random().toString(36).substring(7),
          user_id: 'demo-user-123',
          level,
          module_id: moduleId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        });
        setLocalStorageItem(STORAGE_KEYS.COMPLETED_LESSONS, lessons);
        await this.addXp(100);
      }
      return true;
    }
  },

  async getPersonalDictionary(): Promise<PersonalDictionaryItem[]> {
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('personal_dictionary')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dictionary from Supabase:', error);
        return [];
      }
      return data as PersonalDictionaryItem[];
    } else {
      // Demo Mode
      return getLocalStorageItem<PersonalDictionaryItem[]>(STORAGE_KEYS.DICTIONARY, []);
    }
  },

  async addWord(word: string, definition: string, translation = '', example = '', level = 'B1'): Promise<boolean> {
    const formattedWord = word.trim().toLowerCase();
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('personal_dictionary')
        .upsert({
          user_id: user.id,
          word: formattedWord,
          definition,
          translation,
          example,
          level,
          next_review: new Date().toISOString()
        }, { onConflict: 'user_id,word' });

      if (error) {
        console.error('Error adding word to Supabase dictionary:', error);
        return false;
      }
      return true;
    } else {
      // Demo Mode
      const dictionary = getLocalStorageItem<PersonalDictionaryItem[]>(STORAGE_KEYS.DICTIONARY, []);
      const existsIdx = dictionary.findIndex(item => item.word.toLowerCase() === formattedWord);
      
      const newItem: PersonalDictionaryItem = {
        id: existsIdx >= 0 ? dictionary[existsIdx].id : Math.random().toString(36).substring(7),
        user_id: 'demo-user-123',
        word: formattedWord,
        definition,
        translation,
        example,
        level,
        review_count: existsIdx >= 0 ? dictionary[existsIdx].review_count : 0,
        last_reviewed: existsIdx >= 0 ? dictionary[existsIdx].last_reviewed : null,
        next_review: new Date().toISOString(),
        created_at: existsIdx >= 0 ? dictionary[existsIdx].created_at : new Date().toISOString(),
      };

      if (existsIdx >= 0) {
        dictionary[existsIdx] = newItem;
      } else {
        dictionary.push(newItem);
      }
      setLocalStorageItem(STORAGE_KEYS.DICTIONARY, dictionary);
      return true;
    }
  },

  async deleteWord(word: string): Promise<boolean> {
    const formattedWord = word.trim().toLowerCase();
    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('personal_dictionary')
        .delete()
        .eq('user_id', user.id)
        .eq('word', formattedWord);

      if (error) {
        console.error('Error deleting word from Supabase:', error);
        return false;
      }
      return true;
    } else {
      // Demo Mode
      const dictionary = getLocalStorageItem<PersonalDictionaryItem[]>(STORAGE_KEYS.DICTIONARY, []);
      const filtered = dictionary.filter(item => item.word.toLowerCase() !== formattedWord);
      setLocalStorageItem(STORAGE_KEYS.DICTIONARY, filtered);
      return true;
    }
  },

  async updateWordReview(word: string, success: boolean): Promise<boolean> {
    const formattedWord = word.trim().toLowerCase();
    
    // Spaced repetition interval helper: increments review count and schedules next review
    const calculateNextReview = (count: number, successState: boolean): Date => {
      const now = new Date();
      if (!successState) {
        // If fail, review again in 1 hour
        return new Date(now.getTime() + 60 * 60 * 1000);
      }
      // Success intervals: 1 day, 3 days, 7 days, 14 days, 30 days
      const days = [1, 3, 7, 14, 30, 90];
      const intervalDays = days[Math.min(count, days.length - 1)];
      return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    };

    if (!isDemoMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get current review stats
      const { data } = await supabase
        .from('personal_dictionary')
        .select('review_count')
        .eq('user_id', user.id)
        .eq('word', formattedWord)
        .single();
      
      const currentCount = data?.review_count || 0;
      const nextCount = success ? currentCount + 1 : 0;
      const nextReviewDate = calculateNextReview(nextCount, success).toISOString();

      const { error } = await supabase
        .from('personal_dictionary')
        .update({
          review_count: nextCount,
          last_reviewed: new Date().toISOString(),
          next_review: nextReviewDate
        })
        .eq('user_id', user.id)
        .eq('word', formattedWord);

      if (error) {
        console.error('Error updating word review in Supabase:', error);
        return false;
      }
      return true;
    } else {
      // Demo Mode
      const dictionary = getLocalStorageItem<PersonalDictionaryItem[]>(STORAGE_KEYS.DICTIONARY, []);
      const idx = dictionary.findIndex(item => item.word.toLowerCase() === formattedWord);
      if (idx >= 0) {
        const item = dictionary[idx];
        const nextCount = success ? item.review_count + 1 : 0;
        item.review_count = nextCount;
        item.last_reviewed = new Date().toISOString();
        item.next_review = calculateNextReview(nextCount, success).toISOString();
        setLocalStorageItem(STORAGE_KEYS.DICTIONARY, dictionary);
        return true;
      }
      return false;
    }
  }
};
