# 完了通知の標準契約（全変種共通）

プリローダーの「完了」を後続処理（ヒーロー入場アニメ・ScrollTrigger 初期化・カルーセル autoplay 起動）へ伝える方法の標準規約。過去案件では `onComplete` コールバック / `loading:complete` / `loadingComplete` / `hero:animation-complete` などが混在し、流用のたびに購読側の書き換え漏れが起きていた。**新規実装は必ずこの契約に従うこと。**

## 標準イベント名

| イベント名 | dispatch 先 | 発火タイミング | 用途 |
|---|---|---|---|
| `loading:complete` | `document` | スクロールロック解除・ScrollTrigger 初期化の**後**、プリローダー DOM 除去の前後どちらでも可 | 後続演出の開始合図。**これが唯一の必須イベント** |
| `loading:overlay-fade-start` | `document` | カバー / オーバーレイの opacity アニメが始まる直前 | 「カバー越しにヒーローが見え始める瞬間」に Ken Burns 等を同期させたい場合のみ（任意） |
| `hero:animation-complete` | `document` | ヒーロー入場タイムラインの `onComplete` | ヒーロー完了後にカルーセル autoplay 等を始めたい場合のみ（任意） |

命名規約: `名前空間:動詞` 形式・コロン区切り・小文字。旧実装からの移行対応表:

| 旧名 | 新名 |
|---|---|
| `loadingComplete`（キャメルケース） | `loading:complete` |
| `onComplete` コールバックのみ | コールバックは残してよいが、**併せて `loading:complete` も必ず dispatch** |

## 発火順序（厳守）

```
1. 進捗 100% 表示（バー / 塗りを埋め切る）
2. ロゴ / バーの退場演出
3. document.dispatchEvent(new Event("loading:overlay-fade-start"))  ※使う場合のみ
4. カバーのフェードアウト開始
5. スクロールロック解除（body クラス除去 + wheel/touchmove リスナー除去）
6. ScrollTrigger の初期化 または ScrollTrigger.refresh()
7. onComplete() コールバック実行
8. document.dispatchEvent(new Event("loading:complete"))
9. プリローダー DOM を remove()
```

5 → 6 の順序が最重要。`overflow: hidden` のままページ下方のトリガー位置を計算すると、スクロール可能高さが実際と異なるため**発火位置が全部ズレる**。ScrollTrigger を使うページでは必ずロック解除後に初期化（または `refresh()`）する。

## dispatch 側の実装（各変種の onComplete に載せる）

```js
// main.js
runPreloader({
  onComplete: () => {
    initScrollAnimations(); // ScrollTrigger 初期化（ロック解除済みの状態で呼ばれる）
    document.dispatchEvent(new Event("loading:complete"));
  },
});
```

`onComplete` は「プリローダー実装と同一モジュール圏の初期化」用、`loading:complete` は「疎結合な購読者（hero.js / slider.js 等）」用と使い分ける。両方あってよい。

## 購読側の実装（標準形）

購読は `{ once: true }` を必ず付ける。加えて**フォールバックタイマー**を併設する — 万一イベントが発火しなくても（プリローダー撤去・例外・読み込み順の事故）演出が永久に始まらない事態を防ぐ。

```js
// hero.js
export const initHero = () => {
  let played = false;
  const start = () => {
    if (played) return; // イベントとフォールバックの二重実行ガード
    played = true;
    // ... ヒーロー入場タイムライン
    // tl の onComplete で:
    // document.dispatchEvent(new Event("hero:animation-complete"));
  };

  document.addEventListener("loading:complete", start, { once: true });

  // フォールバック: プリローダーの timeoutMs + フェード時間 + バッファ より長く
  setTimeout(start, 8000);
};
```

フォールバック時間の目安: `timeoutMs (5000) + フェード (1000) + バッファ (2000) = 8000ms`。プリローダーのタイムアウトを変えたらここも連動して見直す。

### 購読が遅れる可能性がある場合（動的 import 等）

イベントは「発火した瞬間にリスナーがいなければ消える」。モジュールの読み込みが `loading:complete` より後になり得る構成では、フラグ付きヘルパーを共有する:

```js
// loading-signal.js
let completed = false;

export const signalLoadingComplete = () => {
  completed = true;
  document.dispatchEvent(new Event("loading:complete"));
};

export const onLoadingComplete = (fn) => {
  if (completed) {
    fn(); // 既に完了済みなら即実行
  } else {
    document.addEventListener("loading:complete", fn, { once: true });
  }
};
```

dispatch 側は `signalLoadingComplete()` を、購読側は `onLoadingComplete(fn)` を使う（この場合もフォールバックタイマーは残す）。

## 後続処理ごとの接続パターン

| 後続処理 | 接続方法 |
|---|---|
| ヒーロー入場アニメ | `loading:complete` を購読して timeline を `play()`。初期状態（opacity: 0 等）は購読前に `gsap.set` 済みにしておく |
| ScrollTrigger 初期化 | `onComplete` 内で直接呼ぶ（イベント購読にしない — 順序 6 を保証するため） |
| Swiper autoplay | `autoplay.delay` 付きで生成しつつ `swiper.autoplay.stop()` しておき、`loading:complete`（ヒーローが carousel の場合）または `hero:animation-complete`（ヒーロー演出後に回し始めたい場合）で `swiper.autoplay.start()` |
| Ken Burns / 背景ズーム | 「カバー越しに見え始める瞬間」と合わせたいなら `loading:overlay-fade-start`、開き切ってからなら `loading:complete` |
| BGM / 動画 play() | `loading:complete`。autoplay 制約があるためミュート前提 |

## 検品

- [ ] `loading:complete` が 1 回だけ発火する（DevTools: `monitorEvents(document, "loading:complete")` 相当のログで確認）
- [ ] 購読側すべてが `{ once: true }` + 二重実行ガード付き
- [ ] プリローダーを HTML から丸ごと削除しても、フォールバックで後続演出が開始される
- [ ] ScrollTrigger の初期化がロック解除後に行われている（下方セクションの発火位置がズレない）
- [ ] イベント名がこの契約の表記と完全一致（タイポ・キャメルケース残りがない）
