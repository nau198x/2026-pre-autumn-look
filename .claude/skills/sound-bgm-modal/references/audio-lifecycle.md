# audio-lifecycle — BGM の再生・一時停止・停止管理

## 適用条件

BGM の Audio オブジェクトを 1 箇所で管理し、タブ切替・ページ離脱で行儀よく振る舞わせるモジュール。references/modal.md のモーダルとセットで使う（再生開始は必ずユーザージェスチャ起点にするため）。

## JS（完全コード / bgm-manager.js）

```js
/**
 * BGM 管理
 * - enable() は必ずユーザージェスチャ（クリック等）のハンドラから呼ぶこと。
 *   ブラウザの自動再生ポリシーにより、ジェスチャ起点でない play() はブロックされる
 * - タブ非表示: 一時停止（停止ではない。復帰時に続きから再開するため）
 * - ページ離脱: 完全停止 + 解放（pagehide が本命、beforeunload は旧ブラウザ保険）
 */
export const createBgmManager = (src, { volume = 0.5, loop = true } = {}) => {
  let audio = null;
  let enabled = false;
  let initializing = false;

  const stop = () => {
    try {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
    } catch (error) {
      console.error("BGM 停止でエラー:", error);
    }
  };

  const enable = async () => {
    if (initializing || enabled) return; // 連打・二重再生防止
    initializing = true;
    enabled = true;

    try {
      stop(); // 念のため既存インスタンスを破棄

      audio = new Audio(src);
      audio.loop = loop;
      audio.volume = volume;

      // ユーザージェスチャ起点の再生。失敗しても呼び出し側の進行は止めない
      await audio.play().catch((error) => {
        console.warn("音声の再生がブロックされました:", error);
      });
    } catch (error) {
      console.error("BGM 初期化でエラー:", error);
    } finally {
      initializing = false;
    }
  };

  const disable = () => {
    enabled = false;
    stop();
  };

  // --- ライフサイクル ---

  // タブ非表示: 一時停止 / 復帰: ユーザーが ON を選んでいた場合のみ再開
  document.addEventListener("visibilitychange", () => {
    if (!audio) return;
    if (document.hidden) {
      try {
        audio.pause();
      } catch (error) {
        console.error("BGM 一時停止エラー:", error);
      }
    } else if (enabled) {
      audio.play().catch((error) => {
        // 復帰時の play() は autoplay 制限で失敗することがある。握りつぶして良い
        console.warn("BGM 再開に失敗:", error);
      });
    }
  });

  // ページ離脱: ブラウザ/タブを閉じる・別ページへ遷移・ブラウザバック（bfcache 含む）
  window.addEventListener("pagehide", stop);
  // 旧デスクトップブラウザ向けの保険
  window.addEventListener("beforeunload", stop);

  return { enable, disable, stop };
};
```

## モーダルとの接続例（main.js）

```js
import { initSoundModal } from "./sound-modal.js";
import { createBgmManager } from "./bgm-manager.js";

document.addEventListener("DOMContentLoaded", () => {
  const bgm = createBgmManager("sound/bgm.mp3", { volume: 0.5 });

  initSoundModal({
    onSoundOn: () => bgm.enable(), // クリックハンドラ内 = ジェスチャ起点なので再生できる
    onSoundOff: () => bgm.disable(),
    onHidden: () => {
      // モーダルが消えた後に開始する演出があればここから（lp-hero のイベント契約へ）
    },
  });
});
```

## 運用メモ

- 元実装（グローバルオブジェクト + jQuery 併存ページのプレーン JS）をファクトリ関数の ES module に書き換えた。ライフサイクル挙動（visibilitychange / pagehide / beforeunload、一時停止と停止の使い分け、連打防止フラグ）は元実装と同一
- **一時停止と停止を混同しない**: visibilitychange は pause のみ（currentTime を保持）、pagehide / beforeunload は currentTime = 0 + 解放。タブ復帰で「曲の頭から鳴り直す」のは体験が悪い
- 音源はページ読み込みと並行してダウンロードされる。重い音源（> 2〜3MB）は preload="none" 相当の遅延を検討するより先に、ビットレートを落とす（BGM 用途なら 128kbps で十分）
- 複数音源（BGM + 効果音）を扱う場合は createBgmManager を音源ごとに生成してよいが、visibilitychange 等のリスナーが重複するので、その規模になったら一元管理のオーディオクラスに設計を上げる
