# head テンプレート（プレースホルダ入り・完全版）

LP の `<head>` と GTM noscript（body 直後）の完全テンプレート。
**先に下の「プロジェクト設定表」を埋め、その値でプレースホルダを一括置換する**こと。個別のタグを手で書き換えない。

## プロジェクト設定表

タグ生成前にこの 8 項目を確定する。ここが唯一の情報源（single source of truth）。

| プレースホルダ | 内容 | 例 |
| --- | --- | --- |
| `{{PROJECT_SLUG}}` | 公開ディレクトリ名（英小文字・数字・アンダースコア） | `spring_collection_2030` |
| `{{EC_DOMAIN}}` | 公開ドメイン | `www.example.com` |
| `{{PRODUCTION_URL}}` | 公開 URL（**末尾スラッシュ必須**） | `https://www.example.com/special/{{PROJECT_SLUG}}/` |
| `{{SITE_TITLE}}` | ページタイトル（`ページ名 \| {{BRAND_NAME}}公式サイト` 形式を推奨） | `2030 SPRING COLLECTION \| {{BRAND_NAME}}公式サイト` |
| `{{SITE_DESCRIPTION}}` | meta description（全角 80〜120 字目安。OGP と共用） | — |
| `{{BRAND_NAME}}` | ブランド表示名（og:site_name に使用） | — |
| `{{GTM_ID}}` | Google Tag Manager ID | `GTM-XXXXXXX` |
| `{{TWITTER_HANDLE}}` | X（Twitter）公式アカウント（`@` 始まり。無ければ twitter:site 行を削除） | `@brand_official` |

導出値（手入力しない）:

- OGP 画像 URL = `{{PRODUCTION_URL}}ogp.jpg`（絶対 URL・**拡張子付き**・1200×630px）
- canonical = `{{PRODUCTION_URL}}`

## head 全体テンプレート

```html
<!doctype html>
<html lang="ja">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">
    <meta charset="UTF-8" />
    <!-- user-scalable=no / maximum-scale=1 は禁止（ピンチズーム禁止はアクセシビリティ退行） -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- ============ TDK ============ -->
    <meta name="description" content="{{SITE_DESCRIPTION}}" />
    <meta name="keywords" content="{{BRAND_NAME}},ファッション,アパレル,{{PROJECT_KEYWORDS}}" />
    <title>{{SITE_TITLE}}</title>

    <!-- ============ インデックス制御 ============ -->
    <!-- 公開前（テストアップ時）のみ有効化し、本公開時に必ず削除する -->
    <!-- <meta name="robots" content="noindex, nofollow" /> -->
    <link rel="canonical" href="{{PRODUCTION_URL}}" />

    <!-- ============ OGP ============ -->
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:title" content="{{SITE_TITLE}}" />
    <meta property="og:url" content="{{PRODUCTION_URL}}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{{BRAND_NAME}}" />
    <meta property="og:description" content="{{SITE_DESCRIPTION}}" />
    <meta property="og:image" content="{{PRODUCTION_URL}}ogp.jpg" />

    <!-- ============ Twitter Card ============ -->
    <meta name="twitter:card" content="summary_large_image" />
    <!-- twitter:site は @ 始まりのアカウント名。無い場合はこの行ごと削除する（タイトル文字列を入れない） -->
    <meta name="twitter:site" content="{{TWITTER_HANDLE}}" />
    <meta name="twitter:title" content="{{SITE_TITLE}}" />
    <meta name="twitter:description" content="{{SITE_DESCRIPTION}}" />
    <meta name="twitter:image" content="{{PRODUCTION_URL}}ogp.jpg" />
    <meta name="twitter:url" content="{{PRODUCTION_URL}}" />

    <!-- ============ favicon ============ -->
    <!-- 新規は rel="icon" に統一（rel="shortcut icon" はレガシー記法）。SVG の場合は type="image/svg+xml" -->
    <link rel="icon" href="{{FAVICON_URL}}" type="image/png" />

    <!-- ============ Web フォント ============ -->
    <!-- preconnect 2 行はセット。family= を空にしないこと -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family={{GOOGLE_FONTS_FAMILY}}&display=swap"
      rel="stylesheet"
    />

    <!-- ============ スクロール位置復元の無効化 ============ -->
    <!-- リロード時にブラウザが前回位置へ復元すると、スクロール演出前提の LP が壊れるため先頭へ戻す -->
    <script>
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    </script>

    <!-- Google Tag Manager -->
    <script>
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          "gtm.start": new Date().getTime(),
          event: "gtm.js",
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "{{GTM_ID}}");
    </script>
    <!-- End Google Tag Manager -->
  </head>

  <body>
    <!-- Google Tag Manager (noscript) — head のスクリプトと必ずペアで入れる。body 開始タグ直後に置く -->
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id={{GTM_ID}}"
        height="0"
        width="0"
        style="display: none; visibility: hidden"
      ></iframe>
    </noscript>
    <!-- End Google Tag Manager (noscript) -->

    <!-- 以降、ページコンテンツ -->
  </body>
</html>
```

## GTM ID 未支給時の雛形（コメントアウト運用）

開発着手時点で GTM ID が未支給の場合は、下のようにコメントアウト状態で両方を仕込んでおく。
プレースホルダ ID のまま有効化すると gtm.js が 404 になりコンソールを汚すため、**支給されるまで解除しない**。

```html
<!--
  Google Tag Manager
  支給された GTM ID に置き換え、このコメントを解除して有効化する
-->
<!--
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
</script>
-->
<!-- End Google Tag Manager -->
```

body 側の noscript も同様にコメントアウトでペア管理する:

```html
<!--
  Google Tag Manager (noscript)
  支給された GTM ID に置き換え、このコメントを解除して有効化する
-->
<!--
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display: none; visibility: hidden"></iframe>
</noscript>
-->
<!-- End Google Tag Manager (noscript) -->
```

## Google Fonts の family クエリの書き方

`{{GOOGLE_FONTS_FAMILY}}` の置換例。スペースは `+`、ウェイト指定は `:wght@`、複数ファミリーは `&family=` で連結する。

```text
1 書体:              family=Zen+Old+Mincho&display=swap
ウェイト指定:        family=Jost:wght@400;500;700&display=swap
複数書体:            family=Jost:wght@400;500;700&family=Zen+Old+Mincho:wght@400;500;700&display=swap
```

置換後、URL に `family=&` や `family="` が残っていないことを必ず確認する（フォント差し替え時に family だけ消える事故が実際に起きている）。
