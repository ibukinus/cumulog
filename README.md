# Cumulog（キュムログ）

趣味・鑑賞・イベント参加・創作などの個人的な活動を短いログとして記録し、あとから振り返れるようにする活動ログサービス。活動ログは原則としてAT Protocol上の公開データとして保存される。

このリポジトリは、Cumulogの**要件定義**を管理するリポジトリである。実装コードは含まない。

## ドキュメント構成

要件定義書は [`docs/`](docs/index.md) 配下に、[OKF (Open Knowledge Format)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) 準拠のドキュメントバンドルとして配置している。

- 読み始めるには → [docs/index.md](docs/index.md)
- 更新履歴 → [docs/log.md](docs/log.md)
- 再構成前の旧・単一ファイル版 → [archive/](archive/)

## 表記ルール

- 各ドキュメントはYAML frontmatter（`type` 必須）を持つMarkdownファイルとする
- 優先度はMoSCoW（Must / Should / Could / Won't）で表記する。定義は [docs/04-scope-and-priority.md](docs/04-scope-and-priority.md) を参照
- 「MVP」はMustをすべて満たした状態を指す
