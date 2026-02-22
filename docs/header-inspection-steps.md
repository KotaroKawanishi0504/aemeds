# ヘッダー比較用インスペクション手順

AEM とオリジナル（丸紅本家）のヘッダー見た目を揃えるため、両ページのヘッダー要素の計算済みスタイル・寸法を JSON で取得する手順です。

## 前提

- Playwright でブラウザを起動する方式（`scripts/inspect-header-launch.cjs`）を使用
- `aemeds` で `npm install` 済みであること

## Step 1: オリジナルサイトのヘッダーを取得

```powershell
cd aemeds
node scripts/inspect-header-launch.cjs "https://www.marubeni.com/jp/" docs/inspection-original.json
```

- Chrome が開き、丸紅本家を表示
- 読み込み後に自動でヘッダー情報を取得し、`docs/inspection-original.json` に保存してブラウザを閉じる

## Step 2: AEM のヘッダーを取得

```powershell
node scripts/inspect-header-launch.cjs "https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html" docs/inspection-aem.json
```

- Chrome が開く
- ログイン画面の場合は **ブラウザでログイン** する
- `cards.html` が表示されたら **ターミナルで Enter を押す**
- ヘッダー情報が `docs/inspection-aem.json` に保存され、ブラウザが閉じる

## Step 3: 2 つの JSON を比較する

次のいずれかで差分を確認する。

- **手動**: `docs/inspection-original.json` と `docs/inspection-aem.json` を開き、`header` 配下の `rect`（width, height）や `style`（padding, margin, fontSize, gap など）を比較
- **Agent に依頼**: 上記 2 ファイルをワークスペースに置いた状態で「2 つの inspection JSON を比較し、AEM のヘッダー CSS をオリジナルに合わせる修正案を出して」と依頼

## Step 4: AEM ヘッダー CSS を修正する

比較結果に基づき、`aemeds/blocks/header/header.css` の padding・margin・幅・gap・font-size などを調整し、オリジナルと見た目を揃える。

## 出力 JSON の構造（参考）

- `url`: 取得時のページ URL
- `viewport`: ウィンドウ幅・高さ
- `header`: ヘッダー要素のツリー。各ノードに `tag`, `id`, `class`, `rect`（x, y, width, height, top, left）, `style`（padding, margin, width, height, fontSize, gap など）, `children` が含まれる
