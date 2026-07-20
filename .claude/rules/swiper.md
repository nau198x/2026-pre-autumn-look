---
globs: ["src/scripts/slider.js", "src/**/*.js"]
---

# Swiper 使用規約

## 導入

- Swiper はテンプレートに同梱していない。カルーセルを使う案件でのみ `npm install swiper` する

## インポート

- コアCSS: `import 'swiper/css'`
- 使用するモジュールの CSS は個別にインポートする:

```js
import "swiper/css/navigation";
import "swiper/css/pagination";
```

- 使用するモジュールは個別にインポートし、`modules` オプションで登録する:

```js
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";

const swiper = new Swiper(".swiper", {
  modules: [Navigation, Pagination],
  // ...
});
```

## 設計

- 初期化・設定は `src/scripts/slider.js` に集約する
- 複数のスライダーがある場合も同ファイル内で管理し、関数を分けて定義する
- ページ遷移や要素の破棄時には `.destroy()` を呼び出してメモリリークを防ぐ
