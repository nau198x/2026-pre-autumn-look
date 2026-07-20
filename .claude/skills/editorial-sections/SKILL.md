---
name: editorial-sections
description: エディトリアル系 LP の定番周辺セクション 7 種をコピペ導入する。lead（ページ冒頭のタグ + 英文 + 和文のコンセプト導入文）/ note（商品見出し + 解説文ブロック）/ staff-credit（撮影スタッフクレジット。中央型と画像 + リスト型の 2 変種）/ catalog-grid（上下罫線 + 3 カラムのサムネイルグリッド）/ links-list（全幅罫線行 + hover 反転のリンクリスト）/ ec-button（中央配置の枠線ボタン、hover 白黒反転）/ footer（ロゴ + パイプ区切りリンク + SNS + コピーライト）。ユーザーが「スタッフクレジット入れたい」「撮影クレジット載せて」「フッター作って」「リード文（導入文・コンセプト文）を入れたい」「商品の説明文ブロック追加して」「カタログっぽく商品画像を並べたい」「関連リンクを並べたい」「オンラインストアへのボタン置いて」「ONLINE STORE ボタン追加して」等と言ったときは必ずこのスキルを使うこと。写真ブロック本体は lp-section-layouts、商品価格クレジットは credit-list に任せ、それ以外の文章・クレジット・リンク・フッター系はすべてこのスキルが受け持つ。
---

# editorial-sections

エディトリアル LP の「写真ブロック以外」を構成する定番セクション 7 種を、案件を問わず同じ命名・同じ構造で導入するスキル。各セクションの完全な HTML + CSS は references にある。

## いつ使うか

- LP に導入文・商品解説・スタッフクレジット・カタログ・リンク集・EC ボタン・フッターのいずれかを追加するとき
- 過去案件から同種セクションをコピーしようとしているとき（綴り揺れを持ち込まないため、必ずこちらの正規化版を使う）
- 既存の同種セクションの命名・構造がバラついていて整理したいとき

## セクション一覧（どれを使うか）

| セクション | ルートクラス | こういう内容のとき | 参照 |
|---|---|---|---|
| lead | .lead | ページ冒頭でコンセプトを宣言する（タグライン + 英文 + 和文、中央揃え） | references/lead.md |
| note | .note | 特定の商品・トピックの解説文（見出し + 本文、左揃え）。本文中に何度でも置ける | references/note.md |
| staff-credit | .staff-credit | 撮影スタッフのクレジット（Photographer / Stylist 等）。ページ終盤に 1 回 | references/staff-credit.md |
| catalog-grid | .catalog | 商品サムネイルを小さく等間隔に一覧させる（上下罫線 + 3 カラム） | references/catalog-grid.md |
| links-list | .links | EC・外部モール・SNS 等、複数の遷移先を等価に並べる（全幅罫線行 + hover 反転） | references/links-list.md |
| ec-button | .ec | オンラインストア等、単一の遷移先へ強く誘導する（中央枠線ボタン + hover 白黒反転） | references/ec-button.md |
| footer | .footer | ページ末尾の定型（ロゴ + パイプ区切りリンク + SNS + コピーライト） | references/footer.md |

### 判断の観点

- lead と note の使い分け: ページに 1 回だけの「世界観の宣言」が lead、商品や章ごとに繰り返す「解説」が note
- staff-credit は 2 変種ある。テキストだけで締めるなら中央型、締めに使えるオフショット素材があるなら画像 + リスト型（references/staff-credit.md で選ぶ）
- links-list と ec-button の使い分け: 遷移先が 1 つなら ec-button、複数（EC / 外部モール / SNS 等）なら links-list。ページ中腹に ec-button、終盤に links-list の併用も定番
- catalog-grid は「1 点 1 点を語らず物量を見せる」用途。商品名・価格を添えて語るなら credit-list スキルか lp-section-layouts のクレジット付きパターンを使う

### 命名の統一（厳守）

スタッフクレジットは実案件で .staff / .credit-content / .staff-role 等、案件ごとに綴り・構造の揺れが多発した。本ライブラリでは **ルートを .staff-credit、要素を .staff-credit__\* に統一**している。過去案件からコピーする場合も必ずこの命名に読み替える。他セクションも references の命名から変えない。

## 共通規律

- 1 セクション = 1 ルートクラス = 1 CSS ファイル（例: .lead ⇔ lead.css）。CSS は main の entry から import する
- BEM: ルートはケバブケース、要素は __、修飾は --。スタイル用セレクタはクラスのみ、ID はページ内アンカー用途に限定
- mobile-first。ブレークポイントは 768px（タブレット）/ 1024px（デスクトップ）のみ
- 色・余白・イージングは :root のデザイントークン（--color-\*, --spacing-\*, --ease-\*）を参照する。ブランド固有値をセクション CSS にハードコードしない
- スクロール表示演出の対象には data-animate を付与し、初期非表示は @media (scripting: enabled)（+ prefers-reduced-motion ガード）で行う。JS 無効環境で内容が消えたままにならないこと
- hover 演出は @media (hover: hover) 配下に置き、タッチ環境で反転が残留しないようにする

## 導入手順

1. 上の一覧表からセクションを選び、該当する references を読む
2. デザイントークンが :root に定義済みか確認する。無ければ先に lp-design-tokens スキルで整備する
3. references の CSS を 1 セクション = 1 ファイルで追加し、HTML 例をコピーして文言・リンク先・画像パス・alt を差し替える
4. プレースホルダ（example.com、BRAND NAME、¥00,000、スタッフ名等）を実データに差し替える。footer はロゴ画像・SNS アイコン・コピーライト表記の 3 点を必ず確認する
5. 商品クレジットが必要なら credit-list スキル、写真ブロックは lp-section-layouts スキルを併用する

## 検品チェックリスト

- [ ] SP（375px）/ タブレット（768px）/ PC（1280px）の 3 幅で余白・揃え・折返しが意図通り
- [ ] プレースホルダ（example.com / BRAND NAME / ¥00,000 / ダミー人名）が本番データに全て差し替え済み
- [ ] staff-credit の役職・氏名が支給クレジットと完全一致（綴り・表記順・敬称）
- [ ] footer: SP でパイプ区切り（span）が非表示になりリンクが縦積みになる。PC で 1 行に戻る
- [ ] links-list / ec-button の hover 反転がタッチ環境で残留しない（@media (hover: hover) ガード）
- [ ] 外部リンクに target="_blank" と rel="noopener" が付いている
- [ ] 全画像（footer ロゴ・SNS アイコン・catalog サムネイル・staff オフショット）に width / height 属性がある
- [ ] data-animate 付き要素が JS 無効・reduced-motion 環境でも表示される
