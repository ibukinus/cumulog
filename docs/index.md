# Cumulog 要件定義書

Cumulogは、趣味・鑑賞・イベント参加・創作などの活動を短いログとして残し、あとから振り返るための活動ログサービスである。noteやブログのような長文投稿サービスではなく、外部サービス上の記録を含めて、自分の活動を整理するための索引・年表として機能する。活動ログは原則としてAT Protocol上の公開データとして保存される。

MVPでは、Bluesky公式PDSを利用するAT Protocolアカウントを主な対象とし、AT Protocol上のCumulog独自レコードとして活動ログを作成・一覧表示・詳細表示・編集・削除できることを中核機能とする。あわせて、タグによる整理、単一タグによる絞り込み、複数の外部URL登録、日付降順の年表表示、未来日の活動ログ登録、ネタバレ有無の設定、公開前確認、削除前注意表示、エラー時の適切な状態表示をMVPに含める。

Blueskyへの投稿は活動ログの保存とは別の任意共有機能（Should）であり、初期リリースで未実装でもMVP成立条件には影響しない。未来日の活動ログは登録できるが、Cumulogは予定管理サービスではない。個人開発で実現可能な範囲に絞って提供する。

## 読み順

1. [プロダクト概要](01-overview.md) — プロダクト名・コンセプト・背景・目的・立ち位置
2. [想定ユーザーと提供価値](02-users-and-value.md) — ユーザー像・解決したい課題・提供価値
3. [公開・データ方針](03-publication-policy.md) — 公開範囲・共有方針・データの正本・プライバシー
4. [スコープと優先度](04-scope-and-priority.md) — MoSCoWによるMVPの範囲定義
5. [機能要件](05-functional/index.md) — 機能ごとの要件と受け入れ基準
6. [非機能要件](06-non-functional.md) — 運用性・セキュリティ・パフォーマンス等
7. [主要ユーザーシナリオ](07-user-scenarios.md) — 代表的な利用の流れ
8. [成功条件](08-success-criteria.md) — MVPの成功をどう判定するか
9. [制約](09-constraints.md) — 開発・プロダクト・利用上の制約
10. [今後の検討事項](10-open-issues.md) — 基本設計以降に持ち越す論点

## ドキュメント一覧

| ドキュメント | 内容 |
| --- | --- |
| [01-overview.md](01-overview.md) | プロダクト概要・背景・目的・プロダクトの立ち位置 |
| [02-users-and-value.md](02-users-and-value.md) | 想定ユーザー・解決したい課題・提供価値 |
| [03-publication-policy.md](03-publication-policy.md) | 公開範囲・共有方針・データ管理・プライバシー方針 |
| [04-scope-and-priority.md](04-scope-and-priority.md) | MVPスコープと優先度（Must / Should / Could / Won't） |
| [05-functional/](05-functional/index.md) | 機能要件（1機能1ファイル、各ファイルに受け入れ基準を併記） |
| [06-non-functional.md](06-non-functional.md) | 非機能要件 |
| [07-user-scenarios.md](07-user-scenarios.md) | 主要ユーザーシナリオ |
| [08-success-criteria.md](08-success-criteria.md) | 成功条件 |
| [09-constraints.md](09-constraints.md) | 制約 |
| [10-open-issues.md](10-open-issues.md) | 今後の検討事項（基本設計以降で定義する事項） |
| [log.md](log.md) | このバンドルの更新履歴 |

## このバンドルについて

- [OKF (Open Knowledge Format) v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) に準拠する。`index.md` と `log.md` は予約ファイルであり、それ以外の各`.md`はfrontmatter（`type` 必須）を持つ。
- 要件の変更時は該当ファイルを更新し、[log.md](log.md) に日付つきで記録する。
- 各機能要件ファイルには対応する受け入れ基準を併記し、要件と検証のトレーサビリティを保つ。
