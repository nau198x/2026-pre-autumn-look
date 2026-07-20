# 標準ブリーフスキーマと支給 3 形式のマッピング規則

支給形式が何であれ、まずこの標準スキーマに正規化する。正規化した中間表はプロジェクトの `docs/` 等に残し、検品と後日の差し替えに使う。

## 標準スキーマ定義

1 ブロック（= 1 ルック = LP 上の 1 セクション単位）を次の構造で表す。

```yaml
- block: 1                       # 表示順の連番（1 始まり）
  source_id: "Block1"            # 支給資料上の見出し（欠番検出用に原文のまま残す)
  layout: default                # default / side（横 2 枚）/ stack（縦積み）/ visual（画像のみ）
  images:
    - supplied: "_look_6"        # 支給ファイル名（リネーム前）
      canonical: "look_01.webp"  # 正規名（ゼロ埋め 2 桁。image-renaming.md 参照）
      link: "https://example.com/products/AAA111"   # 画像全体のリンク先（無ければ null）
  credits:
    - name: "Shirt"              # 品名（英語表記）
      price: "¥00,000"           # ¥ + カンマ 3 桁区切りに正規化済み
      url: "https://example.com/products/AAA111"    # 無ければ null
      note: null                 # "SHOP ONLY" 等の注記
      featured: false            # 主役商品マーカー（(*) 等）の有無
```

必須フィールド: `block` / `images[].supplied` / `images[].canonical` / `credits[].name` / `credits[].price`。
`url` が null の場合は `note` に理由（`SHOP ONLY` 等）を必ず入れる。

## 形式 A: ブロック形式（`# Block N` ＋見出し構造）

### 支給サンプル（汎用化）

```markdown
# Block1

## 画像

\_look_6 (URL: https://example.com/products/AAA111)

## クレジット1

Shirt ¥00,000 (URL: https://example.com/products/AAA111)

# Block2

## 画像

\_look_8 (URL: https://example.com/collection/?q=KEYWORD)

## クレジット1

Blouse ¥00,000 (URL:https://example.com/products/BBB222)

## クレジット2

Shirt ¥00,000 (URL:https://example.com/products/AAA111)
```

### マッピング規則

| 支給要素 | スキーマ先 | 備考 |
| --- | --- | --- |
| `# BlockN` | `block` / `source_id` | N をそのまま表示順に使う |
| `## 画像` 直下の行 | `images[]` | 行頭の `\_look_N` / `_look_N` が `supplied`。括弧内 URL が `link` |
| `## クレジットN` 直下の行 | `credits[N-1]` | 「品名 ¥価格 (URL: ...)」を分解 |

### ゆれの実例と吸収

- `(URL: https...)` と `(URL:https...)` — コロン後のスペース有無が混在する。正規表現で吸収。
- 画像行のリンク先が商品ページではなく検索結果 URL（`?q=...`）のことがある。そのまま `link` に入れる（勝手に商品 URL へ差し替えない）。
- ファイル末尾にゴミ文字（`@` 等）が紛れることがある。無視してよいが、行が欠けていないかは確認する。

## 形式 B: 見出し＋行形式（`# articleNN` / `# LookN` ＋ 1 行 1 商品）

### 支給サンプル（汎用化）

```markdown
# article01-1

JACKET ¥00,000 https://example.com/products/AAA111
PULLOVER ¥00,000 https://example.com/products/BBB222
SKIRT ¥00,000 https://example.com/products/CCC333
BAG ¥00,000 SHOP ONLY

# article01-3

CARDIGAN ¥00,000 https://example.com/products/DDD444
PANTS ¥00,000 https://example.com/products/EEE555
```

バリアント（CHECK ラベル付き）:

```markdown
# Look1

Shirt ¥00,000 CHECK(url: https://example.com/products/AAA111)
Jacket ¥00,000 CHECK(url: https://example.com/products/BBB222)
```

### マッピング規則

| 支給要素 | スキーマ先 | 備考 |
| --- | --- | --- |
| `# article01-1` / `# LookN` | `source_id`。`block` は登場順の連番を振り直す | `01-1` のような「セクション-連番」は画像キー（`article01_1` 等）にも対応させる |
| 各行 | `credits[]` | 「品名 ¥価格 URL」または「品名 ¥価格 CHECK(url: ...)」を分解 |
| `SHOP ONLY` 等 URL 位置の非 URL 文字列 | `url: null` + `note` | リンクを張らない |

### ゆれの実例と吸収

- **番号が飛ぶ**（`article01-3` の次が `article01-5` 等）。欠番が「そのルックは掲載しない」の意図か脱落かを必ず確認し、`block` は登場順で振り直す。
- **見出しに全角数字が混ざる**（`# Look３`）。正規化時に半角化する。機械検出: `grep -nP '[０-９]' ブリーフファイル`
- 同一商品が 1 ブロック内に重複して並ぶことがある。原文どおり残すか統合するかを確認する。

## 形式 C: リファレンス形式（主役商品マーカー付き行形式）

### 支給サンプル（汎用化）

```markdown
# Look2

(*)Cardigan ¥00,000 https://example.com/products/AAA111
Skirt¥00,000 https://example.com/products/BBB222
Socks ¥0,000 https://example.com/products/CCC333

# Look5

(*)Cardigan¥00,000 https://example.com/products/AAA111
Shirt ¥00,000 https://example.com/products/DDD444
```

### マッピング規則

| 支給要素 | スキーマ先 | 備考 |
| --- | --- | --- |
| 行頭の `(*)` / `(\*)` | `credits[].featured: true` | 主役商品（特集対象アイテム等）のマーカー。表示上どう扱うかはクライアント確認 |
| `品名¥価格`（スペース欠落） | `name` / `price` | `¥` の直前で品名と価格を分割して吸収 |

### ゆれの実例と吸収

- 品名と `¥` の間のスペースが**有ったり無かったりする**（`Skirt¥00,000`）。`¥` を区切りにパースする。
- Look 番号が大きく飛ぶ（Look2 → Look5 → Look7...）。掲載ルックの抜粋であることが多いが、必ず確認する。

## 共通パース規則（正規表現）

```text
1 商品行:      ^\(?\\?\*?\)?\s*(?<name>.+?)\s*¥(?<price>[\d,，]+)\s*(?<rest>.*)$
URL 抽出:      https?://[^\s)"]+
マーカー判定:   行頭が (*) または (\*)
価格の正規化:   カンマ・数字を半角化 → 3 桁区切りを再適用 → 先頭に ¥
リンク無し判定: rest に URL が無い場合、rest の残り（SHOP ONLY 等）を note へ
```

正規化後のセルフチェック:

```bash
# 全角数字・全角スペースの残存（ヒット 0 件になること）
grep -nP '[０-９　]' 正規化済みファイル

# 価格のカンマ漏れ（4 桁以上でカンマ無し。ヒット 0 件になること）
grep -nE '¥[0-9]{4,}' 正規化済みファイル
```
