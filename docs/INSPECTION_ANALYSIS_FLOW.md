# Inspect 実行結果を使った分析の流れ

## 結論：**inspect の実行結果（JSON）だけで分析できます。追加の手動作業は不要です。**

Console へのコピペや、手動でのスタイル比較は不要です。

---

## 流れ

| ステップ | 作業 | 手動で必要なこと |
|----------|------|------------------|
| 1 | **inspect を実行** | `cd aemeds` のうえでコマンド実行 → ブラウザで AEM を開き、ログインしてページ表示 → **Enter を 1 回押す** |
| 2 | **JSON が保存される** | 自動（`docs/inspection-aem.json`） |
| 3 | **analyze を実行** | `node scripts/analyze-inspection-diagnostic.cjs docs/inspection-aem.json` を **aemeds** で実行 |
| 4 | **レポートができる** | 自動（コンソール表示 + `docs/INSPECTION_AEM_ANALYSIS_RESULT.md`） |

この 1〜4 だけで、「どの CSS が読まれているか」「codeBasePath は何か」「何が原因か」までレポートに出ます。

---

## diagnostic について

- **現在の inspect スクリプト**は、実行時にページ内で **diagnostic**（styleSheets 一覧・codeBasePath・--rem・各 CSS の読み込み有無）を取得し、JSON に含めて保存します。
- **analyze スクリプト**は、その JSON を読むだけで、**追加の手動操作なしに**判定とレポートを出します。
- もし手元の JSON に `diagnostic` が無い場合は、**inspect をいまのスクリプトで再実行**すれば、次回保存される JSON には diagnostic が入ります（Console 作業は不要）。

---

## まとめ

- **inspect の実行結果（JSON）を元に分析できる** → はい、できます。
- **追加の手動作業が必要か** → いいえ。inspect 実行（と Enter 1 回）＋ analyze 実行だけで完了します。Console 貼り付けや手動比較は不要です。
