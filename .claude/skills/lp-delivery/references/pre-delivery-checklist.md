# 納品前チェックリスト（完全版）

パッケージング**前**に上から順に消化する。納品物を作ってから不備が見つかると作り直しになるため、静的検査（grep）→ lint / build → 実ブラウザ確認 → リンク疎通 → 資産検品 → 混入物検品 の順で機械チェックを先に済ませる。

head 周り（meta / OGP / favicon の構成そのもの）の詳細検品は `lp-head-setup` スキルの検品手順を併用する。

## 1. プレースホルダ残存ゼロ

テンプレート由来のダミー値が 1 つでも残った状態で公開される事故を機械的に潰す。**ヒット 0 件になること。**

```bash
# ダミー GTM ID / ダミードメイン / ダミーブランド名 / {{...}} 記法
grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" -e "{{" \
  index.html package.json src public 2>/dev/null

# title / description / OGP の記入漏れ（空 content・仮タイトル）
grep -n -e 'content=""' -e "LPタイトル" index.html
```

静的構成（`src/` が無い案件）は対象を `index.html css js` に読み替える。

## 2. OGP / canonical の実 URL 反映

公開 URL が確定したら、プレースホルダやローカル URL から実 URL へ差し替わっていることを確認する。

```bash
grep -n -e 'og:url' -e 'og:image' -e 'canonical' -e 'twitter:' index.html
```

目視で確認する観点:

- **`og:url` がページの URL であること。** 画像の URL（`.../ogp.jpg` 等）を `og:url` に入れてしまう取り違え事故の実例がある。`og:url` = ページ、`og:image` = 画像、の対応を必ず見る
- `og:image` は**絶対 URL**（`https://` 始まり。相対パスは SNS クローラーが解決できない）
- **`og:image` の拡張子が実ファイルと一致していること**（HTML は `.png` を参照しているが実際に置くのは `.jpg`、といったズレがシェア画像の非表示につながる）
- `canonical` と `og:url` が同一 URL であること（末尾スラッシュの有無も揃える）
- 公開後（またはステージング反映後）に画像の実在を確認:

```bash
curl -sI "https://example.com/special/{{PROJECT_SLUG}}/ogp.jpg" | head -1   # → HTTP/2 200
```

## 3. GTM の動作確認

```bash
# head スクリプト + body 直後 noscript の 2 点セット（→ 2 になること）
grep -c 'googletagmanager.com' index.html

# 実 ID になっていること（ダミーが 0 件、実 ID が 2 箇所）
grep -n 'GTM-' index.html
```

- テンプレートでは 404 を避けるため GTM が**コメントアウトされている**。コメントが解除されているかを目視する（grep のヒットがコメント内、という残念な合格に注意）
- ブラウザで開き、DevTools → Network で `gtm.js` が **200** で読まれること、Console で `dataLayer` が定義されていることを確認する
- 計測担当がいる場合は Tag Assistant（プレビューモード）での発火確認まで依頼する

## 4. lint / build

```bash
npm run lint                 # Stylelint + ESLint がパスすること
rm -rf dist && npm run build # 警告・エラーなしで成功すること（ビルドあり案件）
```

ビルドログのチャンクサイズ警告もそのままにしない（巨大画像・重複バンドルの兆候）。

## 5. console 警告ゼロ（納品物の状態で）

開発サーバー（`npm run dev`）ではなく**納品する実物**で確認する。

```bash
npm run preview                          # ビルドあり → http://localhost:4173
# 静的案件は minify 後のディレクトリで:
python3 -m http.server 8000              # → http://localhost:8000
```

- ページ全体を最下部までスクロールし、Console に警告・エラーが 1 件も出ないこと（404 リソース・GSAP の target not found・CORS 等はここで露見する）
- 表示・アニメーション・音声・カルーセルの動作も同時に通す

## 6. 404 リンクチェック

ローカルサーバーを立てた状態で機械チェックする。

```bash
# ページ内リンクを再帰クロール（内部・外部とも疎通確認）
npx --yes linkinator http://localhost:4173 --recurse --skip "mailto:|tel:"
```

補助として、外部リンクの一覧を目視確認する（リンク先の取り違え・http 混在の検出）:

```bash
grep -ohE 'href="https?://[^"]+"' index.html | sort -u
```

- アンカーリンク（`#section`）は機械チェックに乗らないため、実クリックで確認する
- 公開前で先方サーバーにまだ無い URL（自ドメインの新規ページ等）は 404 でも良いが、「どれが公開後に生える URL か」をリストにして引き渡しに添える

## 7. 画像圧縮確認

```bash
# 異常に大きい画像の検出（300KB 超を列挙。ヒーロー以外で出たら要再圧縮）
find . -path ./node_modules -prune -o -type f \
  \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.webp' \) \
  -size +300k -print

# 形式の棚卸し（WebP 優先。巨大 PNG 写真が残っていないか）
find . -path ./node_modules -prune -o -type f -name '*.png' -size +150k -print
```

- 写真系は **WebP 優先**。PNG は透過・ロゴ用途に限定する
- 1MB 超が 1 枚でもあれば理由を説明できる状態にする（説明できないなら再圧縮）

## 8. 除外物（開発ファイル）の混入確認

パッケージング後の zip / dist に対して行う最終検品。**すべて何も出力されないこと。**

```bash
# dist（ビルドあり案件）
find dist -name '*.map' -o -name '.DS_Store'

# zip（両案件共通）
unzip -l "{{PROJECT_SLUG}}_$(date +%m%d).zip" | \
  grep -iE '\.DS_Store|node_modules|\.claude|\.vscode|CLAUDE|README|DEVELOPMENT|docs/|\.md|package(-lock)?\.json|\.map' \
  || echo "混入なし OK"
```

- `node_modules` / `.git` / `.claude` / `.vscode` / `docs/`・支給資料 / `*.md` / ソースマップ（`*.map`）/ `.DS_Store` はいずれも納品物に入れない
- `.DS_Store` は zip に混入した実例がある。目視ではなく必ず機械的に除去・検品する

## 9. 仕上げの表示確認

- [ ] OS の「視差効果を減らす（prefers-reduced-motion）」を有効にしてもコンテンツが隠れず表示される
- [ ] JS を無効にしてもコンテンツが見える（`data-animate` の初期非表示が JS 有効時に限定されている）
- [ ] PC / SP の出し分け画像がブレークポイント前後で両方確認できる
- [ ] zip を展開してローカルサーバーで開き、表示・アニメーション・リンクを最終確認した（相対パス・minify 起因の破損が無い）
