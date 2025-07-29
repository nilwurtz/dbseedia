# Docker環境でのE2Eテスト実行方法

## セットアップと実行

1. Docker環境を起動:
```bash
docker-compose up -d
```

2. E2Eテストを実行:
```bash
npm run e2e
```

3. 環境をクリーンアップ:
```bash
docker-compose down
```

## Docker Compose構成

- **postgres-main**: メインデータベース (localhost:5432)
- **postgres-analytics**: アナリティクスデータベース (localhost:5433)
- 両方のコンテナで `e2e/schema/` のSQLファイルが自動実行される

## 注意事項

- testcontainers依存関係を削除し、固定的なdocker-compose環境を使用
- E2Eテストは固定的な接続設定を使用 (localhost:5432/5433)
- データベーススキーマは起動時に自動作成される