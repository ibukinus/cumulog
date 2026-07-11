---
type: Design Document
title: Lexicon・データ設計
description: 活動ログレコード（jp.mp0.cumulog.log）のLexicon設計。項目の型、文字数上限、件数上限、バリデーション条件を定義する。
tags: [cumulog, 基本設計, lexicon, データ設計, atproto]
timestamp: 2026-07-11
---

# Lexicon・データ設計

## NSID

* 活動ログレコードのNSIDは `jp.mp0.cumulog.log` とする（[制約](../docs/09-constraints.md)のとおり `jp.mp0.cumulog.*` 配下）
* record key は TID とする

## レコード項目

要件定義の[入力項目](../docs/05-functional/log-create.md)に対応するレコード項目を以下とする。

| 項目 | プロパティ | 型 | 必須 | 上限 |
| --- | --- | --- | --- | --- |
| タイトル | `title` | string | 必須 | 100書記素（maxLength 400） |
| 活動日 | `activityDate` | string（`YYYY-MM-DD`） | 必須 | 10文字 |
| 活動種別 | `category` | string | 任意 | 30書記素（maxLength 120） |
| 対象名 | `subject` | string | 任意 | 100書記素（maxLength 400） |
| タグ | `tags` | string の array | 任意 | 20件、各30書記素（maxLength 120） |
| 外部URL | `urls` | string（format: `uri`）の array | 任意 | 10件、各2000文字 |
| メモ | `note` | string | 任意 | 1000書記素（maxLength 4000） |
| ネタバレ | `spoiler` | string（knownValues: `none` / `minor` / `major`） | 必須 | — |
| 作成日時 | `createdAt` | string（format: `datetime`） | 必須 | — |

* 文字数上限はLexiconの `maxGraphemes` で表現し、あわせてバイト長上限 `maxLength` を書記素上限の4倍で設定する
* 上限値は「短いログ」というプロダクトの位置づけ（[入力項目の考え方](../docs/05-functional/input-policy.md)）にもとづく設計値であり、実利用の知見により将来変更してよい

## 項目ごとの補足

### activityDate（活動日）

* Lexiconの標準formatに日付のみの形式がないため、string に対して `YYYY-MM-DD` 形式をアプリケーション側で検証する
* 実在する日付であることを検証する（例：`2026-02-30` は不可）
* 未来日を許可する
* 将来日時対応へ拡張する場合は、別プロパティの追加として設計する（`activityDate` の意味は変えない）

### spoiler（ネタバレ）

* `none`（ネタバレなし）、`minor`（軽微なネタバレ）、`major`（重大なネタバレ）の3値とする
* UI上未選択の場合、クライアントが `none` を設定して保存する。レコード上は常に値を持つ
* Lexicon上は `knownValues` とし、未知の値を持つレコードは表示時に「ネタバレを含む可能性がある」側に倒して扱う

### tags（タグ）

* 空文字列・空白のみのタグは登録できない（保存前に除去または入力エラーとする）
* 前後の空白はトリムして保存する
* 同一レコード内の重複タグは登録できない。重複判定は文字列の完全一致（トリム後）で行う
* 表記ゆれ統合・正規化（大文字小文字、全角半角）はMVPでは行わない

### urls（外部URL）

* スキームが `http` または `https` のURLのみ登録できる
* URLとして構文解析できない文字列、対象外スキームは、保存前に入力エラーとして表示する
* URL先への到達性・内容の検証は行わない

### createdAt（作成日時）

* レコード作成時のクライアント時刻をISO 8601（UTC）で記録する
* 同一活動日内の並び順（作成日時降順）の基準に用いる
* 編集時は `createdAt` を変更しない

## バリデーションの実施箇所

* 上記の必須・形式・上限・重複の検証は、保存前（公開前確認の表示前）にクライアントで行う
* 入力エラーは該当項目と理由を表示する（[エラー処理設計](06-error-handling.md)）
* Lexiconスキーマ定義ファイル（JSON）は実装リポジトリで管理し、本設計と同期させる

## スキーマ不適合レコードの扱い

Cumulog以外のクライアントが `jp.mp0.cumulog.log` コレクションに作成・変更したレコードは、本スキーマを満たさない可能性がある。

* 必須項目（`title` / `activityDate` / `spoiler` / `createdAt`）が欠落・型不一致のレコードは、内容の解釈を試みず、一覧上「読み込めない活動ログ」として表示する
* 「読み込めない活動ログ」は詳細表示・編集の対象外とし、削除のみ可能とする
* 任意項目の上限超過は表示を妨げない（表示は行い、編集して保存する時点で現行の上限を適用する）

## 関連ドキュメント

* [要件: 活動ログ作成](../docs/05-functional/log-create.md) — 入力項目・入力制約の方針
* [データフロー設計](05-data-flow.md) — レコードのCRUD
