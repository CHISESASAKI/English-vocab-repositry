import type { Word, StudySession, VocabBook } from '../types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// Firebase設定状況をチェックして動作モードを決定
const useFirebase = isFirebaseConfigured();
console.log(useFirebase ? '🔥 Firebase Firestore モードで動作中' : '💾 LocalStorage モードで動作中 - Firebase設定が未完了');

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

// Firestore用のヘルパー関数
const firestoreHelper = {
  async addWord(word: Omit<Word, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'words'), {
        ...word,
        createdAt: new Date(),
        lastStudied: new Date()
      });
      console.log('✅ Word saved to Firestore:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Firestore add error:', error);
      throw error;
    }
  },

  async addWords(words: Omit<Word, 'id'>[]): Promise<string[]> {
    const ids: string[] = [];
    try {
      for (const word of words) {
        const id = await this.addWord(word);
        ids.push(id);
      }
      console.log('✅ Successfully saved to Firestore:', ids.length, 'words');
      return ids;
    } catch (error) {
      console.error('❌ Firestore batch add error:', error);
      throw error;
    }
  },

  async getAllWords(): Promise<Word[]> {
    try {
      const q = query(collection(db, 'words'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastStudied: doc.data().lastStudied?.toDate() || new Date()
      })) as Word[];
    } catch (error) {
      console.error('❌ Firestore get error:', error);
      throw error;
    }
  },

  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    try {
      await updateDoc(doc(db, 'words', id), updates);
    } catch (error) {
      console.error('❌ Firestore update error:', error);
      throw error;
    }
  },

  async deleteWord(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'words', id));
    } catch (error) {
      console.error('❌ Firestore delete error:', error);
      throw error;
    }
  }
};

// 単語関連の操作
export const wordsService = {
  async addWord(word: Omit<Word, 'id'>): Promise<string> {
    if (useFirebase) {
      return await firestoreHelper.addWord(word);
    } else {
      console.log('💾 Using LocalStorage for single word storage');
      const words = localStorageHelper.getWords();
      const newWord: Word = { ...word, id: Date.now().toString() };
      words.unshift(newWord);
      localStorageHelper.saveWords(words);
      return newWord.id;
    }
  },

  async addWords(words: Omit<Word, 'id'>[]): Promise<string[]> {
    console.log('addWords called with:', { wordsCount: words.length });
    
    if (useFirebase) {
      return await firestoreHelper.addWords(words);
    } else {
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
    }
  },

  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    if (useFirebase) {
      await firestoreHelper.updateWord(id, updates);
    } else {
      const words = localStorageHelper.getWords();
      const index = words.findIndex(w => w.id === id);
      if (index !== -1) {
        words[index] = { ...words[index], ...updates };
        localStorageHelper.saveWords(words);
      }
    }
  },

  async deleteWord(id: string): Promise<void> {
    if (useFirebase) {
      await firestoreHelper.deleteWord(id);
    } else {
      const words = localStorageHelper.getWords();
      const filteredWords = words.filter(w => w.id !== id);
      localStorageHelper.saveWords(filteredWords);
    }
  },

  async getAllWords(): Promise<Word[]> {
    if (useFirebase) {
      return await firestoreHelper.getAllWords();
    } else {
      return localStorageHelper.getWords();
    }
  },

  async getWordsByDifficulty(difficulty: number): Promise<Word[]> {
    const allWords = await this.getAllWords();
    return allWords.filter(w => w.difficulty >= difficulty);
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

// LocalStorageからFirestoreへのデータ移行機能
export const migrationService = {
  async migrateToFirestore(): Promise<void> {
    if (!useFirebase) {
      throw new Error('Firebase設定が必要です');
    }

    try {
      console.log('🚀 LocalStorageからFirestoreへのデータ移行を開始');
      
      // LocalStorageから既存データを取得
      const localWords = localStorageHelper.getWords();
      const localSessions = localStorageHelper.getSessions();
      
      if (localWords.length === 0) {
        console.log('💾 移行する単語データがありません');
        return;
      }

      // 単語データを移行
      console.log(`📚 ${localWords.length}件の単語を移行中...`);
      const wordPromises = localWords.map(async (word) => {
        const { id, ...wordWithoutId } = word;
        return await firestoreHelper.addWord(wordWithoutId);
      });
      
      await Promise.all(wordPromises);
      console.log('✅ 単語データの移行完了');

      // 移行完了後、LocalStorageをバックアップとして保持
      localStorage.setItem('vocab-words-backup', JSON.stringify(localWords));
      localStorage.setItem('vocab-sessions-backup', JSON.stringify(localSessions));
      console.log('💾 LocalStorageデータをバックアップとして保存');
      
      console.log('🎉 Firestoreへの移行が完了しました');
    } catch (error) {
      console.error('❌ 移行エラー:', error);
      throw error;
    }
  },

  async hasLocalData(): Promise<boolean> {
    return localStorageHelper.getWords().length > 0;
  }
};

// 設定状態を確認する関数をエクスポート
export { isFirebaseConfigured } from '../config/firebase';