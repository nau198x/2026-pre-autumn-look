---
globs: ["src/**/*.css"]
---

# レスポンシブデザイン規約

## 基本方針

- モバイルファーストで記述する（min-width でブレークポイントを定義）

## ブレークポイント

- `768px`: タブレット
- `1024px`: デスクトップ

## 記述例

```css
.root {
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
