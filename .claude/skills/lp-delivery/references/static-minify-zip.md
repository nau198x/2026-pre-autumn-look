# 静的案件の minify + zip 納品手順

ビルド工程のない静的構成（`index.html` + `css/` + `js/` + `image/` + `sound/` 等）の納品パターン。ディレクトリ構成は次の 3 段階で作る。

```text
<project>/               … 開発ソース（触らない）
<project>_minify/        … ランタイム資産のみ複製し、CSS / JS を minify した納品原本
<project>_MMDD/          … 納品日付のスナップショット（minify 版の複製）
<project>_MMDD.zip       … 実際に渡す zip
```

再納品時は `_MMDD` を新しい日付で作り直す（旧スナップショット・旧 zip は上書きせず残す＝どの版を渡したかの台帳になる）。

## 一括スクリプト

プロジェクトの親ディレクトリで実行する。`PROJECT` を実プロジェクト名に置換。

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT="{{PROJECT_SLUG}}"        # 例: brand-campaign-lp
SRC="$PROJECT"
DEST="${PROJECT}_minify"

# --- 1. ランタイム資産のみ複製（開発ファイルを除外） ---
rm -rf "$DEST"
rsync -a \
  --exclude '.git' \
  --exclude '.claude' \
  --exclude '.vscode' \
  --exclude '.superpowers' \
  --exclude 'node_modules' \
  --exclude 'docs' \
  --exclude 'reference' \
  --exclude 'CLAUDE.md' \
  --exclude 'README.md' \
  --exclude 'DEVELOPMENT.md' \
  --exclude '*.md' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  --exclude '.DS_Store' \
  "$SRC/" "$DEST/"

# --- 2. CSS を minify（同名で上書き。ファイル構成は変えない） ---
for f in "$DEST"/css/*.css; do
  npx --yes csso-cli "$f" -o "$f"
done

# --- 3. JS を minify ---
for f in "$DEST"/js/*.js; do
  npx --yes terser "$f" --compress --mangle -o "$f"
done

# --- 4. OS ゴミの徹底除去 ---
find "$DEST" -name '.DS_Store' -delete

# --- 5. 日付スナップショット + zip ---
SNAP="${PROJECT}_$(date +%m%d)"
rm -rf "$SNAP" "${SNAP}.zip"
cp -R "$DEST" "$SNAP"
zip -r -X "${SNAP}.zip" "$SNAP" -x '*.DS_Store'

echo "== zip 内容 =="
unzip -l "${SNAP}.zip"
```

## 各手順の注意

### 1. 複製（rsync）

- **HTML / CSS / JS のファイル構成（パス・ファイル名）は変えない。** `css/style.css` を `style.min.css` にリネームすると HTML の参照修正が必要になり事故のもと。同名上書きで minify する。
- 除外リストは案件ごとに棚卸しする。ブリーフ・クレジット表などの**支給資料や開発メモを渡さない**（`docs/` / `reference/` / `*.md`）。
- 逆に `sound/` や動画などのランタイム資産の除外漏れに注意（rsync 後に `find "$DEST" -type f | sort` で目視）。

### 2. CSS minify

- `csso-cli` の代替は `npx lightningcss-cli --minify "$f" -o "$f"` でも可。どちらかに統一する。
- minify 後に `@import` の解決漏れ・文字化けが無いか、後述の動作確認で必ず見る。

### 3. JS minify

- `terser --compress --mangle` はトップレベルの関数名・グローバル API は保持する（HTML の inline onclick 等から参照されていても壊れない）。ただし `--mangle-props` は**使わない**（プロパティ名の圧縮は高確率で壊れる）。
- CDN 読み込みのライブラリ（`*.min.js`）を二重に minify しない（`js/` に同梱している場合は除外する）。

### 4. HTML の扱い

HTML は minify しない運用を基本とする（先方での軽微な修正・差分確認のしやすさ優先）。minify する場合はコメント除去に注意:

```bash
npx --yes html-minifier-terser \
  --collapse-whitespace \
  -o "$DEST/index.html" "$DEST/index.html"
# --remove-comments を付ける場合、GTM の目印コメントや IE 条件付きコメントが
# 消えて困らないか事前に確認すること
```

## 動作確認（zip 化の前後で 2 回）

```bash
# minify 版の確認
( cd "${PROJECT}_minify" && python3 -m http.server 8000 )
# → http://localhost:8000 で表示・アニメーション・音声・console を確認

# zip 展開版の確認（渡すものと同一の状態で最終確認）
TMP=$(mktemp -d)
unzip -q "${PROJECT}_$(date +%m%d).zip" -d "$TMP"
( cd "$TMP"/*/ && python3 -m http.server 8001 )
```

minify 起因の破損（アニメーションが動かない・console にエラー）が出たら、該当ファイルだけ minify 前に戻して原因を特定する。

## zip 内容の検品

```bash
SNAP_ZIP="${PROJECT}_$(date +%m%d).zip"

# 開発ファイル・OS ゴミの混入（何も出力されないこと）
unzip -l "$SNAP_ZIP" | grep -iE '\.DS_Store|CLAUDE|DEVELOPMENT|README|\.md|\.vscode|\.claude|node_modules|package(-lock)?\.json|\.map' || echo "混入なし OK"

# ファイル数がソース側の想定と大きくズレていないこと
unzip -l "$SNAP_ZIP" | tail -1
```
