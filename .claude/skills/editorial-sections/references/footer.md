# footer — ページ末尾の定型フッター

## 適用条件

LP 末尾の定型フッター。**ロゴ → パイプ区切りテキストリンク → SNS アイコン → コピーライト**の 4 ブロックを中央揃えで縦に積む。パイプ区切り（span）は SP で非表示になりリンクが縦積みに、PC で 1 行に戻る。

## 前提トークン

--spacing-lg, --color-rule-light（lp-design-tokens スキル参照）。

## CSS（完全コード / footer.css）

```css
/* ----------------------------------------------------------------
 Footer
----------------------------------------------------------------- */
.footer {
  width: 100%;
  margin: var(--spacing-lg) auto;
  text-align: center;

  @media (width >= 768px) {
    margin: 5.625rem auto;
  }

  a:hover img {
    opacity: 0.5;
  }

  .footer__logo {
    margin: 0 auto 5.625rem;

    p {
      width: 5.625rem;
      margin: 0 auto;
    }
  }

  .footer__links {
    margin: 0 auto 5.625rem;
    font-size: 0.8rem;
    letter-spacing: 0.1rem;

    a {
      display: block;
      margin: 0 auto 1.25rem;

      @media (width >= 768px) {
        display: inline;
        margin: 0;
      }
    }

    span {
      display: none;

      @media (width >= 768px) {
        display: inline;
        margin: 0 1.5625rem;
        color: var(--color-rule-light);
      }
    }
  }

  .footer__sns {
    margin: 0 auto 5.625rem;

    .footer__sns-title {
      margin: 0 auto 2.5rem;
      font-size: 1rem;
      letter-spacing: 0.1rem;
    }

    .footer__sns-icons {
      display: flex;
      justify-content: center;
      gap: 2.5rem;

      img {
        width: 2.0625rem;
      }
    }
  }

  .footer__copyright {
    margin: 0 auto 5.625rem;
    font-size: 0.8rem;
    letter-spacing: 0.1rem;
  }
}
```

## HTML 例

```html
<footer class="footer">
  <div class="footer__logo">
    <p>
      <a href="https://example.com/" target="_blank" rel="noopener">
        <img
          src="src/assets/images/logo.svg"
          loading="lazy"
          alt="{{BRAND_NAME}}"
          width="90"
          height="30"
        />
      </a>
    </p>
  </div>

  <nav class="footer__links" aria-label="関連リンク">
    <a href="https://example.com/" target="_blank" rel="noopener">ONLINE STORE</a><span>|</span>
    <a href="https://example.com/" target="_blank" rel="noopener">STAFF STYLING</a><span>|</span>
    <a href="https://example.com/" target="_blank" rel="noopener">OTHER CONTENTS</a>
  </nav>

  <div class="footer__sns">
    <p class="footer__sns-title">Follow us</p>
    <div class="footer__sns-icons">
      <a href="https://example.com/" target="_blank" rel="noopener">
        <img
          src="src/assets/images/icon_instagram.svg"
          loading="lazy"
          alt="Instagram"
          width="33"
          height="33"
        />
      </a>
      <a href="https://example.com/" target="_blank" rel="noopener">
        <img
          src="src/assets/images/icon_x.svg"
          loading="lazy"
          alt="X"
          width="33"
          height="33"
        />
      </a>
    </div>
  </div>

  <p class="footer__copyright">&copy;{{BRAND_NAME}} ALL RIGHTS RESERVED.</p>
</footer>
```

## 運用メモ

- 導入時に必ず確認する 3 点: **ロゴ画像**（SVG 推奨、alt にブランド名）/ **SNS アイコンとリンク先** / **コピーライト表記**（クライアント指定の正式表記をそのまま使う）
- footer__links の各リンクと ONLINE STORE 系ボタン（ec-button / links-list）の遷移先は一致させる。バラつくと計測時に流入元が割れる
- SNS アイコンは実案件では 2〜4 個。増減してもレイアウトは gap で吸収される
- パイプ区切りの span は装飾のみでスクリーンリーダーに読ませる意味が無いため、気になる場合は aria-hidden="true" を付ける
- 5.625rem（90px）の縦リズムがこのフッターの特徴。詰めたい場合は全ブロック一律で縮める（1 箇所だけ変えるとリズムが崩れる）
