# スキーマ → セクション HTML 生成手順

正規化済みの標準スキーマ（`brief-schema.md`）から、ブロックごとのセクション HTML を生成する手順。**スキーマを確定させてから**この手順に入る（支給テキストから直接書かない）。

## 基本テンプレート（1 ブロック = 1 `<article>`）

BEM 命名のルックブック型 LP を想定した参照実装。プロジェクトのマークアップ規約（CSS Modules・クラス命名等）が異なる場合は、**構造とルールを保ったままクラス名だけ読み替える**。

```html
<article class="look" data-look="1">
  <figure class="look__gallery">
    <a href="https://example.com/products/AAA111" target="_blank" rel="noopener">
      <img
        src="image/look_01.webp"
        alt="Look 01"
        width="800"
        height="1200"
        loading="lazy"
      />
    </a>
  </figure>
  <ul class="look__items">
    <li>
      <a href="https://example.com/products/AAA111" target="_blank" rel="noopener">
        <span class="look__item-name">Shirt</span>
        <span class="look__item-price">¥00,000</span>
      </a>
    </li>
    <li>
      <a href="https://example.com/products/BBB222" target="_blank" rel="noopener">
        <span class="look__item-name">Skirt</span>
        <span class="look__item-price">¥00,000</span>
      </a>
    </li>
  </ul>
  <span class="look__number" aria-hidden="true">01</span>
</article>
```

## フィールドの流し込み規則

| スキーマ | HTML | 規則 |
| --- | --- | --- |
| `block` | `data-look` | 連番そのまま（1 始まり） |
| `block` | `.look__number` / `alt` / `src` | **ゼロ埋め 2 桁**（`01`, `02`, ...） |
| `images[].canonical` | `img[src]` | リネーム後の正規名のみ使用。支給仮名を書かない |
| `images[].link` | `figure 内 a[href]` | null なら `<a>` を外して `<img>` を直置き |
| `credits[]` | `.look__items li` | スキーマの順序を維持 |
| `credits[].featured` | 表示仕様に応じて | 例: 先頭に星印・強調クラス付与。**扱いはクライアント確認の上で決める** |

## リンク無し商品（SHOP ONLY 等）の扱い

`url: null` の商品は `<a>` を使わず `<span>` 等で組む。空 href やダミーリンクは禁止。

```html
<li>
  <span class="look__item-name">Bag</span>
  <span class="look__item-price">¥00,000</span>
  <span class="look__item-note">SHOP ONLY</span>
</li>
```

## レイアウトバリエーション

| スキーマ `layout` | data 属性 | 構造 |
| --- | --- | --- |
| `default` | 省略 | 画像 1 枚＋クレジット |
| `side` | `data-layout="side"` | `look__gallery` 内に画像 2 枚（横並び） |
| `stack` | `data-layout="stack"` | `look__gallery` 内に複数画像を縦配置 |
| `visual` | `data-layout="visual"` | 画像のみ。`look__items` を出力しない |

## 生成時の必須ルール

- 外部リンクには必ず `target="_blank" rel="noopener"` を付与する
- 価格は `¥` ＋カンマ 3 桁区切り（正規化済みの値をそのまま使う。ここで再フォーマットしない）
- 品名は英語表記（Jacket, Tee, Pants, Skirt, Shoes 等）
- ファーストビュー外の画像は `loading="lazy"` ＋ `width` / `height` 必須（レイアウトシフト防止）。演出対象なら `data-animate` 等のプロジェクト規約の属性も付与
- 新しいブロックは既存の最後の `</article>` の直後（スタッフクレジットやフッターの前）に挿入する
- スクロール演出がクラス単位で全 `.look` に自動適用される設計なら、追加分も自動で対象になることを確認する

## 検品コマンド（生成後に必ず実行）

```bash
# --- 突合: スキーマのブロック数と HTML の article 数が一致すること ---
grep -c 'data-look=' index.html

# --- 突合: クレジット総数（スキーマの credits 合計と一致すること） ---
grep -c 'look__item-name' index.html

# --- 価格表記の検品（ヒット 0 件になること: カンマ漏れ・全角混入） ---
grep -nE '¥[0-9]{4,}' index.html
grep -nP '[０-９　]' index.html

# --- 空 href・プレースホルダ残存（ヒット 0 件になること） ---
grep -nE 'href=""|href="#"' index.html
grep -nE 'AAA111|¥00,000|ITEM NAME' index.html   # サンプル値の消し忘れ

# --- URL 疎通（すべて 200/30x になること） ---
grep -oE 'href="https?://[^"]+"' index.html | sed -E 's/^href="|"$//g' | sort -u |
while read -r url; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' -L "$url")" "$url"
done | grep -vE '^(200|301|302)' || echo "URL 疎通 OK"

# --- 画像存在チェック（Missing が出ないこと） ---
grep -oE 'src="image/[^"]+"' index.html | sed -E 's/^src="|"$//g' | sort -u |
while read -r img; do
  [ -f "$img" ] || echo "Missing: $img"
done
```
