# 更新履歴

## 2026-07-12

* **Update**: Bluesky共有（Should）の実装着手に伴い詳細設計を追加。(1) 共有スコープ `repo:app.bsky.feed.post?action=create` を要求スコープに追加し、スコープ追加前の旧セッションは権限不足として再ログインを案内する方針を明記（[03-auth.md](03-auth.md)）。(2) D2 Bluesky共有ダイアログを新設し、共有導線はMVPでは詳細画面のみとする配置を定義（[04-screens.md](04-screens.md)）。(3) 既定文面（タイトル・活動日・外部URL先頭1件。メモ・タグはネタバレ配慮で含めない）、300書記素上限、URLのlink facet付与、レコード構成を定義（[05-data-flow.md](05-data-flow.md)）。(4) エラー分類にBluesky共有失敗を追加（[06-error-handling.md](06-error-handling.md)）。
* **Update**: 認可取り消しの案内先を具体化。実際の取り消しUIはbsky.appのアプリ設定ではなくPDSのアカウント管理画面（`bsky.social/account`）にあることを実機確認・一次情報で確認し、案内文言の記述を修正（[03-auth.md](03-auth.md)）。

## 2026-07-11

* **Update**: アクセス解析としてCloudflare Web Analytics（Cookie不使用）の利用を決定。CSPの「スクリプトは自ホスト限定」を「自ホスト＋アクセス解析のみ」に改訂し、解析内容をプライバシーポリシーに明記する方針を追加（[07-security.md](07-security.md)）。

* **Update**: 実装をこのリポジトリ内（`app/`＝SPA本体、`lexicons/`＝Lexiconスキーマ定義JSON）で管理する方針に変更。「実装リポジトリで管理する」としていた記述を更新（[02-lexicon.md](02-lexicon.md)・[09-design-language.md](09-design-language.md)）。あわせてAGENTS.mdのリポジトリの性質・コミット規約・実装と設計の同期ルールを改訂。

* **Update**: [09-design-language.md](09-design-language.md) を追加。UIデザインの原則（温かみ・親しみやすいトーン、セマンティックトークンによるカラー設計、状態表現の原則、タイポグラフィ・レイアウト、既存ライブラリ＋トークン上書きのコンポーネント方針）を定義。ダークモードはMVP対象外とし、トークン差し替えで将来対応できる構造とする。具体的なトークン値は実装リポジトリで管理する。

* **Update**: PR #1 のCodexレビュー指摘（6巡目）に対応。必須項目の値が形式不正なレコード（実在しない日付等）も「読み込めない活動ログ」として扱うことを明記（[02-lexicon.md](02-lexicon.md)）。
* **Update**: PR #1 のCodexレビュー指摘（5巡目）に対応。(1) タイトルのトリムと非空検証を明記（[02-lexicon.md](02-lexicon.md)）。(2) Bluesky共有時の追加スコープを作成のみの `repo:app.bsky.feed.post?action=create` に限定（[03-auth.md](03-auth.md)）。
* **Update**: PR #1 のCodexレビュー指摘（4巡目）に対応。権限スコープを `atproto` + `repo:jp.mp0.cumulog.log` のgranularスコープとして確定し、`transition:generic` は要求しないことを明記（[03-auth.md](03-auth.md)）。
* **Update**: PR #1 のCodexレビュー指摘（3巡目）に対応。(1) レコード必須フィールド `$type`（固定値 `jp.mp0.cumulog.log`）を明記（[02-lexicon.md](02-lexicon.md)）。(2) Bluesky公式PDS判定を `.host.bsky.network` のサフィックス一致に修正（複数ラベルのシャードホストに対応）（[03-auth.md](03-auth.md)）。
* **Update**: PR #1 のCodexレビュー指摘（2巡目）に対応。「読み込めない活動ログ」はタイトル・活動日を持たない可能性があるため、一覧・削除確認での識別子としてrkeyを含むat-uriを表示する定義を追加（[02-lexicon.md](02-lexicon.md)・[04-screens.md](04-screens.md)）。
* **Update**: PR #1 のCodexレビュー指摘に対応。(1) `maxLength` を書記素上限の4倍から10倍に引き上げ（絵文字等の多バイト書記素クラスタでUI上限内の入力がPDSに拒否されるのを防ぐ。Bluesky公式Lexiconと同じ比率）（[02-lexicon.md](02-lexicon.md)）。(2) 削除も編集と同様に `swapRecord` によるCAS方式とし、競合時は削除を実行せず確認からやり直す設計に変更（[05-data-flow.md](05-data-flow.md)・[06-error-handling.md](06-error-handling.md)）。

* **Creation**: 基本設計書 初版。全体構成（バックエンドを持たないクライアントサイドSPA）、Lexicon・データ設計（`jp.mp0.cumulog.log`）、認証・連携設計（AT Protocol OAuth）、画面設計、データフロー設計、エラー処理設計、セキュリティ設計、テスト方針を定義。
