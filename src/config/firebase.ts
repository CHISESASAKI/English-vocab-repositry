import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// プロジェクト名: englishapp-chise から推定される設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "englishapp-chise.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "englishapp-chise",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "englishapp-chise.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

// Firebase アプリを初期化
const app = initializeApp(firebaseConfig);

// Firestore データベースとストレージのインスタンスを取得
export const db = getFirestore(app);
export const storage = getStorage(app);

// デフォルトエクスポート
export default app;

// 環境変数が設定されているかチェックする関数
export const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
};