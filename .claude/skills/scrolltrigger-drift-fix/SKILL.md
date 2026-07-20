---
name: scrolltrigger-drift-fix
description: GSAP ScrollTrigger の発火位置が時間経過でズレる問題（accumulating drift）の診断と修正。ユーザーが「下にスクロールするほどフェードインが遅れる / 早すぎる」「ページ中盤から急にアニメが発火しなくなる」「画面に入っているのにアニメが出ない」「リサイズするとトリガー位置がズレる」「スクロールアニメの位置がおかしい」「lazy 画像を入れたらアニメが壊れた」等を言ったときは必ずこのスキルを使うこと。loading="lazy" の画像が多い LP、スクロール連動演出のある縦長ページで特に有用。新規 LP の予防設定（最初に仕込む defaults）にも使う。対象はあくまで発火位置の「ズレ」であり、アニメーションが全く動かない・全要素が最初から表示されているケースはドリフトではなく初期非表示ガードや JS 初期化の問題なので、scroll-reveal 等の実装側スキルを先に使うこと。
---

# scrolltrigger-drift-fix

スクロール連動アニメーションで、**ページを進むほど ScrollTrigger の発火位置が実際の要素位置と合わなくなる**現象（累積ドリフト）を診断し、根治するスキル。診断コマンドは references/diagnosis.md、修正コードは references/fixes.md にある。

## 症状（どれかに当てはまれば本スキル）

- 下にスクロールするほど、要素が画面に入ってもフェードイン発火が**遅れる**（累積遅延）
- **ページ中盤で急にトリガーが止まる**（そこから下は永遠に発火しない）← 最悪パターン
- 逆に、要素が見える前にすでに**フェード済み**になっている（累積先行）
- ウィンドウリサイズ後にトリガー位置がズレる
- 画像の多い LP、特に PC（広幅）や低速回線（Slow 4G）で顕著

## 原因の判断基準（多い順）

1. **`<img>` の width/height 属性と実ファイル寸法の比率不一致 + loading="lazy"** — これが最多。ブラウザは属性からアスペクト比を予約するが、ロード完了時に実寸比へ上書きされるため、比率が違うとロードの瞬間にレイアウトが動く。lazy 画像はスクロール中に順次ロードされるので、ページ高さの変動が**累積**する。ScrollTrigger はキャッシュした座標のままなのでズレていく
2. **初期化タイミングが DOMContentLoaded** — この時点では画像ロード前のことが多く、トリガー座標が「画像ロード前のレイアウト」でキャッシュされる
3. **once: true のトリガーが window.load の自動 refresh より先に発火** — 発火済みトリガーは古い位置のまま固定される
4. その他: invalidateOnRefresh 未設定 / 外部フォントの swap で高さが動く / モバイルの URL バー伸縮 resize

## 診断フロー

1. **症状の方向を特定する** — 発火が遅い（late）なら「初期化後にページが縮んだ」、早い（early）なら「伸びた」。方向が分かると原因（画像アスペクト比・font swap）の当たりが付く
2. **再現率を上げる** — devtools の Network Throttling を Slow 4G にしてハードリロード → ゆっくり下までスクロールして発火位置を観察する
3. **キャッシュ座標を目視する** — console で各トリガーの start/end を出し、想定との大小で Step 1 の方向を裏付ける（コマンドは references/diagnosis.md）
4. **refresh で直るか確認する** — console で ScrollTrigger.refresh() を実行し、未発火トリガーが正しい位置に戻るなら「キャッシュ計算時のレイアウト未確定」で確定。修正レシピへ進む

具体的なコマンド・確認手順は references/diagnosis.md を読む。

## 修正レシピ（3 点セットで適用する）

以下は**常にセットで**入れる。どれか 1 つでは不十分。コードは references/fixes.md にある。

1. **img 属性を実寸比に合わせる（最優先・根治）** — 実寸確認コマンドで全画像を洗い出し、属性を実寸（または等比）に修正する。比率さえ合っていれば絶対値は自由
2. **アニメ初期化を window.load に移す** — DOMContentLoaded 初期化をやめる
3. **lazy 画像ロード時の refresh フックを入れる** — debounce 版（公式推奨）またはカウントダウン版（全ロード後 1 回だけ）。スクロールイベントでの refresh は禁止（公式が明確に警告）

保険として各 scrollTrigger に invalidateOnRefresh: true、外部フォント使用時は document.fonts.ready 待ち、モバイル URL バー対策に ignoreMobileResize を追加する（すべて references/fixes.md）。

## 予防（新規プロジェクトで最初に仕込む）

- ScrollTrigger を使うなら init は最初から window.load
- scrollTrigger オプションに invalidateOnRefresh: true をデフォルト付与
- img の width/height 属性は実寸を確認してから書く（scroll-reveal / lp-section-layouts スキルの検品にも含まれる）
- ファーストビュー外は loading="lazy"、ファーストビュー内は loading="eager" + fetchpriority="high"
- 初期非表示 CSS は @media (scripting: enabled) でガード（scroll-reveal スキル参照）

## 検品チェックリスト（修正後）

- [ ] PC（広幅）で最下部までスクロールし、各要素のフェード発火が start ラインを横切った瞬間に起きる
- [ ] Slow 4G スロットリング下でも症状が再現しない
- [ ] ウィンドウリサイズ後も発火位置がズレない
- [ ] SP で回帰していない（scroll jank が出ていない）
- [ ] prefers-reduced-motion: reduce でアニメが無効化される
- [ ] コンソールに警告・エラーが出ない
