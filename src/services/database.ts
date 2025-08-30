import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query, 
  orderBy, 
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { Word, StudySession, VocabBook } from '../types';

// Firebase が設定されていない場合のローカルストレージフォールバック
const useLocalStorage = !isFirebaseConfigured();

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
    if (useLocalStorage) {
      const words = localStorageHelper.getWords();
      const newWord: Word = { ...word, id: Date.now().toString() };
      words.unshift(newWord);
      localStorageHelper.saveWords(words);
      return newWord.id;
    }

    const docRef = await addDoc(collection(db, 'words'), {
      ...word,
      createdAt: Timestamp.fromDate(word.createdAt),
      lastStudied: Timestamp.fromDate(word.lastStudied)
    });
    return docRef.id;
  },

  async addWords(words: Omit<Word, 'id'>[]): Promise<string[]> {
    if (useLocalStorage) {
      const existingWords = localStorageHelper.getWords();
      const newWords: Word[] = words.map(word => ({
        ...word,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));
      existingWords.unshift(...newWords);
      localStorageHelper.saveWords(existingWords);
      return newWords.map(w => w.id);
    }

    const batch = writeBatch(db);
    const ids: string[] = [];

    words.forEach(word => {
      const docRef = doc(collection(db, 'words'));
      batch.set(docRef, {
        ...word,
        createdAt: Timestamp.fromDate(word.createdAt),
        lastStudied: Timestamp.fromDate(word.lastStudied)
      });
      ids.push(docRef.id);
    });

    await batch.commit();
    return ids;
  },

  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    if (useLocalStorage) {
      const words = localStorageHelper.getWords();
      const index = words.findIndex(w => w.id === id);
      if (index !== -1) {
        words[index] = { ...words[index], ...updates };
        localStorageHelper.saveWords(words);
      }
      return;
    }

    const docRef = doc(db, 'words', id);
    const updateData = { ...updates };
    
    if (updates.lastStudied) {
      (updateData as any).lastStudied = Timestamp.fromDate(updates.lastStudied);
    }
    
    await updateDoc(docRef, updateData);
  },

  async deleteWord(id: string): Promise<void> {
    if (useLocalStorage) {
      const words = localStorageHelper.getWords();
      const filteredWords = words.filter(w => w.id !== id);
      localStorageHelper.saveWords(filteredWords);
      return;
    }

    await deleteDoc(doc(db, 'words', id));
  },

  async getAllWords(): Promise<Word[]> {
    if (useLocalStorage) {
      return localStorageHelper.getWords();
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'words'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      lastStudied: doc.data().lastStudied.toDate()
    } as Word));
  },

  async getWordsByDifficulty(difficulty: number): Promise<Word[]> {
    if (useLocalStorage) {
      return localStorageHelper.getWords().filter(w => w.difficulty >= difficulty);
    }

    const querySnapshot = await getDocs(
      query(
        collection(db, 'words'), 
        where('difficulty', '>=', difficulty),
        orderBy('difficulty', 'desc'),
        orderBy('lastStudied', 'asc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      lastStudied: doc.data().lastStudied.toDate()
    } as Word));
  }
};

// 学習セッション関連の操作
export const studyService = {
  async createSession(session: Omit<StudySession, 'id'>): Promise<string> {
    if (useLocalStorage) {
      const sessions = localStorageHelper.getSessions();
      const newSession: StudySession = { ...session, id: Date.now().toString() };
      sessions.unshift(newSession);
      localStorageHelper.saveSessions(sessions);
      return newSession.id;
    }

    const docRef = await addDoc(collection(db, 'studySessions'), {
      ...session,
      startTime: Timestamp.fromDate(session.startTime),
      endTime: session.endTime ? Timestamp.fromDate(session.endTime) : null
    });
    return docRef.id;
  },

  async updateSession(id: string, updates: Partial<StudySession>): Promise<void> {
    if (useLocalStorage) {
      const sessions = localStorageHelper.getSessions();
      const index = sessions.findIndex(s => s.id === id);
      if (index !== -1) {
        sessions[index] = { ...sessions[index], ...updates };
        localStorageHelper.saveSessions(sessions);
      }
      return;
    }

    const docRef = doc(db, 'studySessions', id);
    const updateData = { ...updates };
    
    if (updates.endTime) {
      (updateData as any).endTime = Timestamp.fromDate(updates.endTime);
    }
    
    await updateDoc(docRef, updateData);
  },

  async getRecentSessions(limit: number = 10): Promise<StudySession[]> {
    if (useLocalStorage) {
      return localStorageHelper.getSessions().slice(0, limit);
    }

    const querySnapshot = await getDocs(
      query(
        collection(db, 'studySessions'), 
        orderBy('startTime', 'desc')
      )
    );
    return querySnapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime ? doc.data().endTime.toDate() : undefined
    } as StudySession));
  }
};

// 単語帳関連の操作
export const vocabBookService = {
  async addBook(book: Omit<VocabBook, 'id'>): Promise<string> {
    if (useLocalStorage) {
      // ローカルストレージでは簡略化
      return Date.now().toString();
    }

    const docRef = await addDoc(collection(db, 'vocabBooks'), {
      ...book,
      createdAt: Timestamp.fromDate(book.createdAt)
    });
    return docRef.id;
  },

  async getAllBooks(): Promise<VocabBook[]> {
    if (useLocalStorage) {
      // ローカルストレージでは簡略化して空配列を返す
      return [];
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'vocabBooks'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as VocabBook));
  }
};

// 設定状態を確認する関数をエクスポート
export { isFirebaseConfigured };