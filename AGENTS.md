# AGENTS.md

このリポジトリで作業するAIエージェント向けのガイド。

## リポジトリの性質

- Cumulog（キュムログ）というAT Protocol上の活動ログサービスの**要件定義・基本設計・実装**を管理するリポジトリ。
- 要件定義のエントリポイントは [docs/index.md](docs/index.md)、基本設計のエントリポイントは [design/index.md](design/index.md)。
- 実装コードは `app/`（SPA本体）と `lexicons/`（Lexiconスキーマ定義JSON）に置く。
- `archive/` は再構成前の旧版であり、**編集・参照更新の対象にしない**（歴史的資料として保存）。

## ドキュメント構成（OKF準拠）

`docs/`（要件定義）と `design/`（基本設計）は、それぞれ [OKF (Open Knowledge Format) v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) 準拠のドキュメントバンドル。

- `index.md` と `log.md` はOKFの予約ファイル。それ以外の全`.md`はYAML frontmatterを持つ。
- frontmatterは `type`（必須）、`title`、`description`、`tags`、`timestamp`（ISO 8601、`YYYY-MM-DD`）を付ける。
- `docs/` のトップレベルは `01-` 〜 `10-` の章番号つきファイル。`05-functional/` 配下は1機能=1ファイルで連番なし（意味ベースのkebab-case英語名）。
- `design/` は `01-` 〜 `09-` の章番号つきファイル。編集ルール・文体は `docs/` と同様に適用し、変更は [design/log.md](design/log.md) に記録する。
- 要件と設計が矛盾する場合は要件（`docs/`）が正。設計変更で要件の意味が変わる場合は、先に `docs/` 側を更新する。

## 編集ルール

1. **要件を変更したら必ず [docs/log.md](docs/log.md) に日付つきで記録する**（`## YYYY-MM-DD` 見出しの下に `* **Update**: ...` 形式）。あわせて該当ファイルのfrontmatterの `timestamp` を更新する。
2. **優先度はMoSCoW**（Must / Should / Could / Won't）で表記する。定義と一元的なリストは [docs/04-scope-and-priority.md](docs/04-scope-and-priority.md)。個別機能ファイルの優先度と矛盾させないこと。
3. **機能要件を追加・変更するとき**は、`docs/05-functional/` にファイルを追加・編集し、`05-functional/index.md` の一覧表、`04-scope-and-priority.md` のMoSCoWリストの両方を同期させる。受け入れ基準は機能ファイル内の「受け入れ基準」節に併記する。
4. **ファイル名の連番は識別子であり、リナンバリングしない**。トップレベルに章を足すときは末尾番号（`11-` 以降）で追加し、読み順の調整は `docs/index.md` の「読み順」リスト側で行う。
5. **ドキュメント間は相対リンク**で参照する。ファイルの追加・リネーム・削除をしたら、リンク切れがないか全`.md`の相対リンクを検査すること。
6. 重複する記述を新設しない。公開範囲・データ正本・ユーザー識別などの方針は [docs/03-publication-policy.md](docs/03-publication-policy.md) が正であり、他ファイルからはリンクで参照する。

## コミット規約

[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) に従い、`type: 説明` 形式でコミットメッセージを書く（説明は日本語）。

ドキュメント（`docs/` / `design/`）の変更は、ドキュメント＝プロダクトとみなし、変更の性質でtypeを使い分ける。

- `feat:` — 要件・機能・章の追加、スコープの拡大
- `fix:` — 要件の誤り・矛盾・同期漏れの修正
- `refactor:` — 要件の意味を変えない構成整理・再編
- `docs:` — 表現の改善、リンク修正、体裁の調整など、要件の意味に影響しない変更
- `chore:` — 上記に該当しない雑務（設定ファイル、`log.md` のみの修正など）

要件の意味が変わる変更（feat / fix）と変わらない変更（refactor / docs / chore）の区別を優先する。

実装コード（`app/` / `lexicons/`）の変更は、一般的なConventional Commitsの意味でtypeを使う（`feat:` 機能追加、`fix:` バグ修正、`refactor:`、`test:`、`chore:` 等）。

必要に応じてスコープを付けてよい（例：`feat(functional): ...`、`feat(app): ...`、`fix(lexicons): ...`）。ドキュメントと実装の両方に及ぶ変更は、変更の主目的でtypeを決める。

## 文体・言語

- ドキュメント本文は日本語。技術用語（AT Protocol、PDS、DID、handle、Lexicon等）と固有名詞は原語のまま。
- 既存ファイルの文体に合わせる：常体（「〜である」「〜とする」）、要件は箇条書き、1文1行で空行区切り。
- 「MVPでは〜」「基本設計以降で定義する」など、スコープの限定表現を既存の言い回しに揃える。

## 実装時のルール

`app/` / `lexicons/` で実装作業を行う場合、以下を守ること。

- **互換性維持を目的としたフォールバックを禁止する。** 旧形式のデータ・API・設定を暗黙に受け入れて動かし続けるような後方互換コード（例：旧フィールド名へのフォールバック読み込み、レガシー形式の自動変換、非推奨パスの温存）を、エージェントの判断で設計・実装してはならない。
- どうしても必要な場合は、**必ずユーザーに許可を求め、承認を得てから**設計・実装を行うこと。その際は、なぜフォールバックが必要か、対象範囲、撤去条件をあわせて提示する。

## 実装と設計の同期

- 実装（`app/` / `lexicons/`）は [design/](design/index.md) の設計に従う。実装と設計が食い違う場合は設計が正であり、コードを設計に合わせる。
- 実装の都合で設計の変更が必要になった場合は、先に `design/` を更新（[design/log.md](design/log.md) に記録）してから実装する。要件の意味が変わる場合は、さらに先に `docs/` を更新する。
- Lexiconスキーマ定義JSON（`lexicons/`）は [design/02-lexicon.md](design/02-lexicon.md) と同期させる。
- 基本設計の論点は [design/](design/index.md) で扱う。詳細な実装判断（ライブラリのバージョン、細かなUI文言など）は実装側に委ね、ドキュメント化を要しない。
