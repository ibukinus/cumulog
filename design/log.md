# 更新履歴

## 2026-07-14

* **Update**: 感情タグを自由入力からプリセット選択式に変更。自由入力では表記ゆれが生じ、将来の感情サマリー等での集計が成立しないというユーザーフィードバックに基づく。値は `spoiler` と同様に英語トークン（12値の `knownValues`）で保存し、UI上は日本語ラベルで表示する。S5/S6の入力はプリセットからのタップ選択式とし、既存ログからの候補表示は廃止。プリセット外の値（他クライアント由来等）は表示・絞り込みでは値の文字列をそのまま扱い、編集時は選択解除のみ可能とする（[02-lexicon.md](02-lexicon.md)・[04-screens.md](04-screens.md)・[05-data-flow.md](05-data-flow.md)）。

## 2026-07-13

* **Update**: 感情タグ（Should・[要件](../docs/05-functional/emotion-tag.md)）の実装着手に伴い詳細設計を追加。(1) レコード項目に `emotions`（string の array、任意、5件、各30書記素）を追加。固定の感情マスタは持たず、トリム・空文字禁止・重複禁止は `tags` と同じルールとし、通常のタグとは別プロパティとして表示・絞り込みでも区別する（[02-lexicon.md](02-lexicon.md)）。(2) S3 一覧の行表示・タップ絞り込み、S4 詳細・S8 公開共有ページの表示項目、S5/S6 の入力欄（既存ログの値を候補表示）に感情タグを追加。絞り込み条件は同時に1つの枠組みに感情タグを追加（[04-screens.md](04-screens.md)）。(3) 感情タグ絞り込みを完全一致のクライアント側フィルタとして定義（[05-data-flow.md](05-data-flow.md)）。(4) あわせて [index.md](index.md) の「初期リリース対象外の機能」の例示を更新し、詳細設計済みの機能（Bluesky共有・公開共有ページ・感情タグ）と未着手の機能を区別した。

## 2026-07-12

* **Update**: 年月による絞り込み（Should・[要件](../docs/05-functional/monthly-review.md)）の実装着手に伴い、S3 活動ログ一覧の設計を具体化。行内の活動日をタップすると、その活動日が属する年月（`YYYY-MM`）で絞り込む方式とし、判定は活動日の年月部分の一致によるクライアント側フィルタとする（[04-screens.md](04-screens.md)・[05-data-flow.md](05-data-flow.md)）。絞り込み条件は同時に1つの枠組みに年月を追加。
* **Update**: 活動種別・対象名による絞り込み（Should・[要件](../docs/05-functional/category-and-target.md)）の実装着手に伴い、S3 活動ログ一覧の設計を具体化。タグと同様に行内の活動種別・対象名をタップして値の完全一致で絞り込む方式とし、絞り込み条件は同時に1つ（タグ・活動種別・対象名のいずれか）、別の条件の選択で置き換え、0件時は解除を促す空状態を表示することを定義（[04-screens.md](04-screens.md)）。
* **Update**: カラーの原則に青系の用途規律を追加。BlueskyやAT Protocolの青を基調色として取り入れるかを検討し、独立サービスとしての識別を保つため基調は温色のまま、青は「時間表示（活動日）の空色」「Blueskyへ向かう操作の専用色」「AT Protocol上の公開データ表示」の3用途に限定する方針とした。あわせてトーンに「夕方の空に浮かぶ雲」（Cumulog＝cumulus由来）の淡い空色を脇役として用いることを追記（[09-design-language.md](09-design-language.md)）。
* **Update**: S4 活動ログ詳細・S8 公開共有ページの表示方針を変更。項目名と値の列挙（定義リスト）では業務アプリ的でコンテンツが主役にならないというユーザーフィードバックに基づき、1件の記録として読める構成（見出し部＝活動日・活動種別・タイトル・対象名、本文＝メモ、続く要素＝タグ・外部URL）に変更。値が未設定の任意項目は表示しないことを明記（[04-screens.md](04-screens.md)）。
* **Update**: Bluesky共有の既定文面から外部URLを除外。公開共有ページのURLと外部URLが併記されると分かりにくいというユーザーフィードバックに基づき、既定文面はタイトル・活動日・公開共有ページのURLのみとする（[05-data-flow.md](05-data-flow.md)）。外部URLは公開共有ページ上で参照できる。
* **Update**: 公開共有ページ（Should・[要件](../docs/05-functional/share-page.md)）の設計を追加。S8として `/share/{did}/{rkey}` の未認証閲覧ページを定義し（[04-screens.md](04-screens.md)）、DID解決＋未認証getRecordによる取得フロー・閲覧時は対応PDS判定を行わない方針を定義（[05-data-flow.md](05-data-flow.md)）。Bluesky共有の既定文面に公開共有ページURLを追加。エラー分類に公開共有ページの取得失敗を追加（[06-error-handling.md](06-error-handling.md)）。
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
