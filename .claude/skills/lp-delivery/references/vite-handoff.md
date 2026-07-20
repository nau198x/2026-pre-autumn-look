# ビルドあり案件（Vite）の納品手順

`npm run build` の `dist/` 一式を受け渡す。`dist/` は Git 管理外のため、**必ずその場でクリーンビルドし直す**（古い成果物の流用禁止）。

## 1. 事前確認

```bash
# base が相対パス出力になっていること（"./" が出力されること）
grep -n 'base' vite.config.js

# 作業ツリーが最新か（未コミットの変更が納品に含まれるべきものか確認）
git status --short
```

`base: "./"` が無い場合はここで止めて追加する。納品先は `https://example.com/special/{{PROJECT_SLUG}}/` のような任意サブディレクトリ配置が前提。

## 2. クリーンビルド

```bash
rm -rf dist
npm run build
```

- ビルドログに警告・エラーが出ないこと
- チャンクサイズ警告が出た場合は、そのまま渡さず原因（巨大画像・重複バンドル）を確認する

## 3. ビルド結果のプレビュー確認

```bash
npm run preview   # http://localhost:4173
```

開発サーバー（`npm run dev`）ではなく**ビルド後の実物**で、表示・アニメーション・リンク・console を確認する。

## 4. dist の中身検品

```bash
# ソースマップ・OS ゴミの混入（何も出力されないこと）
find dist -name '*.map' -o -name '.DS_Store'

# プレースホルダの残存（ヒット 0 件になること）
grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" dist/ | grep -v '\.map'

# ルート絶対パス参照の混入（ヒット 0 件になること。相対 "./assets" になっているはず）
grep -rnE '(src|href)="/(assets|image)' dist/*.html

# GTM の 2 点セット（2 になること）
grep -c 'googletagmanager.com' dist/index.html

# ファイル一覧の目視（想定外のファイルが無いこと）
find dist -type f | sort
```

## 5. 日付スナップショット + zip 化

```bash
PROJECT="{{PROJECT_SLUG}}"            # 例: spring-collection-lp
SNAP="${PROJECT}_$(date +%m%d)"       # 例: spring-collection-lp_0713

cp -R dist "$SNAP"
find "$SNAP" -name '.DS_Store' -delete
zip -r -X "${SNAP}.zip" "$SNAP" -x '*.DS_Store'

# 中身の最終確認（開発ファイル・.DS_Store が無いこと）
unzip -l "${SNAP}.zip"
```

再納品時は日付を変えて別スナップショットとして作る（旧 zip を上書きしない）。

## 6. 展開テスト

```bash
TMP=$(mktemp -d)
unzip -q "${SNAP}.zip" -d "$TMP"
( cd "$TMP/$SNAP" && python3 -m http.server 8001 )
# → http://localhost:8001 で表示・リンク・console を確認
```

サブディレクトリ配置の再現テストをする場合は、`$TMP` 直下ではなく `"$TMP/special/{{PROJECT_SLUG}}"` に展開してから `$TMP` でサーバーを立て、`/special/{{PROJECT_SLUG}}/` を開く。

## 7. 引き渡し時に添える情報

- 配置先の想定パス（例: `https://example.com/special/{{PROJECT_SLUG}}/` 直下に zip の中身を展開）
- 前回納品からの差分概要（再納品時）
- OGP 画像・favicon 等、別途サーバー設定が要るものの有無
