---
name: lp-head-setup
description: LP の <head> 一式（title / meta description / OGP / Twitter Card / favicon / preconnect / Google Fonts / GTM head + body noscript / scrollRestoration）を、単一のプロジェクト設定から漏れなく生成・検品する。ユーザーが「OGP設定して」「メタタグ入れて」「head を整えて」「GTM 入れて」「タイトルとディスクリプション設定して」「SNS でシェアしたときの画像を設定して」「favicon 設定して」「OGP が反映されない」等を言ったとき、または新規 LP の index.html を書き始める・公開前に head を見直す文脈では必ずこのスキルを使うこと。
---

# LP head セットアップ

LP の `<head>` は毎回ほぼ同じ構成なのに、手作業で書くと必ずどこかを間違える（og:url に画像 URL を入れる、noscript を忘れる等）。このスキルは「先にプロジェクト設定を 1 箇所で確定し、そこから全タグを機械的に生成する」ことで転記ミスを根絶する。

## いつ使うか

- 新規 LP の `index.html` を作成する・雛形から書き起こすとき
- 既存 LP に OGP / Twitter Card / GTM / favicon を追加・修正するとき
- 公開前に head の検品を求められたとき（「OGP 確認して」「シェア画像が出ない」等）

## 判断基準

- **タグを書き始める前に、必ずプロジェクト設定を確定させる。** 必要なのは次の 8 項目のみ: slug（公開ディレクトリ名）/ 公開ドメイン / ブランド名 / ページタイトル / description / OGP 画像ファイル名 / GTM ID / Twitter アカウント。1 つでも未定なら AskUserQuestion でヒヤリングし、揃うまでタグを書かない。
- **URL はすべて slug から導出する。** 公開 URL は `https://{{EC_DOMAIN}}/special/{{PROJECT_SLUG}}/` の形、OGP 画像はその直下の `ogp.jpg`（絶対 URL・拡張子付き）。手で個別に書かない。
- **GTM ID が未支給の場合**は、プレースホルダ ID のままコメントアウト状態で雛形に残す（開発中の 404 とダミー計測を防ぐ）。支給され次第、コメント解除して実 ID に差し替える。
- **canonical は常に入れる。noindex は公開前だけ入れるトグルとして扱う**（テスト公開・確認用 URL の検索流入を防ぐ。公開時に外し忘れないようチェックリストで担保する）。
- viewport に `user-scalable=no` や `maximum-scale=1` を**絶対に追加しない**（ピンチズーム禁止はアクセシビリティ退行）。既存コードにあれば削除を提案する。

## 手順

1. **プロジェクト設定の確定** — 上記 8 項目を確定し、`references/head-template.md` 冒頭の「プロジェクト設定表」を埋める。
2. **head の生成** — `references/head-template.md` のテンプレートにプレースホルダを流し込み、`<head>` 全体を一括で書き出す。部分的な継ぎ足しはしない（既存 head がある場合も、テンプレートとの差分を取って全体を揃える）。
3. **GTM の 2 点セット確認** — head 内の GTM スクリプトと `<body>` 直後の noscript iframe は必ずペアで入れる。片方だけの状態を作らない。
4. **scrollRestoration スクリプトの配置** — アニメーション主体の LP ではリロード時のスクロール位置復元が演出を壊すため、テンプレート同梱のインラインスクリプトを GTM より前に置く。
5. **検品** — `references/verification-checklist.md` の手順（grep での機械検品 → curl での実 URL 検品 → SNS デバッガ）を上から順に実施する。

## 検品チェックリスト

過去案件で実際に起きたミスを含む。公開前に全項目を確認すること。

- [ ] `og:url` / `twitter:url` が**ページの URL**になっている（画像 URL `.../ogp.jpg` を入れてしまう事故が実際に多発。URL 末尾が画像拡張子なら誤り）
- [ ] `og:image` / `twitter:image` が**拡張子付きの絶対 URL**（`.../ogp` のように拡張子が欠落した事故例あり。SNS によっては画像が出ない）
- [ ] `twitter:site` の値が `@` 始まりのアカウント名（**タイトル文字列を入れてしまう誤記**に注意。アカウントが無いなら空にせずタグごと削除かコメントアウト）
- [ ] GTM が head スクリプト＋ body 直後の noscript の **2 箇所セット**で入っている（noscript の入れ忘れが頻発）
- [ ] GTM ID がプレースホルダのまま公開されていない／逆に開発中に実 ID で計測を汚していない
- [ ] Google Fonts の URL で `family=` が**空になっていない**（フォント差し替え時に family だけ消える事故例あり）。preconnect 2 行（googleapis / gstatic + crossorigin）とセットか
- [ ] viewport に `user-scalable=no` / `maximum-scale=1` が**混入していない**
- [ ] favicon の rel 記法が統一されている（新規は `rel="icon"` に統一。`rel="shortcut icon"` はレガシー記法なので新規では使わない。PNG / SVG に応じて `type` 属性を正しく）
- [ ] canonical が公開 URL と一致している
- [ ] 公開前に入れた `noindex` を**公開時に削除した**（逆に、確認用 URL に noindex が入っているか）
- [ ] title / description / OGP に空文字 `content=""` が残っていない
- [ ] OGP 画像が実サーバーに上がっており 1200×630px である（curl で 200 / Content-Type を確認）

## references

- `references/head-template.md` — プレースホルダ入りの完全 head テンプレート（GTM head + body noscript、scrollRestoration、canonical / noindex トグル込み）。コピペしてプレースホルダを置換すればそのまま使える。
- `references/verification-checklist.md` — 公開前検品の実行手順（grep による機械検品コマンド、curl での実 URL 確認、SNS デバッガの使い方）。
