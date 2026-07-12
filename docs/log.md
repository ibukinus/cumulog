# 更新履歴

## 2026-07-12

* **Update**: 公開共有ページのOGP（リンクカード）付与を[10-open-issues.md](10-open-issues.md)の将来機能に追加。
* **Update**: 公開共有ページ（Should）を機能要件に追加。Bluesky共有投稿に活動ログへの導線が無く共有の価値が不足していたため、共有URLを受け取った人が未認証で単一の活動ログを閲覧できるページを定義（[05-functional/share-page.md](05-functional/share-page.md)を新設、[05-functional/index.md](05-functional/index.md)・[04-scope-and-priority.md](04-scope-and-priority.md)のShouldに追加）。あわせて閲覧範囲の例外を[03-publication-policy.md](03-publication-policy.md)に明記し、Mustの「自分の活動ログのみを表示・操作対象にする」とWon'tの「他ユーザーの公開ログ閲覧」を単一ログ閲覧を除く形に修正。[05-functional/bluesky-share.md](05-functional/bluesky-share.md)に投稿文面へ公開共有ページURLを含められる要件を追加。

## 2026-07-11

* **Update**: [08-success-criteria.md](08-success-criteria.md) の同期漏れを修正。Mustリストにあるが成功条件に反映されていなかった項目（アカウント利用開始、ログイン状態確認、ログアウト、URL形式エラーの保存前確認、認証失効・権限不足の表示）を「MVPとしての成立」に追加。
* **Update**: 要件定義レビューに基づく不足の補完と同期漏れの修正。(1) 利用終了時の扱い（派生データは削除対象とする方針、専用の退会・連携解除機能はMVP対象外）を[03-publication-policy.md](03-publication-policy.md)に新設し、Won'tと[10-open-issues.md](10-open-issues.md)に反映。(2) 利用規約・プライバシーポリシーの利用開始前確認をMustとして[04-scope-and-priority.md](04-scope-and-priority.md)・[05-functional/onboarding.md](05-functional/onboarding.md)・[08-success-criteria.md](08-success-criteria.md)に追加（文面は基本設計以降）。(3) UI表示言語を日本語のみ、可用性をベストエフォートとして[06-non-functional.md](06-non-functional.md)に明記。(4) 同期漏れ修正：ログイン状態確認・ログアウト・URL形式エラー・詳細取得失敗をMustリストと成功条件に追加。(5) [onboarding.md](05-functional/onboarding.md)・[input-policy.md](05-functional/input-policy.md)・[emotion-tag.md](05-functional/emotion-tag.md)・[monthly-review.md](05-functional/monthly-review.md)に受け入れ基準を追記。(6) [07-user-scenarios.md](07-user-scenarios.md)に初回利用シナリオを追加。(7) 他クライアント由来レコードの扱いを[10-open-issues.md](10-open-issues.md)に追加。
* **Update**: 単一ファイルの要件定義書（`要件定義書.md`）をOKF準拠のドキュメントバンドルに再構成。スコープ（旧§9）と優先度（旧§12）を[04-scope-and-priority.md](04-scope-and-priority.md)に統合、公開範囲・共有方針（旧§8）とデータ管理・プライバシー方針（旧§16）を[03-publication-policy.md](03-publication-policy.md)に統合、受け入れ基準（旧§18）を各機能要件ファイルに併記。旧版は`archive/`に保存。
* **Creation**: OKFバンドルとして `docs/` を作成。

## 2026-07-11以前

* **Creation**: 要件定義書 初版（`要件定義書.md`）。
