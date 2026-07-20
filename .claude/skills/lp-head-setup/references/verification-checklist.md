# head 公開前検品チェックリスト（実行手順付き）

3 段階で検品する: **(1) grep による機械検品 → (2) curl による実 URL 検品 → (3) SNS デバッガでの見た目確認**。
(1) はローカルで即実行できる。(2)(3) はサーバーアップ後に行う。

## 1. grep による機械検品（ローカル）

すべて `index.html` があるディレクトリで実行。**「0 件になるべき」コマンドで 1 件でもヒットしたら修正**する。

```bash
# --- 記入漏れ検出（ヒット 0 件になること） ---
grep -n 'content=""' index.html                # 空の meta が残っていないか
grep -nE '\{\{[A-Z_]+\}\}' index.html          # プレースホルダの置換漏れ

# --- og:url / twitter:url に画像 URL が混入していないか（ヒット 0 件になること） ---
grep -nE '(og:url|twitter:url)"[^>]*\.(jpg|jpeg|png|webp|gif)' index.html

# --- og:image / twitter:image の拡張子欠落（ヒット 0 件になること） ---
grep -nE '(og:image|twitter:image)' index.html | grep -vE '\.(jpg|jpeg|png|webp|gif)"'

# --- twitter:site が @ 始まりでない（タイトル文字列等の誤記。ヒット 0 件になること） ---
grep -nE 'twitter:site" content="[^@"]' index.html

# --- viewport へのズーム禁止指定の混入（ヒット 0 件になること） ---
grep -nE 'user-scalable\s*=\s*no|maximum-scale\s*=\s*1' index.html

# --- Google Fonts の family= が空（ヒット 0 件になること） ---
grep -nE 'css2\?family=(&|")' index.html

# --- favicon のレガシー記法（新規案件ではヒット 0 件が望ましい） ---
grep -n 'shortcut icon' index.html
```

```bash
# --- GTM の 2 点セット確認（出力が 2 になること: head の gtm.js + body の ns.html） ---
grep -c 'googletagmanager.com' index.html

# noscript 側が入っているかの個別確認（1 件ヒットすること）
grep -c 'googletagmanager.com/ns.html' index.html

# GTM ID がプレースホルダのままでないか（公開時はヒット 0 件になること）
grep -n 'GTM-XXXXXXX' index.html
```

```bash
# --- canonical と og:url が一致しているか（目視比較） ---
grep -nE 'rel="canonical"|og:url' index.html

# --- noindex の状態確認 ---
# テストアップ時: 有効になっていること / 本公開時: 削除されていること
grep -n 'noindex' index.html
```

## 2. curl による実 URL 検品（サーバーアップ後）

```bash
PROD_URL="https://{{EC_DOMAIN}}/special/{{PROJECT_SLUG}}/"

# ページ本体が 200 を返すか
curl -sI "$PROD_URL" | head -5

# OGP 画像が 200 + image/* で返るか（403 / 404 / text/html ならパスか権限の誤り）
curl -sI "${PROD_URL}ogp.jpg" | grep -iE '^HTTP|content-type'

# 実サーバー上の HTML から OGP タグ一式を抜き出して目視確認
curl -s "$PROD_URL" | grep -oE '<meta (property|name)="(og|twitter):[^>]+>'

# favicon の疎通
curl -sI "{{FAVICON_URL}}" | head -3
```

OGP 画像のサイズ確認（1200×630px であること）:

```bash
curl -s "${PROD_URL}ogp.jpg" -o /tmp/ogp_check.jpg && sips -g pixelWidth -g pixelHeight /tmp/ogp_check.jpg
```

## 3. SNS デバッガでの見た目確認

機械検品が通っても、SNS 側のキャッシュや画像仕様で表示が崩れることがある。最低 1 つの公式デバッガで実際のカード表示を確認する。

1. **Facebook シェアデバッガー**（developers.facebook.com/tools/debug/）に公開 URL を入力
   - 「もう一度スクレイピング」でキャッシュを更新してから確認する（**修正後の再確認時は必須**。古いキャッシュが残る）
   - 画像・タイトル・説明文が意図通りか、警告が出ていないかを見る
2. **X（Twitter）** は実際に下書き投稿画面に URL を貼り、カードプレビューを確認する
3. **LINE 等のメッセージアプリ**にも URL を貼ってプレビューを確認する（トーク画面で自分宛てに送るだけでよい）

## 4. GTM の動作確認

1. GTM の管理画面から**プレビューモード**（Tag Assistant）で公開 URL に接続し、コンテナが読み込まれタグが発火することを確認する
2. ブラウザの DevTools > Network で `gtm.js?id={{GTM_ID}}` が 200 で読み込まれていることを確認する
3. コンソールに GTM 起因のエラーが出ていないことを確認する

## 5. 目視の最終確認

- [ ] ブラウザタブにタイトルと favicon が正しく表示される
- [ ] リロード時にページ先頭から表示される（scrollRestoration スクリプトが効いている）
- [ ] スマホ実機でピンチズームができる（ズーム禁止が混入していない）
- [ ] 本公開時: noindex が削除されている
