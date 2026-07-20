# modal — サウンド ON/OFF 確認モーダル（HTML + CSS + 開閉 JS）

## 適用条件

ページ入場時に全画面表示し、BGM の再生可否をユーザーに選ばせるモーダル。閉じるまで背面の操作を無効化する。Audio 本体の管理は references/audio-lifecycle.md を使う。

## HTML（body 直下、コンテンツより後に置く）

```html
<div class="sound-modal" id="sound-modal">
  <div class="modal-content">
    <div class="modal-header">
      <p class="message">Sound Recommended<br />音声と一緒にお楽しみください</p>
    </div>
    <div class="modal-buttons">
      <button class="modal-btn" id="sound-on-btn" type="button">ON</button>
      <button class="modal-btn" id="sound-off-btn" type="button">OFF</button>
    </div>
  </div>
</div>
```

## CSS（完全コード / modal.css）

```css
.sound-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: auto;
  touch-action: auto;
}

.sound-modal .message {
  /* 見出し用フォントを使う場合はトークン参照（例: var(--font-display)） */
  font-weight: 500;
  text-align: center;
}

.sound-modal.hidden {
  display: none;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 240px;
  width: 100%;
  text-align: center;
  opacity: 1;
  transition: opacity 0.5s ease-out;
  /* iOS Safari 対応: GPU アクセラレーション強制（transition 不発対策とセット） */
  transform: translateZ(0);
  will-change: opacity;
  backface-visibility: hidden;
}

.modal-content.fade-out {
  opacity: 0;
}

.modal-header {
  max-width: 320px;
  margin-bottom: 40px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.modal-btn {
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 60px;
  flex: 1;
  max-width: 70px;
  border: none;
  background: none;
  user-select: none;
}

.modal-btn:hover {
  transform: translateY(-2px);
}

.modal-btn:active {
  transform: translateY(2px);
}

/* モーダル表示中の背面操作制限（最低限）。より堅牢にするなら scroll-lock スキルを併用 */
body.modal-active {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

/* 背面コンテンツの操作無効化: セレクタは自ページの主要コンテナに合わせて書き換える */
body.content-disabled .page-content {
  pointer-events: none;
  touch-action: none;
  user-select: none;
}
```

## 開閉 JS（完全コード / sound-modal.js）

```js
/**
 * サウンド選択モーダル
 * - ON / OFF ボタンのハンドリングと開閉演出のみを担当する
 * - Audio の再生・停止は audio-lifecycle.md の BgmManager に委譲する
 */
const FADE_OUT_DURATION = 500; // .modal-content の transition と合わせる

export const initSoundModal = ({ onSoundOn, onSoundOff, onHidden } = {}) => {
  const modal = document.getElementById("sound-modal");
  const onBtn = document.getElementById("sound-on-btn");
  const offBtn = document.getElementById("sound-off-btn");
  if (!modal || !onBtn || !offBtn) return;

  const setButtonsEnabled = (enabled) => {
    onBtn.disabled = !enabled;
    offBtn.disabled = !enabled;
  };

  const show = () => {
    modal.classList.remove("hidden");
    document.body.classList.add("modal-active", "content-disabled");
  };

  const hide = () => {
    const content = modal.querySelector(".modal-content");

    if (content) {
      // iOS Safari 対応: 強制リフロー → 次フレームで fade-out クラス付与。
      // これを挟まないと transition が発火せず、即座に消えることがある
      void content.offsetHeight;
      requestAnimationFrame(() => {
        content.classList.add("fade-out");
      });
    }

    setTimeout(() => {
      modal.classList.add("hidden");
      content?.classList.remove("fade-out"); // 再表示に備えて掃除
      document.body.classList.remove("modal-active", "content-disabled");
      onHidden?.();
    }, FADE_OUT_DURATION);
  };

  onBtn.addEventListener("click", async () => {
    setButtonsEnabled(false); // 連打防止
    try {
      await onSoundOn?.(); // BgmManager.enable() を想定（失敗しても進行は止めない）
    } finally {
      setButtonsEnabled(true);
      hide();
    }
  });

  offBtn.addEventListener("click", () => {
    onSoundOff?.();
    hide();
  });

  show();
};
```

## 運用メモ

- 元実装（オブジェクトリテラル + ID 直参照のプレーン JS）を ES module 化し、Audio 管理を分離した。開閉演出・iOS リフロー対策・連打防止の挙動は元実装と同一
- `body.content-disabled` のセレクタは自ページの主要コンテナ（例: .page-content）へ書き換える。コンテナが複数あるなら列挙する
- モーダルの背景演出（動画・Canvas 等）を敷く場合は .sound-modal の背面レイヤーとして追加し、pointer-events を殺しておく
- 閉じた後にヒーロー入場を始める場合は onHidden から発火する（lp-hero スキルのイベント契約参照）
