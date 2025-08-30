export interface Word {
  id: string;
  english: string;
  japanese: string;
  difficulty: 1 | 2 | 3 | 4;
  correctCount: number;
  incorrectCount: number;
  lastStudied: Date;
  createdAt: Date;
  bookId?: string;
}

export interface StudySession {
  id: string;
  mode: 'normal' | 'difficulty';
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  correctAnswers: number;
  wordsStudied: string[];
}

export interface Quiz {
  word: Word;
  options: string[];
  correctAnswer: string;
}

export interface VocabBook {
  id: string;
  name: string;
  imageUrl?: string;
  wordsCount: number;
  createdAt: Date;
}