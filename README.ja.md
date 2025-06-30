# DbSeedia

DBUnitにインスパイアされた、PostgreSQLでCSVとTSVをサポートするデータベーステストデータローダーライブラリです。

## 特徴

- PostgreSQLのCOPY FROMコマンドを使用した高性能データローディング
- CSVとTSVファイル形式のサポート
- 複数のローディング戦略（truncate、delete）
- `table-ordering.txt`によるテーブル順序サポート
- マルチデータベース接続サポート
- 完全な型安全性を持つTypeScriptファースト
- ESMモジュールサポート

## インストール

```bash
npm install dbseedia
```

## クイックスタート

```typescript
import { DbSeedia } from 'dbseedia';

const dbSeedia = new DbSeedia({
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'postgres',
    password: 'password'
  }
});

// データベースに接続
await dbSeedia.connect();

// fixturesディレクトリからテストデータを読み込み
await dbSeedia.loadFrom('./fixtures');

// 完了時に切断
await dbSeedia.disconnect();
```

## 設定

### 基本設定

```typescript
const config = {
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'postgres',
    password: 'password'
  },
  strategy: 'truncate',    // 'truncate' | 'delete'
  separator: ',',          // CSV区切り文字
  encoding: 'utf8',        // ファイルエンコーディング
  nullValue: '',           // NULLとして扱う値
  batchSize: 1000         // バッチ処理サイズ
};
```

### マルチデータベースサポート

```typescript
const config = {
  connection: [
    { 
      name: 'main', 
      host: 'localhost', 
      database: 'app_test',
      username: 'postgres',
      password: 'password'
    },
    { 
      name: 'analytics', 
      host: 'analytics-db', 
      database: 'analytics_test',
      username: 'postgres',
      password: 'password'
    }
  ]
};

// 特定のデータベースに読み込み
await dbSeedia.loadFrom('./fixtures', { target: 'analytics' });
```

## ファイル構造

テストデータファイルをディレクトリ構造で整理します：

```
fixtures/
├── table-ordering.txt    # オプション：テーブル読み込み順序を定義
├── users.csv            # ユーザーデータ
├── posts.tsv            # 投稿データ（TSV形式）
└── comments.csv         # コメントデータ
```

### テーブル順序

`table-ordering.txt`ファイルを作成して、テーブルの読み込み順序を指定します：

```
users
posts
comments
```

順序ファイルが提供されない場合、テーブルはアルファベット順に読み込まれます。

## 読み込み戦略

### Truncate（デフォルト）

読み込み前にテーブルのすべてのデータをクリアします：

```typescript
await dbSeedia.loadFrom('./fixtures', { strategy: 'truncate' });
```

### Delete

読み込み前に特定のレコードを削除します（部分更新に便利）：

```typescript
await dbSeedia.loadFrom('./fixtures', { strategy: 'delete' });
```

## API リファレンス

### DbSeediaクラス

#### コンストラクタ

```typescript
new DbSeedia(config: DbSeediaConfig)
```

#### メソッド

- `connect(): Promise<void>` - データベースに接続
- `disconnect(): Promise<void>` - データベースから切断
- `loadFrom(directory: string, options?: LoadOptions): Promise<void>` - ディレクトリからデータを読み込み

#### Fluentインターフェース

- `withStrategy(strategy: LoadStrategy): DbSeedia` - 読み込み戦略を設定
- `withOptions(options: Partial<DbSeediaConfig>): DbSeedia` - 設定を更新
- `withTables(tables: string[]): DbSeedia` - 読み込むテーブルを指定
- `withConnection(connection: ConnectionConfig): DbSeedia` - 接続を更新

### 型定義

```typescript
interface DbSeediaConfig {
  connection: ConnectionConfig | ConnectionConfig[];
  strategy?: 'truncate' | 'delete';
  separator?: string;
  encoding?: string;
  nullValue?: string;
  batchSize?: number;
}

interface ConnectionConfig {
  name?: string;
  host: string;
  port?: number;
  database: string;
  username: string;
  password?: string;
}

interface LoadOptions {
  strategy?: 'truncate' | 'delete';
  tables?: string[];
  target?: string;
}
```

## エラーハンドリング

DbSeediaは異なる失敗シナリオに対して特定のエラータイプを提供します：

- `FileParseError` - ファイル読み取りまたは解析の問題
- `DataTransformError` - データ変換の問題
- `DatabaseError` - PostgreSQL操作の失敗
- `ConnectionError` - データベース接続の問題
- `ValidationError` - 設定検証エラー

```typescript
import { DbSeedia, FileParseError, DatabaseError } from 'dbseedia';

try {
  await dbSeedia.loadFrom('./fixtures');
} catch (error) {
  if (error instanceof FileParseError) {
    console.error('ファイル解析に失敗しました:', error.message);
  } else if (error instanceof DatabaseError) {
    console.error('データベース操作に失敗しました:', error.message);
  }
}
```

## 開発

```bash
# 依存関係をインストール
npm install

# プロジェクトをビルド
npm run build

# テストを実行
npm run test

# E2Eテストを実行
npm run e2e

# 型チェック
npm run typecheck

# リンティング
npm run lint
```

## 要件

- Node.js 20.0.0以上
- PostgreSQLデータベース
- TypeScript 5.8+（開発用）

## ライセンス

MIT

## 貢献

貢献を歓迎します！お気軽にプルリクエストを送信してください。