---
name: split-text-animation
description: 見出し・タイトルのテキストを JS で 1 文字ずつ span に分割し、GSAP で文字単位のリビール演出を行う。プリセットは 4 種 — a「順次 stagger フェード」、b「シード付きランダム順の blur フェード（毎回同じ順序で再現可能）」、c「マスク 2 重 span からの yPercent せり上がり」、d「フレーズ単位の段階的リビール（数字・強調語だけ別演出）」。aria-label による読み上げ保持・スペース処理・reduced-motion 縮退・FOUC 対策をワンセットで含む。ユーザーが「文字を1文字ずつ出したい」「タイトルをバラバラに表示」「文字が下からせり上がる」「テキストをパラパラ表示」「見出しにタイプライター風の動き」「文字がランダムに浮かび上がる」「SplitText みたいなことをしたい」等を言ったときや、見出し・キャッチコピーの登場演出を作る文脈では必ずこのスキルを使うこと。
---

# split-text-animation

見出しの文字分割 + 文字単位リビールを、分割ユーティリティ（references/split-chars.md）とプリセット集（references/reveal-presets.md)の 2 段構成で導入するスキル。有償プラグインは使わず、素の DOM 操作 + GSAP で完結する。

## いつ使うか

- ヒーローや各セクションの見出しに「文字が順に現れる」演出を付けたいとき
- ブロック全体のフェードでは物足りず、タイトルだけ格上の登場感が欲しいとき
- 有償の文字分割プラグインを使わずに同等の演出を実装したいとき

## プリセットの判断基準

| プリセット | 見た目 | 分割構造 | 向いている条件 | 参照 |
|---|---|---|---|---|
| a: 順次 stagger フェード | 先頭から順に文字がフェード（2 段階 opacity 可） | フラット span | 上品・控えめ。本文寄りの見出し。実装コスト最小 | references/reveal-presets.md |
| b: シードランダム blur | ランダムな順序で文字のフォーカスが合っていく | フラット span | ヒーロータイトル向き。シード固定なので**毎回同じ順序** = QA・録画が安定 | references/reveal-presets.md |
| c: マスク yPercent | 行の中から文字がせり上がる | **マスク 2 重 span 必須** | エディトリアル感。セクション見出しを ScrollTrigger で発火させる用途に好相性 | references/reveal-presets.md |
| d: 段階的リビール | フレーズごとにフェーズ分け、数字や強調語だけ別演出 | フラット + 強調部のみ 2 重 | タイトル内に「数字」「キーワード」があり、そこを主役にしたい。演出予算高 | references/reveal-presets.md |

### 判断の観点

- **発火タイミング**: ヒーロー見出しはプリローダーの `loading:complete` 購読で開始。スクロール後に見える見出しは ScrollTrigger（`start: "top 75%"` 目安、`once: true`）
- **分割構造**: c を使う可能性が少しでもあればマスク 2 重 span で分割しておく（a / b は 2 重構造でもそのまま動く。逆は作り直し）
- **ランダム順**: `Math.random()` は使わない。シード付き乱数（mulberry32）で順序を固定し、リロードごとに印象が変わる・不具合が再現しないという事態を避ける
- **blur の多用注意**: 文字数 × filter アニメは重い。b / d で 20 文字を超えるなら完了時に `clearProps: "filter"` する

### 全プリセット共通の必須要素

- **a11y**: 分割前に元テキストを親の `aria-label` に退避し、生成 span は `aria-hidden="true"`。スクリーンリーダーには 1 語として読ませる
- **スペース処理**: 分割方式に応じてスペースをテキストノード or `&nbsp;` で保持（潰れると単語間が詰まる）。詳細は references/split-chars.md
- **改行対策**: inline-block の文字 span は単語の途中でも折り返す。複数単語の英文見出しは単語ラップを併用する
- **二重分割ガード**: `dataset.split` フラグで再実行を無効化（リサイズ再初期化などで DOM が壊れるのを防ぐ）
- **reduced-motion**: `prefers-reduced-motion: reduce` では分割はしてよいが動きはスキップし、最終状態を即時セット
- **FOUC 対策**: 分割・初期状態セットは表示前（DOMContentLoaded 直後）に行う。初期非表示 CSS は `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` 内に置き、JS 無効環境で見出しが消えないようにする

## 導入手順

1. references/split-chars.md のユーティリティ（分割関数 + 付属 CSS + シード乱数）をプロジェクトに追加する
2. 上の判断表でプリセットを決め、references/reveal-presets.md の該当コードを animations.js（相当）に追加する
3. 対象見出しを DOMContentLoaded 時に分割する（アニメの有無に関わらず先に分割し、DOM 構造を安定させる）
4. 初期状態（opacity / yPercent / blur）を JS の `gsap.set` で入れ、発火トリガー（`loading:complete` or ScrollTrigger）に接続する
5. reduced-motion 分岐で最終状態を即時セットする経路を必ず用意する

## 検品チェックリスト

- [ ] スクリーンリーダー（VoiceOver 等）で見出しが 1 語として読まれる（1 文字ずつ読まれない）
- [ ] 単語間のスペースが潰れていない。英文見出しが単語の途中で折り返さない
- [ ] リロードしても b のランダム順序が毎回同じ
- [ ] `prefers-reduced-motion: reduce` で動きなしの完成状態が即時表示される
- [ ] JS 無効で見出しがそのまま見える（分割されず、隠れもしない）
- [ ] 初期化を 2 回呼んでも DOM が二重分割されない
- [ ] c: ディセンダ（g, y, p 等）や日本語のルビ・濁点がマスクで切れていない
- [ ] 文字数の多い見出しで演出が間延びしていない（stagger × 文字数 = 総時間を確認）
- [ ] アニメ完了後にテキスト選択・リンククリックが正常（pointer-events / user-select を阻害していない）
