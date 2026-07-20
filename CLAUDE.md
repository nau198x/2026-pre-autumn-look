# CLAUDE.md

## プロジェクト概要

JUN の複数ブランド向け LP テンプレート。静的 HTML + Vite + vanilla JavaScript で構築する。
新規案件はこのテンプレートを複製し、最初に `setup-brand` スキルでブランド情報を差し替えてから着手する。

新規案件の立ち上げ手順（複製・ブランド設定・セクション制作・公開前チェック）は `README.md` を参照。

## 技術スタック

- **ビルドツール**: Vite
- **言語**: vanilla JavaScript (ES Modules)
- **スタイリング**: プレーン CSS（BEM 風命名＋ネイティブネスト。デザイントークンは `src/styles/global.css` の `:root`）
- **アニメーション**: GSAP（同梱。`data-animate` のフェードインは `src/scripts/animations.js` に実装済み）
- **カルーセル**: Swiper（同梱しない。カルーセルを使う案件でのみ `npm install swiper`）

## 設計原則

将来 Vue / React 等のコンポーネントベースに移行する可能性を視野に、「1 セクション = 1 コンポーネントへ機械的に写せる」状態を保つ。

1. **1 セクション = 1 ルートクラス = 1 CSS ファイル**（＋固有インタラクションがある場合のみ 1 JS モジュール）
   - 例: `<section class="hero">` ⇔ `src/styles/hero.css` ⇔ `src/scripts/hero.js`
2. CSS はセクションのルートクラス配下に**ネイティブネスト**で書き、疑似スコープを保つ
3. JS はセクションごとに **init 関数を export** し、DOM 参照はセクションルート要素起点にする
4. デザイントークン（色・フォント・余白・イージング）は `global.css` の `:root` に集約する
5. スタイル用セレクタは**クラスのみ**。ID はページ内アンカー用途に限定する

## 開発コマンド

```bash
npm install        # 依存関係インストール
npm run dev        # 開発サーバー起動 (localhost:5173)
npm run build      # プロダクションビルド (dist/)
npm run preview    # ビルド結果のプレビュー
npm run lint       # Stylelint + ESLint
npm run format     # Prettier で全ファイル整形
```

## Skills

- **新規案件の開始時**: `setup-brand` スキルでブランド固有情報（GTM・フォント・ロゴ・フッター・favicon・カラー）を差し替える
- **セクション追加**: `add-section` スキル（`.claude/skills/add-section/SKILL.md`）の手順に従う
- **その他の実装・診断・納品**: 汎用スキル 18 種（プリローダー、ヒーロー / スクロール演出、文字分割、クレジットリスト、セクション、デザイントークン、head 設定、ScrollTrigger ズレ診断、サウンド、納品 等）を `.claude/skills/` に同梱している。依頼内容に合致するスキルがあれば必ず先に該当 SKILL.md を開いてから実装する

## 行動原則

1. **自分で全部やらない** - 専門領域はSubAgentに移譲する
2. **タスクを分解** - 大きなタスクは小さなタスクに分解する
3. **ユーザーと完全に認識を合わせる** - 曖昧なものは全て、AskUserQuestion Toolを細分化してヒヤリング必須

## 注意事項

- `node_modules/` と `dist/` はGit管理対象外にする
- 画像はWebP形式を優先し、適切に圧縮する
- ライブラリの追加は最小限にとどめ、バンドルサイズを意識する
- コンソールに警告・エラーが出ない状態を保つ
- テンプレート状態ではプレースホルダ（`GTM-XXXXXXX`・`example.com`・`BRAND NAME`）が残っている。公開前に setup-brand の検証手順で残存ゼロを確認する
