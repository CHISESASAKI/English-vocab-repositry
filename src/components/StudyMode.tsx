import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import type { Quiz, Word } from '../types';
import { wordsService, studyService } from '../services/database';

interface StudyModeProps {}

const StudyMode: React.FC<StudyModeProps> = () => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [studyMode, setStudyMode] = useState<'normal' | 'difficulty' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [studiedWordIds, setStudiedWordIds] = useState<string[]>([]);

  // データベースから単語を読み込み
  const loadWords = useCallback(async () => {
    try {
      const allWords = await wordsService.getAllWords();
      setWords(allWords);
    } catch (error) {
      console.error('Failed to load words:', error);
      // フォールバック用のサンプルデータ
      setWords(sampleWords);
    }
  }, []);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const sampleWords: Word[] = [
    {
      id: '1',
      english: 'apple',
      japanese: 'りんご',
      difficulty: 1,
      correctCount: 5,
      incorrectCount: 2,
      lastStudied: new Date(),
      createdAt: new Date(),
    },
    {
      id: '2',
      english: 'beautiful',
      japanese: '美しい',
      difficulty: 2,
      correctCount: 3,
      incorrectCount: 4,
      lastStudied: new Date(),
      createdAt: new Date(),
    },
    {
      id: '3',
      english: 'challenge',
      japanese: '挑戦',
      difficulty: 3,
      correctCount: 1,
      incorrectCount: 6,
      lastStudied: new Date(),
      createdAt: new Date(),
    },
    {
      id: '4',
      english: 'extraordinary',
      japanese: '並外れた',
      difficulty: 4,
      correctCount: 0,
      incorrectCount: 8,
      lastStudied: new Date(),
      createdAt: new Date(),
    }
  ];

  const generateQuiz = useCallback((words: Word[]): Quiz => {
    const targetWord = words[Math.floor(Math.random() * words.length)];
    const wrongOptions = words
      .filter(w => w.id !== targetWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.japanese);
    
    const options = [targetWord.japanese, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    return {
      word: targetWord,
      options,
      correctAnswer: targetWord.japanese
    };
  }, []);

  const updateWordDifficulty = useCallback(async (wordId: string, isCorrect: boolean) => {
    try {
      const word = words.find(w => w.id === wordId);
      if (!word) return;

      let newDifficulty = word.difficulty;
      
      if (isCorrect) {
        // 正解の場合：苦手度を下げる（最小1）
        newDifficulty = Math.max(1, word.difficulty - 1) as 1 | 2 | 3 | 4;
      } else {
        // 不正解の場合：苦手度を上げる（最大4）
        newDifficulty = Math.min(4, word.difficulty + 1) as 1 | 2 | 3 | 4;
      }

      const updates: Partial<Word> = {
        difficulty: newDifficulty,
        correctCount: isCorrect ? word.correctCount + 1 : word.correctCount,
        incorrectCount: isCorrect ? word.incorrectCount : word.incorrectCount + 1,
        lastStudied: new Date()
      };

      await wordsService.updateWord(wordId, updates);
      
      // ローカル状態も更新
      setWords(prev => prev.map(w => 
        w.id === wordId ? { ...w, ...updates } : w
      ));
    } catch (error) {
      console.error('Failed to update word difficulty:', error);
    }
  }, [words]);

  const startStudy = useCallback(async (mode: 'normal' | 'difficulty') => {
    setStudyMode(mode);
    setScore({ correct: 0, total: 0 });
    setStudiedWordIds([]);
    setIsLoading(true);

    try {
      // 学習セッションを開始
      const sessionId = await studyService.createSession({
        mode,
        startTime: new Date(),
        totalQuestions: 0,
        correctAnswers: 0,
        wordsStudied: []
      });
      setCurrentSession(sessionId);

      let wordsToStudy: Word[];
      if (mode === 'difficulty') {
        wordsToStudy = words.filter(w => w.difficulty >= 3);
        // データベースに十分な単語がない場合のフォールバック
        if (wordsToStudy.length < 4) {
          wordsToStudy = [...wordsToStudy, ...sampleWords.filter(w => w.difficulty >= 3)];
        }
      } else {
        wordsToStudy = words.length > 0 ? words : sampleWords;
      }

      if (wordsToStudy.length === 0) {
        setIsLoading(false);
        return;
      }

      const quiz = generateQuiz(wordsToStudy);
      setCurrentQuiz(quiz);
      setSelectedAnswer('');
      setIsAnswered(false);
    } catch (error) {
      console.error('Failed to start study session:', error);
    }
    
    setIsLoading(false);
  }, [generateQuiz, words, studyService]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || !currentQuiz) return;

    setIsAnswered(true);
    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    };
    setScore(newScore);

    // 苦手度更新
    await updateWordDifficulty(currentQuiz.word.id, isCorrect);
    
    // 学習した単語IDを記録
    setStudiedWordIds(prev => {
      if (!prev.includes(currentQuiz.word.id)) {
        return [...prev, currentQuiz.word.id];
      }
      return prev;
    });

    // セッション更新
    if (currentSession) {
      try {
        await studyService.updateSession(currentSession, {
          totalQuestions: newScore.total,
          correctAnswers: newScore.correct,
          wordsStudied: [...studiedWordIds, currentQuiz.word.id].filter((id, index, arr) => arr.indexOf(id) === index)
        });
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    }
  }, [selectedAnswer, currentQuiz, score, updateWordDifficulty, currentSession, studiedWordIds, studyService]);

  const handleNextQuestion = useCallback(async () => {
    if (score.total >= 10) {
      // 学習セッション終了
      if (currentSession) {
        try {
          await studyService.updateSession(currentSession, {
            endTime: new Date(),
            totalQuestions: score.total,
            correctAnswers: score.correct,
            wordsStudied: studiedWordIds
          });
        } catch (error) {
          console.error('Failed to end session:', error);
        }
      }
      setShowResult(true);
      return;
    }

    let wordsToStudy: Word[];
    if (studyMode === 'difficulty') {
      wordsToStudy = words.filter(w => w.difficulty >= 3);
      if (wordsToStudy.length < 4) {
        wordsToStudy = [...wordsToStudy, ...sampleWords.filter(w => w.difficulty >= 3)];
      }
    } else {
      wordsToStudy = words.length > 0 ? words : sampleWords;
    }

    const quiz = generateQuiz(wordsToStudy);
    setCurrentQuiz(quiz);
    setSelectedAnswer('');
    setIsAnswered(false);
  }, [score, studyMode, words, generateQuiz, currentSession, studiedWordIds, studyService]);

  const handleRestart = useCallback(() => {
    setStudyMode(null);
    setCurrentQuiz(null);
    setScore({ correct: 0, total: 0 });
    setShowResult(false);
    setIsAnswered(false);
    setSelectedAnswer('');
    setCurrentSession(null);
    setStudiedWordIds([]);
    // 最新の単語データを再読み込み
    loadWords();
  }, [loadWords]);

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'success';
      case 2: return 'warning';
      case 3: return 'error';
      case 4: return 'error';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '簡単';
      case 2: return '普通';
      case 3: return '難しい';
      case 4: return 'とても難しい';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <Typography variant="h6" gutterBottom>
          問題を準備中...
        </Typography>
        <LinearProgress sx={{ width: '100%', mt: 2 }} />
      </Box>
    );
  }

  if (!studyMode) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          学習モード選択
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                通常学習
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                すべての単語からランダムに出題されます。
                バランス良く単語を学習できます。
              </Typography>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={() => startStudy('normal')}
              >
                開始する
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                苦手特訓
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                苦手度が高い単語を重点的に学習します。
                間違いやすい単語を集中的に練習できます。
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth
                onClick={() => startStudy('difficulty')}
              >
                開始する
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            学習統計 ({words.length > 0 ? `${words.length}個の単語` : 'サンプルデータ'})
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {(words.length > 0 ? words : sampleWords).slice(0, 8).map(word => (
              <Card key={word.id} variant="outlined">
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {word.english}
                    </Typography>
                    <Chip 
                      label={getDifficultyText(word.difficulty)} 
                      color={getDifficultyColor(word.difficulty)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {word.japanese}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    正解: {word.correctCount} / 不正解: {word.incorrectCount}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {studyMode === 'normal' ? '通常学習' : '苦手特訓'}
        </Typography>
        <Button variant="outlined" onClick={handleRestart}>
          モード選択に戻る
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body1">
            進捗: {score.total}/10
          </Typography>
          <Typography variant="body1">
            正答率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(score.total / 10) * 100} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {currentQuiz && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                問題 {score.total + 1}
              </Typography>
              <Chip 
                label={getDifficultyText(currentQuiz.word.difficulty)} 
                color={getDifficultyColor(currentQuiz.word.difficulty)}
              />
            </Box>

            <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, py: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {currentQuiz.word.english}
            </Typography>

            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => handleAnswerSelect(e.target.value)}
            >
              {currentQuiz.options.map((option: string, index: number) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                  disabled={isAnswered}
                  sx={{
                    p: 1,
                    m: 0.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: isAnswered 
                      ? (option === currentQuiz.correctAnswer ? 'success.main' : option === selectedAnswer ? 'error.main' : 'grey.300')
                      : 'grey.300',
                    bgcolor: isAnswered 
                      ? (option === currentQuiz.correctAnswer ? 'success.light' : option === selectedAnswer ? 'error.light' : 'transparent')
                      : 'transparent'
                  }}
                />
              ))}
            </RadioGroup>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              {!isAnswered ? (
                <Button
                  variant="contained"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  size="large"
                >
                  回答する
                </Button>
              ) : (
                <Box>
                  {selectedAnswer === currentQuiz.correctAnswer ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      正解です！
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      不正解です。正解は「{currentQuiz.correctAnswer}」でした。
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleNextQuestion}
                    size="large"
                  >
                    {score.total >= 10 ? '結果を見る' : '次の問題'}
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={showResult} onClose={() => setShowResult(false)}>
        <DialogTitle>学習結果</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {score.correct}/{score.total}
            </Typography>
            <Typography variant="h6" gutterBottom>
              正答率: {Math.round((score.correct / score.total) * 100)}%
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {studyMode === 'normal' ? '通常学習' : '苦手特訓'}モードを完了しました！
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResult(false)}>閉じる</Button>
          <Button onClick={handleRestart} variant="contained">
            もう一度学習する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudyMode;