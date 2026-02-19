# 丸紅トップページ (https://www.marubeni.com/jp/) 取得画像一覧

取得日時: スクレイプ実行時の metadata.json の `timestamp` を参照してください。

## 保存場所

- **画像フォルダ**: `import-work/images/`（31ファイル）
- **元URLとローカルファイルの対応**: `import-work/metadata.json` の `images.mapping` に記載

## 主な画像の対応（丸紅ドメインのみ抜粋）

| 元URL（抜粋） | ローカルファイル |
|---------------|------------------|
| jp/images/home/spotlight-06.jpg | 508b61bf0486fff00d14793e7335ae1c.jpg |
| jp/images/home/spotlight-05.jpg | 58ce9c2edaa9d9e8715315d266016559.jpg |
| jp/images/home/hero-02-mobile.png | 21b772a9a76a91773c2284ab6ab194c2.png |
| jp/images/home/spotlight-03.jpg | 75235e921097f4b525c781d8031159f2.jpg |
| common/images/home/message-01-desktop.jpg | bc7b3a9641631f64fee0af7e6c4345ba.jpg |
| common/images/home/about-01.jpg ～ about-04.jpg | 37508d86..., 4b4ecc73..., b631e0a8..., 97a1879f... |
| common/images/banner/* (会社概要・IR・採用・サステナビリティ等) | 上記 images/ 内の各ハッシュ名ファイル |
| common/images/logo-01.svg | 1fc222463f1cb31da9a6c42b509220f4.png（SVG→PNG変換済み） |
| common/images/background-01-desktop.jpg, background-01-mobile.jpg | 8e42cae6..., 1a1b9eec... |

※ Cookie バナー等のサードパーティ画像（OneTrust）も含まれています。完全な一覧は `metadata.json` の `images.mapping` を参照してください。

## 再取得方法

```bash
# aemeds ルートで実行
node scripts/run-marubeni-scrape.js
```

出力先: `drafts/tmp/import-work/`（上書きされます）
