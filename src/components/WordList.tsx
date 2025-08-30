import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Refresh } from '@mui/icons-material';
import type { Word } from '../types';
import { wordsService } from '../services/database';

interface WordListProps {}

const WordList: React.FC<WordListProps> = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<number | 'all'>('all');
  const [newWord, setNewWord] = useState<Partial<Word>>({
    english: '',
    japanese: '',
    difficulty: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sampleWords: Word[] = [
    {
      id: '1',
      english: 'apple',
      japanese: 'りんご',
      difficulty: 1,
      correctCount: 5,
      incorrectCount: 2,
      lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 24),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      id: '2',
      english: 'beautiful',
      japanese: '美しい',
      difficulty: 2,
      correctCount: 3,
      incorrectCount: 4,
      lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 12),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: '3',
      english: 'challenge',
      japanese: '挑戦',
      difficulty: 3,
      correctCount: 1,
      incorrectCount: 6,
      lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 6),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: '4',
      english: 'extraordinary',
      japanese: '並外れた',
      difficulty: 4,
      correctCount: 0,
      incorrectCount: 8,
      lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 2),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    }
  ];

  const loadWords = useCallback(async () => {
    try {
      setIsLoading(true);
      const allWords = await wordsService.getAllWords();
      setWords(allWords);
    } catch (error) {
      console.error('Failed to load words:', error);
      // フォールバック用のサンプルデータ
      setWords(sampleWords);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return '1時間以内';
    if (diffHours < 24) return `${diffHours}時間前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  };

  const handleEditWord = (word: Word) => {
    setEditingWord({ ...word });
    setIsEditDialogOpen(true);
  };

  const handleDeleteWord = useCallback(async (wordId: string) => {
    try {
      await wordsService.deleteWord(wordId);
      setWords((prev: Word[]) => prev.filter(word => word.id !== wordId));
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingWord) return;

    try {
      setIsSaving(true);
      await wordsService.updateWord(editingWord.id, {
        english: editingWord.english,
        japanese: editingWord.japanese,
        difficulty: editingWord.difficulty
      });
      setWords((prev: Word[]) => prev.map(word => 
        word.id === editingWord.id ? editingWord : word
      ));
      setIsEditDialogOpen(false);
      setEditingWord(null);
    } catch (error) {
      console.error('Failed to update word:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editingWord]);

  const handleAddWord = useCallback(async () => {
    if (!newWord.english || !newWord.japanese) return;

    try {
      setIsSaving(true);
      const wordToAdd = {
        english: newWord.english,
        japanese: newWord.japanese,
        difficulty: newWord.difficulty as 1 | 2 | 3 | 4,
        correctCount: 0,
        incorrectCount: 0,
        lastStudied: new Date(),
        createdAt: new Date(),
      };

      const wordId = await wordsService.addWord(wordToAdd);
      const completeWord: Word = { ...wordToAdd, id: wordId };
      
      setWords((prev: Word[]) => [completeWord, ...prev]);
      setIsAddDialogOpen(false);
      setNewWord({ english: '', japanese: '', difficulty: 1 });
    } catch (error) {
      console.error('Failed to add word:', error);
    } finally {
      setIsSaving(false);
    }
  }, [newWord]);

  const filteredWords = filterDifficulty === 'all' 
    ? words 
    : words.filter(word => word.difficulty === filterDifficulty);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          単語一覧 ({filteredWords.length}件)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadWords}
            disabled={isLoading}
          >
            更新
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            新しい単語を追加
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>苦手度で絞り込み</InputLabel>
          <Select
            value={filterDifficulty}
            label="苦手度で絞り込み"
            onChange={(e) => setFilterDifficulty(e.target.value as number | 'all')}
          >
            <MenuItem value="all">すべて</MenuItem>
            <MenuItem value={1}>簡単</MenuItem>
            <MenuItem value={2}>普通</MenuItem>
            <MenuItem value={3}>難しい</MenuItem>
            <MenuItem value={4}>とても難しい</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredWords.length === 0 ? (
        <Alert severity="info">
          {filterDifficulty === 'all' ? '単語が登録されていません。' : '該当する単語がありません。'}
        </Alert>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filteredWords.map((word: Word) => (
            <Card key={word.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {word.english}
                  </Typography>
                  <Chip 
                    label={getDifficultyText(word.difficulty)} 
                    color={getDifficultyColor(word.difficulty)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {word.japanese}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    正解: {word.correctCount}回 / 不正解: {word.incorrectCount}回
                  </Typography>
                  <Typography variant="caption" display="block">
                    最終学習: {formatDate(word.lastStudied)}
                  </Typography>
                  <Typography variant="caption" display="block">
                    登録日: {formatDate(word.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditWord(word)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteWord(word.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>単語を編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="英単語"
            fullWidth
            variant="outlined"
            value={editingWord?.english || ''}
            onChange={(e) => setEditingWord((prev: Word | null) => prev ? { ...prev, english: e.target.value } : null)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="日本語意味"
            fullWidth
            variant="outlined"
            value={editingWord?.japanese || ''}
            onChange={(e) => setEditingWord((prev: Word | null) => prev ? { ...prev, japanese: e.target.value } : null)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>苦手度</InputLabel>
            <Select
              value={editingWord?.difficulty || 1}
              label="苦手度"
              onChange={(e) => setEditingWord((prev: Word | null) => prev ? { ...prev, difficulty: e.target.value as 1 | 2 | 3 | 4 } : null)}
            >
              <MenuItem value={1}>簡単</MenuItem>
              <MenuItem value={2}>普通</MenuItem>
              <MenuItem value={3}>難しい</MenuItem>
              <MenuItem value={4}>とても難しい</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>キャンセル</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しい単語を追加</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="英単語"
            fullWidth
            variant="outlined"
            value={newWord.english || ''}
            onChange={(e) => setNewWord((prev: Partial<Word>) => ({ ...prev, english: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="日本語意味"
            fullWidth
            variant="outlined"
            value={newWord.japanese || ''}
            onChange={(e) => setNewWord((prev: Partial<Word>) => ({ ...prev, japanese: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>苦手度</InputLabel>
            <Select
              value={newWord.difficulty || 1}
              label="苦手度"
              onChange={(e) => setNewWord((prev: Partial<Word>) => ({ ...prev, difficulty: e.target.value as 1 | 2 | 3 | 4 }))}
            >
              <MenuItem value={1}>簡単</MenuItem>
              <MenuItem value={2}>普通</MenuItem>
              <MenuItem value={3}>難しい</MenuItem>
              <MenuItem value={4}>とても難しい</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>キャンセル</Button>
          <Button 
            onClick={handleAddWord} 
            variant="contained"
            disabled={isSaving || !newWord.english || !newWord.japanese}
          >
            {isSaving ? '追加中...' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WordList;