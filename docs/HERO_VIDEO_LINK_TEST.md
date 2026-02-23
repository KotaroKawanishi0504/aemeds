# Hero Video リンクのテスト

## テストの種類

1. **動作テスト（推奨）** — `npm run test:hero-video`
   - `scripts/test-hero-video-behavior.mjs`
   - jsdom でブロックのテーブル構造を再現し、`decorate(block)` を実行
   - 「Link URL」「Link label」行あり → リンク生成（Case 1）
   - 「link」「linkLabel」行あり → リンク生成（Case 2）
   - **リンクが DOM に存在するか**を検証するため、こちらの結果を信頼する

2. **ソーススキャン** — `npm run test:hero-video:source`
   - `scripts/test-hero-video-link.cjs`
   - hero-video.js のソースに `config['link-url']` や `config.linklabel` の記述があるかだけを確認
   - 実際にリンクが作られるかは見ていない（補助用）

## AEM でリンクが表示されない場合

動作テストが通っても AEM でリンクが出ないときは、**AEM から渡っているブロックの HTML が想定と違う**可能性があります。

- ブロックは `readBlockConfig(block)` で **ブロック直下の `div` の「1列目＝見出し、2列目＝値」** から config を読んでいます。
- 想定しているのは次のいずれかです。
  - 見出しが **「Link URL」「Link label」** → `config['link-url']`, `config['link-label']`
  - 見出しが **「link」「linkLabel」** → `config.link`, `config.linklabel`

**確認手順:**

1. AEM プレビューで該当ページを開く
2. 開発者ツールで **ヒーロー動画ブロック**（`class="hero-video"` の div）を選択
3. **ページ読み込み直後・decorate 実行前**の状態で、そのブロックの**中身（子要素）**を確認
   - 子に `div` の行が複数あり、その中に「Link URL」「Link label」や「link」「linkLabel」に相当する見出しと値があるか
4. 行が無い、または見出し・値の形が違う場合、AEM 側のブロック出力（テンプレートやコンポーネントの HTML 生成）を確認する必要があります

デバッグ用に、一時的に `blocks/hero-video/hero-video.js` の `decorate` 内で `console.log('hero-video config', config)` を実行し、AEM のコンソールで実際の config を確認することも有効です。
