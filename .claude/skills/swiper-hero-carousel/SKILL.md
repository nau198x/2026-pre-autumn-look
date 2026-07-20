---
name: swiper-hero-carousel
description: Swiper によるヒーロー / ギャラリーの fade + autoplay カルーセルを導入する。画像が数秒ごとにゆっくりクロスする全画面ヒーロー、商品セクション内の複数ミニカルーセルの一括初期化、PC/SP でカルーセル有無や設定を切り替える構成（matchMedia 生成破棄・別インスタンス）、ヒーロー登場アニメやプリローダー完了まで autoplay を止めておくゲート制御、スライド切替に連動した背景色ワイプや Ken Burns ズームまでを網羅する。ユーザーが「スライドショー入れたい」「カルーセルにして」「画像を自動で切り替えたい」「ヒーローを複数枚にしてフェードで回したい」「Swiper 使って」「SPだけスライダーにしたい」等を言ったときや、複数画像をローテーション表示したい文脈では必ずこのスキルを使うこと。
---

# swiper-hero-carousel

LP のヒーロー / ギャラリーに Swiper の fade + autoplay カルーセルを導入するスキル。設定値の判断表、PC/SP 切替方式、autoplay ゲートの 3 テーマで references を分割している。

## いつ使うか

- ヒーローに複数画像を置き、自動でゆっくりフェード切替したいとき
- 商品セクションごとに小さなカルーセルを複数置き、一括初期化したいとき
- PC は静止画・SP のみカルーセル（またはその逆）にしたいとき
- 登場アニメーションやプリローダーが終わるまでスライドを動かしたくないとき

## 変種の判断基準

### PC/SP 切替方式（最初に決める）

| 状況 | 方式 | 参照 |
|---|---|---|
| PC と SP で同じ DOM・同じ見た目 | 単一インスタンス（切替不要） | references/config-variants.md |
| 片側のみカルーセル（例: SP だけスライダー、PC はグリッド静止） | `matchMedia` の change で生成 / `destroy()` | references/pc-sp-switching.md |
| PC と SP で DOM ごと別（`--pc` / `--sp` の 2 セット出し分け） | 別インスタンスを条件付き初期化 | references/pc-sp-switching.md |

判断の軸: **DOM を共有できるなら生成破棄方式**（インスタンスが常に 1 つでメモリ安全）、**レイアウトが根本的に違うなら別インスタンス**（CSS の `display: none` 側は初期化しない、またはリサイズ跨ぎを想定しないページなら初回判定のみ）。

### 設定値の目安

- effect は `fade` が基本。`fadeEffect.crossFade` は、スライドが領域を完全に覆う画像のみなら `false`（軽い）、透過・テキスト・サイズ違いを含むなら `true`（前スライドを確実に消す）
- `speed`（フェード時間）: ヒーロー 1500〜2000ms、SP はやや短め（1200〜1500ms）
- `autoplay.delay`: ヒーロー 4000〜5000ms、本文中のミニカルーセル 3000ms 前後
- `allowTouchMove`: 演出扱い（背景的スライド）なら `false`、ユーザー操作させるなら `true`
- `disableOnInteraction: false` を必ず指定（触っても autoplay を止めない）
- `prefers-reduced-motion: reduce` 時は speed を 0 にする（即時切替）か autoplay 自体を止める

詳細な判断表と基本コードは **references/config-variants.md** を読む。スライド切替連動の背景色ワイプ / Ken Burns ズームもここにある。

### autoplay ゲートの要否

| 状況 | ゲート | 参照 |
|---|---|---|
| ページ表示直後から回してよい | 不要（即時 autoplay） | references/config-variants.md |
| ヒーロー登場アニメ / プリローダー完了後に回し始めたい | カスタムイベントゲート（`autoplay.stop()` → イベントで `start()`） | references/autoplay-gating.md |
| スクロールして画面に入ってから回し始めたい | ScrollTrigger ゲート | references/autoplay-gating.md |

## 導入手順

1. **導入形態の確認**: Vite 等のビルド環境なら `npm install swiper` し ES Modules でインポート（使用モジュールのみ `modules` に登録、CSS も個別インポート）。ビルドなしの静的構成なら script タグ + グローバル `Swiper` を使う
2. **初期化の集約**: 初期化コードは slider 用 JS 1 ファイルに集約し、`initSlider` 等の init 関数を export（ビルドなしなら DOMContentLoaded 後に実行）
3. **HTML**: `swiper` > `swiper-wrapper` > `swiper-slide` の標準構造。ファーストビュー内のスライド画像は `loading="eager"` + `fetchpriority="high"`
4. **変種選択**: 上の判断基準に従い、該当する references を読んでコードを移植する
5. **破棄**: 要素を破棄するページ遷移がある場合は `.destroy(true, true)` を呼ぶ

## 検品チェックリスト

- [ ] スライドが 2 枚以上ある（`loop: true` はスライド不足で console 警告が出る）
- [ ] `prefers-reduced-motion: reduce` で急なフェードや自動再生が抑制される
- [ ] PC/SP 切替方式の場合、ブレークポイントを跨いでリサイズしても二重初期化・取り残しがない（生成破棄方式は `destroy()` 後に null 代入されているか）
- [ ] autoplay ゲートを使う場合、ゲートイベントが発火しない環境（reduced-motion 等）でもスライダーが永久停止しない
- [ ] タッチ操作の可否（`allowTouchMove`）が意図通り
- [ ] コンソールに警告・エラーが出ない
