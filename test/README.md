# Local Reproduction (AEM deploy なしで修正→テスト)

## 概要

AEM の HTML をローカルで再現し、デプロイせずに修正→テストを繰り返せます。

## 使い方

### 1. AEM フィクスチャテスト（自動）

```bash
npm run test:hero-video:aem
```

- `test/fixtures/hero-video/aem-actual.html` … 4 行目が空（AEM 現状）→ "More" を期待
- `test/fixtures/hero-video/aem-with-label.html` … 4 行目にラベルあり → そのラベルを期待

修正後、このコマンドで即座に検証できます。

### 2. ブラウザでプレビュー

```bash
npm run preview:local
```

ブラウザで http://localhost:3001/test/local-preview.html を開く。

### 3. フィクスチャの更新

AEM の HTML が変わった場合、取得した HTML の該当ブロック部分を `test/fixtures/hero-video/` にコピーして更新する。
