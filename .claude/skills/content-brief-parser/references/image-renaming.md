# 画像リネーム対応表と手順

支給画像は仮名（アンダースコア接頭辞・ゼロ埋めなし等）で届く。**HTML を書く前に**正規名へのリネーム対応表を作り、一括リネームする。仮名のまま `src` に書くと、後日の画像差し替え・追加時に対応関係が崩壊する。

## 命名規約（正規名）

すべての画像は **WebP** 形式（OGP 画像のみ JPG）。

### ルック画像

| パターン | 命名 | 例 |
| --- | --- | --- |
| 単一画像 | `look_XX.webp` | `look_01.webp` |
| 横分割（左） | `look_XX_left.webp` | `look_12_left.webp` |
| 横分割（右） | `look_XX_right.webp` | `look_12_right.webp` |
| 縦分割（上） | `look_XX_top.webp` | `look_05_top.webp` |
| 縦分割（下） | `look_XX_bottom.webp` | `look_05_bottom.webp` |

- `XX` は**ゼロパディング 2 桁**（01, 02, ..., 23）
- `_look_X.webp`（アンダースコア接頭辞・ゼロパディングなし）は**リネーム前の支給仮名**。最終的に必ず `look_XX.webp` にリネームして使う

### その他の定番ファイル

| ファイル名 | 用途 |
| --- | --- |
| `bnr.webp` / `bnr_sp.webp` | ヒーローバナー（PC / SP） |
| `logo.svg` | ブランドロゴ |
| `ogp.jpg` | OGP 画像（1200×630px） |

## リネーム対応表テンプレート

プロジェクトの `docs/image-map.md` 等に残す。**「支給名 ≠ ブロック番号」が普通にある**（支給の `_look_6` が LP 上の Block1、ということが起きる）ので、この表がブリーフと HTML をつなぐ唯一の台帳になる。

```markdown
| Block | 支給ファイル名 | 正規名 | 備考 |
| --- | --- | --- | --- |
| 1 | _look_6.webp | look_01.webp | |
| 2 | _look_8.webp | look_02.webp | 検索結果 URL へリンク |
| 3 | _look_5.webp | look_03.webp | |
| 4 | _look_3.webp | look_04.webp | 横分割 → look_04_left / look_04_right |
```

## 手順

1. **支給ファイルの棚卸し** — `ls image/_look_*.webp 等` で仮名ファイルを列挙し、ブリーフの画像キーと突合する（過不足があればこの時点で質問リストへ）。
2. **対応表の作成** — ブリーフのブロック順に、支給名 → 正規名を割り当てる。正規名の番号は**ブロック番号**（表示順）に合わせ、支給名の数字は引き継がない。
3. **リネーム実行** — 対応表どおりに `mv` する。機械的な連番リネームは下記スクリプト、対応表と番号がずれる場合は対応表から `mv` コマンドを 1 行ずつ生成する。
4. **検証** — 仮名ファイルの残存ゼロと、正規名ファイルの存在をコマンドで確認する。

### 一括リネーム（支給番号 = 正規番号の場合のみ）

```bash
cd image
for f in _look_*.webp; do
  n="${f#_look_}"; n="${n%.webp}"
  mv "$f" "$(printf 'look_%02d.webp' "$n")"
done
```

### 対応表から mv を生成（支給番号 ≠ 正規番号の場合）

対応表を「支給名<TAB>正規名」の 2 列テキスト（`rename-map.tsv`）にして:

```bash
cd image
while IFS=$'\t' read -r src dst; do
  mv -n "$src" "$dst"
done < rename-map.tsv
```

`mv -n` で既存ファイルの上書きを防ぐ（同名衝突があれば手を止めて対応表を見直す）。

## 検証コマンド

```bash
# 仮名の残存（ヒット 0 件になること）
ls image/_look_* 2>/dev/null && echo "NG: 仮名が残っています" || echo "OK"

# ゼロ埋めされていない正規名（ヒット 0 件になること: look_1.webp 等）
ls image/ | grep -E '^look_[0-9]\.(webp|jpg)$' && echo "NG: ゼロ埋め漏れ" || echo "OK"

# HTML が参照する画像がすべて存在すること（Missing が出ないこと）
grep -oE 'src="image/[^"]+"' index.html | sed -E 's/^src="|"$//g' | sort -u |
while read -r img; do
  [ -f "$img" ] || echo "Missing: $img"
done

# 逆に、HTML から参照されていない画像が無いか（納品物の余剰ファイル検出）
for f in image/look_*.webp; do
  grep -q "$(basename "$f")" index.html || echo "Unused: $f"
done
```
