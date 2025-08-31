import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { Storage } from '@mui/icons-material';

const FirebaseStatus: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Storage color="primary" />
          <Typography variant="h6">
            データ保存設定
          </Typography>
          <Chip 
            label="LocalStorage使用中" 
            color="primary"
          />
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          🔧 現在LocalStorageモードで動作中です。
          <br />
          データはこのブラウザに保存され、確実に動作します。
        </Alert>

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
          <Alert severity="warning" variant="outlined">
            💡 このブラウザのデータを削除するとすべてのデータが失われます。
            定期的にブラウザの設定から重要なデータをバックアップしてください。
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FirebaseStatus;