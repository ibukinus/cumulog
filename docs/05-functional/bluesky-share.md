---
type: Functional Requirement
title: Bluesky共有
description: 活動ログをもとにしたBlueskyへの共有投稿に関する要件。活動ログ保存とは別の共有操作として扱う。
tags: [cumulog, 機能要件, bluesky, 共有, should]
timestamp: 2026-07-12
---

# Bluesky共有

ユーザーは、活動ログをもとにBlueskyへ投稿できる。

## 優先度

Should

Bluesky共有投稿はShouldとする。ただし、初期リリースでは実装しない場合でも、CumulogのMVP成立条件には影響しない。

## 要件

* 活動ログ作成時または作成後にBlueskyへ共有するか選べる
* 活動ログの内容をもとにBluesky投稿を作成できる
* 投稿の文面に、該当の活動ログを未認証で閲覧できる[公開共有ページ](share-page.md)のURLを含められる
* 共有しない選択もできる
* Bluesky投稿前に投稿内容を確認できる
* Blueskyへの投稿は、活動ログの保存とは別の共有操作として扱う
* Blueskyへの共有に失敗した場合、活動ログ保存の成否と区別して表示する

## 受け入れ基準

* Bluesky共有投稿を実装する場合、活動ログ保存とは別の操作として扱われる
* Bluesky投稿前に投稿内容を確認できる
* Bluesky共有に失敗した場合、活動ログ保存の成否と区別して失敗が表示される
* Bluesky共有投稿が初期リリースで未実装でも、CumulogのMVP成立条件には影響しない

## 関連ドキュメント

* [公開・データ方針](../03-publication-policy.md) — 活動ログ保存とBluesky投稿の関係
* [今後の検討事項](../10-open-issues.md) — Bluesky共有投稿の具体的な文面
