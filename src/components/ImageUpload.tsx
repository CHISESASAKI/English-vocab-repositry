import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { CloudUpload, PhotoCamera, Save } from '@mui/icons-material';
import { createWorker } from 'tesseract.js';
import { wordsService } from '../services/database';

interface ImageUploadProps {}

const ImageUpload: React.FC<ImageUploadProps> = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedWords, setSelectedWords] = useState<{ [key: number]: boolean }>({});

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setExtractedText('');

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const processImage = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError('');

    try {
      const worker = await createWorker('eng+jpn');
      
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽァィゥェォャュョッアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポー・、。！？0123456789 \n\t'
      });

      const { data: { text } } = await worker.recognize(selectedFile);

      await worker.terminate();

      setExtractedText(text);
    } catch (err) {
      setError('画像の処理中にエラーが発生しました。');
      console.error('OCR Error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile]);

  const parseWordsFromText = useCallback((text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const words: { english: string; japanese: string }[] = [];

    for (const line of lines) {
      const patterns = [
        /([A-Za-z]+)\s*[:\-\s]+\s*([あ-んア-ンー・、。！？]+)/,
        /([A-Za-z]+)\s+([あ-んア-ンー・、。！？]+)/,
        /([A-Za-z]+)[\s\t]*([あ-んア-ンー・、。！？]+)/
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const english = match[1].trim();
          const japanese = match[2].trim();
          
          if (english.length > 1 && japanese.length > 0) {
            words.push({ english, japanese });
            break;
          }
        }
      }
    }

    return words;
  }, []);

  const extractedWords = extractedText ? parseWordsFromText(extractedText) : [];

  const handleWordSelection = useCallback((index: number, selected: boolean) => {
    setSelectedWords(prev => ({ ...prev, [index]: selected }));
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelection: { [key: number]: boolean } = {};
    extractedWords.forEach((_, index) => {
      newSelection[index] = selected;
    });
    setSelectedWords(newSelection);
  }, [extractedWords]);

  const handleSaveWords = useCallback(async () => {
    const selectedIndices = Object.keys(selectedWords)
      .filter(key => selectedWords[parseInt(key)])
      .map(key => parseInt(key));
    
    if (selectedIndices.length === 0) {
      setError('保存する単語を選択してください。');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const wordsToSave = selectedIndices.map(index => {
        const wordData = extractedWords[index];
        return {
          english: wordData.english,
          japanese: wordData.japanese,
          difficulty: 2 as const, // デフォルトで普通レベル
          correctCount: 0,
          incorrectCount: 0,
          lastStudied: new Date(),
          createdAt: new Date()
        };
      });

      await wordsService.addWords(wordsToSave);
      setSuccessMessage(`${selectedIndices.length}個の単語を保存しました！`);
      
      // 保存後のリセット
      setSelectedWords({});
      setExtractedText('');
      setSelectedFile(null);
      setPreview(null);
      
    } catch (err) {
      setError('単語の保存中にエラーが発生しました。');
      console.error('Save Error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedWords, extractedWords]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        単語帳画像アップロード
      </Typography>
      
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="image-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              size="large"
              sx={{ mb: 2 }}
            >
              画像を選択
            </Button>
          </label>
          
          {preview && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <img
                src={preview}
                alt="アップロード画像"
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            </Box>
          )}

          {selectedFile && !isProcessing && (
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={processImage}
              size="large"
            >
              文字を抽出
            </Button>
          )}

          {isProcessing && (
            <Box sx={{ mt: 2 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                画像を処理中...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>

      {extractedText && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            抽出されたテキスト:
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {extractedText}
            </Typography>
          </Box>
        </Paper>
      )}

      {extractedWords.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              認識された単語 ({extractedWords.length}件)
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={extractedWords.every((_, index) => selectedWords[index])}
                  indeterminate={
                    extractedWords.some((_, index) => selectedWords[index]) &&
                    !extractedWords.every((_, index) => selectedWords[index])
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label="すべて選択"
            />
          </Box>
          
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {extractedWords.map((word, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 1, 
                  bgcolor: selectedWords[index] ? 'primary.light' : 'grey.50', 
                  borderRadius: 1,
                  border: selectedWords[index] ? '2px solid' : '1px solid',
                  borderColor: selectedWords[index] ? 'primary.main' : 'grey.300'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedWords[index] || false}
                      onChange={(e) => handleWordSelection(index, e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {word.english}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {word.japanese}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            ))}
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSaveWords}
              disabled={isSaving || Object.values(selectedWords).filter(Boolean).length === 0}
            >
              {isSaving ? '保存中...' : 
               `選択した単語を保存 (${Object.values(selectedWords).filter(Boolean).length}件)`}
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImageUpload;