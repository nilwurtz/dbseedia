# CLAUDE.md

このファイルは、このリポジトリでの作業時にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

**dbseedia** は、dbUnitに似たデータベーステストデータローダーライブラリで、PostgreSQLのCOPY FROMコマンドを使用した高性能データロードのために設計されています。このプロジェクトは、テーブル順序付けサポートを持つCSV/TSVテストデータをロードするためのコアライブラリを提供します。

## 現在の状況（2025年1月）

### プロジェクト状態
- **バージョン**: 0.0.2（NPMで公開済み）
- **開発フェーズ**: Phase 1完了、実用可能な状態
- **NPMパッケージ**: `dbseedia` として公開中
- **サンプル実装**: `sample/basic/` で動作確認済み

### テスト状況
- **ユニットテスト**: 59テスト全てパス
- **E2Eテスト**: 全シナリオ動作確認済み
- **サンプルテスト**: TypeScript + Testcontainersで正常動作

## アーキテクチャ

### コア設計パターン

プロジェクトは責務分離された階層アーキテクチャに従います：

- **コアライブラリ**: DbSeedaコアとビジネスロジック（データロード統制）
- **サービス層**: 単一責務のサービスクラス群
- **リポジトリ層**: データベース・ファイル操作
- **インターフェース層**: 型定義とコントラクト

### 主要インターフェース・サービス

#### コア
- `DbSeedia`: フルエントインターフェースを持つメインAPIクラス

#### サービス層（単一責務原則）
- `TableFileLocator`: CSV/TSVファイルの検索・判定
- `DbSeediaConfigValidator`: 設定検証とデフォルト値適用
- `DataTransformer`: 解析データのデータベース形式変換

#### リポジトリ層
- `CsvFileRepository`: CSV/TSV解析とtable-ordering.txt処理
- `PostgresDbRepository`: PostgreSQL接続とCOPY操作管理

## 技術スタック

- **言語**: TypeScript with ESM modules
- **データベース**: PostgreSQL via postgres.js
- **CSV解析**: papaparse（ESMサポート対応済み）
- **テスト**: Vitest
- **ビルド**: tsc
- **Node バージョン**: 22.16.0 (mise管理)

## 開発コマンド

```bash
# 環境セットアップ
mise install                    # Node.js 22.16.0インストール

# 開発
npm install                     # 依存関係インストール
npm run build                   # TypeScriptコンパイル
npm run test                    # Vitestユニットテスト実行
npm run e2e                     # E2Eテスト実行
npm run lint                    # Biomeでのリント・フォーマット
npm run typecheck              # TypeScript型チェック

# 統合チェック
npm run checkall               # 全ての妥当性検証（推奨）
```

## 主要機能

### データロード戦略

- **Truncate**: テーブルをクリアしてからロード（デフォルト）
- **Delete**: 特定レコードを削除してからロード
- **Upsert**: 更新または挿入（将来の段階）

### パフォーマンス最適化

- PostgreSQL COPY FROMによる高速データロード
- バッチ処理（デフォルト: 1000行）
- トランザクションベース操作
- 外部キー制約の一時無効化（オプション）

### 複数データベースサポート

名前付き設定による複数データベース接続をサポート：

```typescript
const config = {
  connection: [
    { name: "main", host: "localhost", database: "app_test" },
    { name: "analytics", host: "analytics-db", database: "analytics_test" },
  ],
};
```

## ファイル構造

### テストデータ形式

```
fixtures/
├── table-ordering.txt    # テーブルロード順序
├── users.csv            # ユーザーデータ
├── posts.tsv            # 投稿データ（TSV形式）
└── comments.csv         # コメントデータ
```

### 設定要件

- ESMモジュール (`"type": "module"`)
- Node.js 20+ 互換性
- TypeScriptファースト開発

## エラーハンドリング

階層的エラーシステム：

- `FileParseError`: ファイル読み込み問題
- `DataTransformError`: データ変換問題
- `DatabaseError`: PostgreSQL操作失敗
- `ConnectionError`: データベース接続問題
- `ValidationError`: 設定検証エラー

## 開発段階

- **Phase 1**: ✅ PostgreSQL COPY FROM実装（完了）
- **Phase 2**: スキーマ検証、オートインクリメント処理
- **Phase 3**: CLIツール、設定ファイル、高度な機能

## サンプル実装

### sample/basic/
- TypeScript + Testcontainersを使用したBasic使用例
- 3つのテストシナリオ：基本ロード、Truncate戦略、Fluent API
- npm経由でdbseedia v0.0.2を使用して動作確認済み

## 変更履歴

プロジェクトの詳細な変更履歴は [CHANGELOG.md](./CHANGELOG.md) を参照してください。

## リリースプロセス

- vx.x.x というタグをmainにPushすると、GithubActions経由でリリースされる
- これを行う場合は**必ずユーザーに確認を行う**
- 現在のリリース状況：
  - ✅ v0.0.1: 初回リリース（ESM問題あり）
  - ✅ v0.0.2: papaparse ESM修正版（現在の安定版）

## API使用例

### 基本的な使用方法

```typescript
import { DbSeedia, type DbSeediaConfig } from 'dbseedia';

const config: DbSeediaConfig = {
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'user',
    password: 'pass',
  },
};

const dbSeedia = new DbSeedia(config);
await dbSeedia.connect();
await dbSeedia.loadFrom('./fixtures');
await dbSeedia.disconnect();
```

### Fluent Interface

```typescript
await new DbSeedia(config)
  .withStrategy('truncate')
  .connect()
  .then(db => db.loadFrom('./fixtures'))
  .then(db => db.disconnect());
```

## 注意事項

- プロジェクトはmiseでNode.jsバージョン管理
- 最小依存関係戦略を採用
- PostgreSQLに特化（MySQL対応は将来予定）
- 高性能テストデータロードシナリオ向け設計

## 設計哲学

### アーキテクチャ原則
- **単一責務原則**: 各サービスは1つの責務のみを持つ
- **依存性注入**: テスタビリティと保守性向上
- **宣言的実装**: 命令的な実装より、宣言的な実装を好む
- **関心の分離**: ファイルシステム、設定検証、データ変換の分離

### リファクタリング実績
- **TableFileLocator**: ファイル検索ロジックをコアから分離
- **ConfigValidator**: 設定検証とデフォルト値適用を分離
- **TDD適用**: 全リファクタリングでRED-GREEN-REFACTORサイクル実践

## 開発アプローチ

- **TDD(テスト駆動開発)**: RED-GREEN-REFACTORのフェーズを着実に進める
- **t-wada風TDD**: 失敗テスト→実装→リファクタリングの確実な実行
- **宣言的設計**: 設定やデフォルト値は宣言的に定義

## 開発チェックリスト

- **実装完了時**: `npm run checkall`で全ての妥当性を検証
- **リファクタリング時**: 既存テストの継続的なパスを確認
- **新機能時**: TDDサイクルでテストファーストを実践