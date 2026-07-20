# ブレークポイント標準（mobile-first）と旧方式からの移行

## 標準形

基本スタイルをモバイルで書き、768px（タブレット）と 1024px（デスクトップ）の 2 段で上書きする。範囲構文（`width >=`）を使う。

```css
.section-name {
  padding: 2rem 1rem; /* モバイル（デフォルト） */

  @media (width >= 768px) {
    /* タブレット */
    padding: 4rem 2rem;
  }

  @media (width >= 1024px) {
    /* デスクトップ */
    padding: 6rem 3rem;
  }
}
```

- 境界値は **768 / 1024 の 2 つだけ**を使う。セクションごとに独自の境界値（900px 等）を増やさない（増やすほど検品パターンが爆発する）
- 範囲構文（`width >= 768px`）と旧構文（`min-width: 768px`）は等価だが、案件内でどちらかに統一する。新規は範囲構文
- 1 段（768px のみ）で足りる小規模 LP は 1024px を省略してよい。その場合も**方式は mobile-first のまま**にする

## PC / SP の画像出し分け

同一の境界値で「片方を隠す」形にする。`<` と `>=` の組で書けば隙間も重複も生まれない。

```css
/* SP でだけ見せる要素・PC でだけ見せる要素 */
@media (width < 768px) {
  .pc {
    display: none;
  }
}

@media (width >= 768px) {
  .sp {
    display: none;
  }
}
```

## 警告: 旧方式（max-width / min-width 混在）の 1px 境界バグ

過去案件で実際に観測された事故パターン。**新規案件では禁止、移植時は必ず修正する。**

### 事故 1: 隙間（768〜769px の適用漏れ）

```css
/* NG: どちらも適用されない幅が存在する */
@media (max-width: 768px) { /* 〜768px */ }
@media (min-width: 769px) { /* 769px〜 */ }
```

768px と 769px の間（ズーム時・高 DPI 環境などで発生する 768.5px のような小数幅）では**両方のクエリが不成立**になり、どちらのスタイルも当たらない。「特定の端末でだけレイアウトが素っ裸になる」再現困難バグの典型。

### 事故 2: 重複（768〜769px の二重適用）

```css
/* NG: 両方適用される幅が存在する */
@media (min-width: 768px) { /* 768px〜 */ }
@media (max-width: 769px) { /* 〜769px */ }
```

768〜769px では**両方のクエリが成立**し、後勝ちで意図しない側のスタイルが当たる。「タブレットの縦横回転で一瞬だけ崩れる」形で露見した実例がある。

### 正しい書き方

範囲構文なら境界を 1 つの値で共有でき、隙間も重複も構造的に起きない:

```css
@media (width < 768px) { /* 〜767.999px */ }
@media (width >= 768px) { /* 768px〜 */ }
```

旧構文で書く場合は `max-width: 767px` / `min-width: 768px` の組にする（それでも小数幅の隙間は理論上残るため、範囲構文を推奨）。

## 旧方式からの移行手順

1. 検出:

```bash
grep -rn --include="*.css" -e "max-width: 768px" -e "max-width:768px" \
  -e "min-width: 769px" -e "min-width:769px" src/styles/ css/
```

2. 方針を決める: **既存 CSS が desktop-first（max-width 基準）で大量にある場合、一括の機械置換はしない。** `max-width: 768px` → `width < 768px` の書き換えだけを先に行い（境界バグの除去が最優先）、mobile-first への反転はセクションを触るタイミングで段階的に行う
3. 置換例:
   - `@media (max-width: 768px)` → `@media (width < 768px)`
   - `@media (min-width: 769px)` → `@media (width >= 768px)`
   - `@media screen and (max-width: 768px)` → `@media (width < 768px)`（`screen and` は不要）
4. 検品: DevTools のレスポンシブモードで幅 767 / 768 / 769px を順に確認し、`.pc` / `.sp` の同時表示・同時非表示、レイアウトの適用漏れが無いことを見る

## 検品チェックリスト

- [ ] メディアクエリの境界値が 768 / 1024 のみ（独自境界値ゼロ）
- [ ] `max-width: 768px` と `min-width: 769px` の混在が無い（上記 grep でヒット 0）
- [ ] 幅 767 / 768 / 769px で PC / SP 出し分けが正しく切り替わる
- [ ] 新規セクションが mobile-first（デフォルト = モバイル、上書き = 広い側）で書かれている
