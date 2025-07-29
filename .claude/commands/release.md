---
description: "新しいバージョンをリリースする"
argument-hint: "<version> (例: 0.0.4)"
allowed-tools: ["Read", "Edit"]
---

# Release Command

指定されたバージョンでdbseediaのリリースを行います。

## 実行内容

1. package.jsonのバージョンを更新
2. CHANGELOG.mdに新バージョンの情報を追加
3. 変更をコミット
4. Gitタグを作成
5. リモートにプッシュしてGitHub Actionsでリリース開始

## 使用方法

```
/release 0.0.4
```

---

## 実行手順

### 1. 現在の状況確認
まず現在のGitの状態とCHANGELOGの内容を確認します。

```bash
git status
git log --oneline -5
```

### 2. package.jsonのバージョン更新
package.jsonのversionフィールドを指定されたバージョン（$ARGUMENTS）に更新します。

### 3. CHANGELOG.mdの更新
CHANGELOG.mdのUnreleased項目を新バージョンとして正式化し、リンクも更新します。
日付は今日の日付（yyyy-MM-dd形式）を使用します。date コマンドを使って取得してください。

```bash
date +%Y-%m-%d
```

### 4. コミットとタグ作成
```bash
git add package.json CHANGELOG.md
git commit -m "bump: 🏷️ version $ARGUMENTS with changelog update"
git tag v$ARGUMENTS
```

### 5. リモートにプッシュ
```bash
git push origin main && git push origin v$ARGUMENTS
```

これによりGitHub Actionsが自動的にNPMへのリリースを開始します。

## 注意事項

- 必ずクリーンな状態（git status が clean）でリリースを実行してください
- バージョン番号はセマンティックバージョニングに従ってください
- Unreleased項目がCHANGELOG.mdに存在することを確認してください
