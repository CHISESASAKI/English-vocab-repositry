import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { Storage, CloudUpload, Computer } from '@mui/icons-material';
import { isFirebaseConfigured, migrationService } from '../services/database';

const FirebaseStatus: React.FC = () => {
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrationDialog, setMigrationDialog] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      setFirebaseConfigured(isFirebaseConfigured());
      setHasLocalData(await migrationService.hasLocalData());
    };
    checkStatus();
  }, []);

  const handleMigration = async () => {
    setMigrating(true);
    try {
      await migrationService.migrateToFirestore();
      setMigrationResult('success');
      setHasLocalData(false);
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult('error');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {firebaseConfigured ? <Storage color="success" /> : <Computer color="primary" />}
          <Typography variant="h6">
            データ保存設定
          </Typography>
          <Chip 
            label={firebaseConfigured ? "Firebase接続中" : "LocalStorage使用中"}
            color={firebaseConfigured ? "success" : "primary"}
          />
        </Box>

        {firebaseConfigured ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            🔥 Firebase Firestoreに接続されています。
            <br />
            データはクラウドに安全に保存され、どのデバイスからでもアクセス可能です。
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            💾 現在LocalStorageモードで動作中です。
            <br />
            データはこのブラウザに保存され、確実に動作します。
          </Alert>
        )}

        {firebaseConfigured && hasLocalData && (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              📚 LocalStorageに保存された単語データが見つかりました。
              <br />
              Firestoreに移行することをお勧めします。
            </Alert>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setMigrationDialog(true)}
              sx={{ mb: 2 }}
            >
              Firestoreに移行
            </Button>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          保存データの説明:
        </Typography>

        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography variant="body2">
            📚 追加した単語データ
          </Typography>
          <Typography variant="body2">
            📊 学習履歴と成績
          </Typography>
          <Typography variant="body2">
            🎯 難易度と復習情報
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Alert severity={firebaseConfigured ? "info" : "warning"} variant="outlined">
            {firebaseConfigured ? (
              "☁️ データはFirestore Cloudに安全に保存されています。"
            ) : (
              "💡 このブラウザのデータを削除するとすべてのデータが失われます。定期的にブラウザの設定から重要なデータをバックアップしてください。"
            )}
          </Alert>
        </Box>

        {/* Migration Dialog */}
        <Dialog open={migrationDialog} onClose={() => setMigrationDialog(false)}>
          <DialogTitle>Firestoreへのデータ移行</DialogTitle>
          <DialogContent>
            {migrating ? (
              <Box sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  LocalStorageのデータをFirestoreに移行中...
                </Typography>
                <LinearProgress />
              </Box>
            ) : migrationResult === 'success' ? (
              <Alert severity="success">
                🎉 データ移行が完了しました！
                <br />
                LocalStorageのデータはバックアップとして保持されます。
              </Alert>
            ) : migrationResult === 'error' ? (
              <Alert severity="error">
                ❌ データ移行に失敗しました。
                <br />
                Firebase設定を確認してください。
              </Alert>
            ) : (
              <Typography variant="body2">
                LocalStorageに保存された単語データをFirestoreに移行します。
                <br />
                この操作により、データはクラウドに安全に保存され、
                どのデバイスからでもアクセス可能になります。
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            {!migrating && migrationResult !== 'success' && (
              <Button onClick={() => setMigrationDialog(false)}>
                キャンセル
              </Button>
            )}
            {!migrating && migrationResult === null && (
              <Button onClick={handleMigration} variant="contained">
                移行開始
              </Button>
            )}
            {migrationResult === 'success' && (
              <Button onClick={() => {
                setMigrationDialog(false);
                setMigrationResult(null);
              }} variant="contained">
                完了
              </Button>
            )}
            {migrationResult === 'error' && (
              <Button onClick={() => {
                setMigrationDialog(false);
                setMigrationResult(null);
              }}>
                閉じる
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FirebaseStatus;