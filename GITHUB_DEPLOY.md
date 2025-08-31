# 🚀 GitHub → Vercel 自動デプロイ設定手順

## 📋 手順概要

1. GitHubリポジトリ作成
2. コードをプッシュ
3. Vercelでリポジトリ連携
4. 自動デプロイ開始！

---

## 1️⃣ GitHubリポジトリ作成

### GitHub.comでの作業：

1. **GitHub.com にアクセス** → https://github.com
2. **「New repository」** をクリック
3. **リポジトリ設定:**
   ```
   Repository name: english-vocab-app
   Description: 📚 OCR技術を活用した英単語学習アプリ
   Visibility: Public (または Private)
   ```
4. **「Create repository」** をクリック

---

## 2️⃣ ローカルからGitHubへプッシュ

### ターミナルで実行：

```bash
# 現在のプロジェクトディレクトリで実行
cd /Users/csasaki/iqlab/claude-work/english-vocab-app

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/[あなたのユーザー名]/english-vocab-app.git

# メインブランチ名を確認・変更（必要に応じて）
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

---

## 3️⃣ Vercel での GitHub 連携

### Vercel ダッシュボードでの設定：

1. **Vercelにアクセス** → https://vercel.com/chises-projects
2. **「Add New...」** → **「Project」** をクリック
3. **「Import Git Repository」** を選択
4. **GitHubリポジトリを選択:**
   - `english-vocab-app` を見つけてクリック
   - 「Import」をクリック

5. **プロジェクト設定確認:**
   ```
   Framework Preset: Vite ✅
   Build Command: npm run build ✅
   Output Directory: dist ✅
   Install Command: npm install ✅
   ```

6. **「Deploy」** をクリック

---

## 4️⃣ 自動デプロイのテスト

### 動作確認：

```bash
# 何かファイルを変更（例：README.mdに一行追加）
echo "🚀 自動デプロイテスト" >> README.md

# 変更をコミット
git add .
git commit -m "Test auto deployment"

# GitHubにプッシュ
git push origin main
```

**結果:** 
- GitHub に変更がプッシュされると
- Vercel が自動的に新しいビルドを開始
- 約2-3分でデプロイ完了！

---

## 🎯 完了後の状況

### ✅ 自動化された流れ：
1. **コード変更** → `git push`
2. **GitHub** → 自動的に変更を検知
3. **Vercel** → 自動ビルド & デプロイ
4. **本番URL** → 即座に更新完了

### 🔗 URL例：
- **本番URL**: `https://english-vocab-app-[hash].vercel.app`
- **GitHub**: `https://github.com/[username]/english-vocab-app`

---

## 🛡️ 追加設定（オプション）

### カスタムドメイン設定：
1. Vercel ダッシュボード → プロジェクト設定
2. "Domains" タブ → カスタムドメイン追加

### 環境変数設定：
1. Vercel ダッシュボード → プロジェクト設定  
2. "Environment Variables" で設定

---

🎉 **これで完璧な自動デプロイ環境が完成です！**