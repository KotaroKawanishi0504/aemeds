# Dev モード調査手順

ブラウザの開発者ツール（Dev モード）でテキストスケール・CSS 読み込みを確認する手順です。

## 1. コンソールで診断（手軽に確認）

1. 調査したいページを開く（AEM プレビューの場合は **プレビューが表示されている iframe 内**で実行するため、iframe を選択してから Console を開くか、コンソールで `document` がプレビュー側になるようにする）。
2. 次のファイルを開き、**全文をコピー**してブラウザの **Console** に貼り付けて実行する。
   - **ファイル**: `docs/diagnostic-console-snippet.js`
3. 出力される内容:
   - viewport 幅・高さ
   - `:root` の `--rem`, `--global-text-scale`, `--body-font-size-m`, `--heading-font-size-xl`
   - 読み込み済み CSS（marubeni-theme / header / cards の有無）
   - body / header nav / カードの **computed font-size**
4. **ブラウザ幅を変えてから再実行**すると、スケールが効いているか（`--global-text-scale` や computed の変化）を確認できます。

戻り値のオブジェクトを inspection JSON の `diagnostic` にマージすれば、`analyze-inspection-diagnostic.cjs` でテキストスケールもレポートされます。

## 2. インスペクション JSON 取得（診断付き）

Playwright でページを開き、ヘッダー＋診断＋カードサンプルを JSON で保存します。

```powershell
cd aemeds
node scripts/inspect-header-launch.cjs "https://www.marubeni.com/jp/" docs/inspection-original.json
node scripts/inspect-header-launch.cjs "https://author-.../content/marubeni/jp/cards.html" docs/inspection-aem.json
```

AEM の場合は表示後にターミナルで Enter を押すと保存されます。保存される JSON には **diagnostic**（styleSheets, --rem, --global-text-scale, computed font-size など）が含まれます。

特定幅で取得する例:

```powershell
node scripts/inspect-header-launch.cjs "https://author-.../cards.html" docs/inspection-aem-1000.json 1000
```

## 3. 分析レポートの生成

保存した inspection JSON を渡して Markdown レポートを出します。diagnostic にテキストスケール情報があれば「テキストスケール（幅連動）」セクションも出力されます。

```powershell
cd aemeds
node scripts/analyze-inspection-diagnostic.cjs docs/inspection-aem.json
```

出力: コンソール表示 ＋ AEM の場合は `docs/INSPECTION_AEM_ANALYSIS_RESULT.md` に保存。

## 参考

- ヘッダー比較の詳細手順: `docs/header-inspection-steps.md`
- 診断用コンソールスニペット: `docs/diagnostic-console-snippet.js`
