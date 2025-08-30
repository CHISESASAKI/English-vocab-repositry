# 英単語学習アプリ

画像認識技術を活用した革新的な英単語学習アプリケーションです。

## 主な機能

### 1. 画像認識機能
- 英単語帳の写真から単語と意味を自動抽出
- Tesseract.jsを使用したOCR技術
- 英語と日本語の混合テキストに対応

### 2. 問題生成機能
- 抽出した単語から4択問題を自動生成
- ランダムな選択肢でバラエティに富んだ学習体験

### 3. 苦手度管理機能
- 4段階の苦手度による個別学習管理
  - レベル1: 簡単
  - レベル2: 普通
  - レベル3: 難しい
  - レベル4: とても難しい
- 正解・不正解の記録による自動苦手度調整

### 4. 2種類の学習モード
- **通常学習**: すべての単語からランダム出題
- **苦手特訓**: 苦手度が高い単語を重点的に学習

## 技術スタック

- **フロントエンド**: React.js + TypeScript
- **UIライブラリ**: Material-UI (MUI)
- **画像認識**: Tesseract.js
- **データベース**: Firebase Firestore
- **デプロイ**: Vercel

## セットアップ

### 必要な環境
- Node.js 18.0以上
- npm または yarn

### インストール手順

1. リポジトリのクローン
```bash
git clone [repository-url]
cd english-vocab-app
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env
```
`.env`ファイルにFirebaseの設定値を記入してください。

4. 開発サーバーの起動
```bash
npm run dev
```

## Firebase設定

### プロジェクト: englishapp-chise

1. **Firebase Console設定**
   - [Firebase Console](https://console.firebase.google.com/project/englishapp-chise) にアクセス
   - 左サイドバー → ⚙️ → 「プロジェクトの設定」
   - 「マイアプリ」セクションで Web アプリを追加（未追加の場合）

2. **設定値を取得**
   ```javascript
   const firebaseConfig = {
     // これらの値をコピーして .env.local に設定
   };
   ```

3. **環境変数ファイルの作成**
   `.env.local` ファイルを作成し、以下を記入:
   ```
   VITE_FIREBASE_API_KEY=あなたのAPIキー
   VITE_FIREBASE_AUTH_DOMAIN=englishapp-chise.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=englishapp-chise
   VITE_FIREBASE_STORAGE_BUCKET=englishapp-chise.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=あなたのSender ID
   VITE_FIREBASE_APP_ID=あなたのApp ID
   ```

4. **Firestoreデータベース**
   - Firebase Console → Firestore Database → 「データベースを作成」
   - **テストモードで開始** を選択
   - ロケーション: `asia-northeast1 (Tokyo)`

### ⚠️ 重要
- `.env.local` ファイルは gitignore に含まれています
- 環境変数が設定されていない場合、自動的にLocalStorageを使用します

## デプロイ

### Vercelへのデプロイ

1. Vercel CLIのインストール
```bash
npm i -g vercel
```

2. プロジェクトをVercelにデプロイ
```bash
vercel
```

3. 環境変数をVercelダッシュボードで設定

## 使用方法

### 1. 単語帳の登録
- 「単語帳登録」タブで画像をアップロード
- 「文字を抽出」ボタンでOCR処理を実行
- 認識された単語を確認・編集
- 「データベースに追加」でFirestoreに保存

### 2. 学習モード
- 「学習モード」タブで学習タイプを選択
- 通常学習または苦手特訓を選択
- 4択問題に回答して学習を進行

### 3. 単語管理
- 「単語一覧」タブで登録済み単語を管理
- 苦手度での絞り込み機能
- 単語の編集・削除機能

## 今後の拡張予定

- [ ] ユーザー認証機能
- [ ] 学習履歴の詳細分析
- [ ] 単語の音声再生機能
- [ ] スペルチェック問題モード
- [ ] 単語帳のシェア機能
- [ ] AI powered hint system

## ライセンス

MIT License

## 貢献

プルリクエストや Issue の投稿を歓迎します。
