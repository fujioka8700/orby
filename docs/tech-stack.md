# 技術スタック（Tech Stack）

本プロジェクト（Orby）で使用している技術の一覧です。

## ランタイム・言語

| 技術 | バージョン | 用途 |
|------|------------|------|
| Node.js | 24 | 開発・ビルド・実行環境 |
| TypeScript | ^5 | 型付き JavaScript、コンパイルターゲット ES2017 |
| npm | - | パッケージ管理 |

## フロントエンド・フレームワーク

| 技術 | バージョン | 用途 |
|------|------------|------|
| Next.js | 16.1.6 | React ベースのフルスタックフレームワーク、App Router |
| React | 19.2.3 | UI ライブラリ |
| React DOM | 19.2.3 | React の DOM レンダリング |
| Phaser | ^3.80.1 | 2D ゲームエンジン（Canvas/WebGL）、プラットフォーマー用 |

## スタイリング

| 技術 | バージョン | 用途 |
|------|------------|------|
| Tailwind CSS | ^4 | ユーティリティファーストの CSS フレームワーク |
| PostCSS | - | `@tailwindcss/postcss` による Tailwind 処理 |
| Geist / Geist Mono | - | `next/font/google` による Web フォント（レイアウト・UI 用） |

## 開発ツール・品質

| 技術 | バージョン | 用途 |
|------|------------|------|
| Biome | 2.2.0 | Lint・フォーマット・インポート整理（ESLint/Prettier 代替） |
| @types/node | ^20 | Node.js 型定義 |
| @types/react / @types/react-dom | ^19 | React 型定義 |

## 開発環境・インフラ

| 技術 | 用途 |
|------|------|
| Docker Compose | 開発用コンテナ（Node 24、ポート 3000、ホットリロード） |
| WATCHPACK_POLLING | コンテナ内でのファイル変更検知 |

## ゲーム・マップ・アセット

| 技術・形式 | 用途 |
|------------|------|
| Tiled | マップエディタ（`.tmx`、`.tsx`、`.tiled-project`） |
| TMX / TSX | タイルマップ・タイルセット形式 |
| PNG | スプライト、タイルセット、背景、UI 画像 |
| カスタムフォント | `Round9x13.ttf`（ゲーム内表示用） |

## プロジェクト構成の特徴

- **パスエイリアス**: `@/*` で `src/` 直下を参照（`tsconfig.json`）
- **App Router**: Next.js の `app/` ディレクトリベースのルーティング
- **クライアントコンポーネント**: Phaser ゲームは `"use client"` で React に組み込み
- **静的アセット**: `public/orby/` にゲーム用画像・マップ・フォントを配置

## 主要スクリプト（package.json）

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm run start` — 本番サーバー起動
- `npm run lint` — Biome によるチェック（`biome check`）
- `npm run format` — Biome によるフォーマット（`biome format --write`）
