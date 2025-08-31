import type { Word, StudySession, VocabBook } from '../types';

// 現在は完全にLocalStorageモードで動作
console.log('🔧 LocalStorage モードで動作中 - Firebaseは無効化されています');

// ローカルストレージ用のヘルパー関数
const localStorageHelper = {
  getWords: (): Word[] => {
    const stored = localStorage.getItem('vocab-words');
    return stored ? JSON.parse(stored).map((w: any) => ({
      ...w,
      createdAt: new Date(w.createdAt),
      lastStudied: new Date(w.lastStudied)
    })) : [];
  },
  
  saveWords: (words: Word[]) => {
    localStorage.setItem('vocab-words', JSON.stringify(words));
  },
  
  getSessions: (): StudySession[] => {
    const stored = localStorage.getItem('vocab-sessions');
    return stored ? JSON.parse(stored).map((s: any) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined
    })) : [];
  },
  
  saveSessions: (sessions: StudySession[]) => {
    localStorage.setItem('vocab-sessions', JSON.stringify(sessions));
  }
};

// 単語関連の操作
export const wordsService = {
  async addWord(word: Omit<Word, 'id'>): Promise<string> {
    console.log('💾 Using LocalStorage for single word storage');
    const words = localStorageHelper.getWords();
    const newWord: Word = { ...word, id: Date.now().toString() };
    words.unshift(newWord);
    localStorageHelper.saveWords(words);
    return newWord.id;
  },

  async addWords(words: Omit<Word, 'id'>[]): Promise<string[]> {
    console.log('addWords called with:', { wordsCount: words.length });
    console.log('💾 Using LocalStorage for word storage (Firebase disabled)');
    
    const existingWords = localStorageHelper.getWords();
    const newWords: Word[] = words.map(word => ({
      ...word,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    existingWords.unshift(...newWords);
    localStorageHelper.saveWords(existingWords);
    console.log('✅ Successfully saved to LocalStorage:', newWords.length, 'words');
    return newWords.map(w => w.id);
  },

  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    const words = localStorageHelper.getWords();
    const index = words.findIndex(w => w.id === id);
    if (index !== -1) {
      words[index] = { ...words[index], ...updates };
      localStorageHelper.saveWords(words);
    }
  },

  async deleteWord(id: string): Promise<void> {
    const words = localStorageHelper.getWords();
    const filteredWords = words.filter(w => w.id !== id);
    localStorageHelper.saveWords(filteredWords);
  },

  async getAllWords(): Promise<Word[]> {
    return localStorageHelper.getWords();
  },

  async getWordsByDifficulty(difficulty: number): Promise<Word[]> {
    return localStorageHelper.getWords().filter(w => w.difficulty >= difficulty);
  }
};

// 学習セッション関連の操作
export const studyService = {
  async createSession(session: Omit<StudySession, 'id'>): Promise<string> {
    const sessions = localStorageHelper.getSessions();
    const newSession: StudySession = { ...session, id: Date.now().toString() };
    sessions.unshift(newSession);
    localStorageHelper.saveSessions(sessions);
    return newSession.id;
  },

  async updateSession(id: string, updates: Partial<StudySession>): Promise<void> {
    const sessions = localStorageHelper.getSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      localStorageHelper.saveSessions(sessions);
    }
  },

  async getRecentSessions(limit: number = 10): Promise<StudySession[]> {
    return localStorageHelper.getSessions().slice(0, limit);
  }
};

// 単語帳関連の操作
export const vocabBookService = {
  async addBook(_book: Omit<VocabBook, 'id'>): Promise<string> {
    // ローカルストレージでは簡略化
    return Date.now().toString();
  },

  async getAllBooks(): Promise<VocabBook[]> {
    // ローカルストレージでは簡略化して空配列を返す
    return [];
  }
};

// 設定状態を確認する関数をエクスポート
export const isFirebaseConfigured = () => false;