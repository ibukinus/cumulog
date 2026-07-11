# 更新履歴

## 2026-07-11

* **Update**: PR #1 のCodexレビュー指摘（2巡目）に対応。「読み込めない活動ログ」はタイトル・活動日を持たない可能性があるため、一覧・削除確認での識別子としてrkeyを含むat-uriを表示する定義を追加（[02-lexicon.md](02-lexicon.md)・[04-screens.md](04-screens.md)）。
* **Update**: PR #1 のCodexレビュー指摘に対応。(1) `maxLength` を書記素上限の4倍から10倍に引き上げ（絵文字等の多バイト書記素クラスタでUI上限内の入力がPDSに拒否されるのを防ぐ。Bluesky公式Lexiconと同じ比率）（[02-lexicon.md](02-lexicon.md)）。(2) 削除も編集と同様に `swapRecord` によるCAS方式とし、競合時は削除を実行せず確認からやり直す設計に変更（[05-data-flow.md](05-data-flow.md)・[06-error-handling.md](06-error-handling.md)）。

* **Creation**: 基本設計書 初版。全体構成（バックエンドを持たないクライアントサイドSPA）、Lexicon・データ設計（`jp.mp0.cumulog.log`）、認証・連携設計（AT Protocol OAuth）、画面設計、データフロー設計、エラー処理設計、セキュリティ設計、テスト方針を定義。
