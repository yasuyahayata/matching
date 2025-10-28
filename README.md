# マッチングシステム(汎用)

企業と企業をマッチングするプラットフォーム

## 機能

- 案件投稿・編集・削除
- 応募管理（承認・却下）
- リアルタイムチャット機能
- 通知システム
- プロフィール管理
- タグベースの検索・フィルタリング

## 技術スタック

- **フロントエンド**: Next.js 14, React
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **認証**: NextAuth.js (Google OAuth)
- **リアルタイム通信**: Socket.io
- **スタイリング**: CSS Modules, Tailwind CSS

## Getting Started

### 開発サーバーの起動

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
