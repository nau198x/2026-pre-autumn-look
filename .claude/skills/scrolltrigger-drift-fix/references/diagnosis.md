# diagnosis — ドリフトの診断手順とコマンド

SKILL.md の診断フローに対応する具体的なコマンド集。

## Step 1. 画像の実寸と属性の突合（原因第 1 位の検知）

実寸を一括で出力し、`<img width height>` 属性と比率を比較する:

```bash
# macOS（sips）
for f in path/to/images/**/*.{jpg,png,webp}; do
  sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null \
    | awk -v f="$f" '/pixelWidth:/ {w=$2} /pixelHeight:/ {print f, w"x"$2}'
done

# Linux / 汎用（ImageMagick）
identify -format "%f %wx%h\n" path/to/images/**/*.{jpg,png,webp}
```

HTML 側の属性を抽出して突き合わせる:

```bash
grep -oE '<img[^>]*>' index.html | grep -oE 'src="[^"]*"|width="[^"]*"|height="[^"]*"'
```

**判定**: 横長・縦長の画像が混在しているのに属性が一律（例: 全部 width="800" height="1000"）なら、原因はほぼ確定。

## Step 2. 症状の方向（late / early）の判定

| 症状 | 意味 | 原因方向 |
|---|---|---|
| 要素が見えても発火しない（late） | キャッシュされた scroll 座標が実際より大きい | 初期化後に**ページが縮んだ**（属性 > 実寸比） |
| 見える前にフェード済み（early） | キャッシュされた scroll 座標が実際より小さい | 初期化後に**ページが伸びた**（属性 < 実寸比） |

## Step 3. devtools での再現

1. Network タブ → Throttling → **Slow 4G**
2. ハードリロード（キャッシュ無効）
3. ゆっくり下までスクロールし、発火位置と要素位置のズレを観察

初回ロードで再現しなくても、低速回線で再現するなら lazy ロードの累積が原因。

## Step 4. キャッシュ座標の目視

ブラウザ console で:

```js
ScrollTrigger.getAll().forEach((st) => {
  console.log(st.trigger, "start:", st.start, "end:", st.end);
});
```

`st.start` が想定（要素の実位置）より大きい / 小さいかで Step 2 の方向を裏付ける。

## Step 5. refresh テスト（確定診断）

console で:

```js
ScrollTrigger.refresh();
```

これで未発火トリガーが正しい位置に戻る（発火し始める）なら、**「キャッシュ計算時のレイアウトが未確定だった」ことが確定**。references/fixes.md のレシピで恒久対応する。

戻らない場合は別原因（トリガー要素の display 切替、pin の入れ子等）なので、このスキルの範囲外。トリガー対象の CSS を疑う。

## 補足メモ

- ScrollTrigger の autoRefreshEvents デフォルトは `visibilitychange,DOMContentLoaded,load,resize`。通常は変更不要
- `gsap.fromTo(el, { y: 10 }, ...)` は immediateRender により init 時点で transform が乗るため、start 計算に +10px 程度の影響がある。主因にはならないが、他原因と複合すると効いてくる
- `container-type: inline-size` + `cqi` 単位はスクロールバー出現などのコンテナ幅変動で font-size が微変動し、レイアウトが動く一因になり得る
