---
type: Design Document
title: 全体構成
description: Cumulog MVPのシステム構成。バックエンドを持たないクライアントサイドSPAとし、活動ログはユーザーのPDSに直接読み書きする。
tags: [cumulog, 基本設計, アーキテクチャ, atproto]
timestamp: 2026-07-11
---

# 全体構成

## 構成方針

MVPのCumulogは、独自のバックエンドサーバーとデータベースを持たない、クライアントサイドのシングルページアプリケーション（SPA）とする。

活動ログの読み書きは、ブラウザからユーザーのPDSに対してXRPC（`com.atproto.repo.*`）で直接行う。

この構成を選ぶ理由は以下のとおり。

* MVPのCumulog画面は自分の活動ログのみを表示・操作対象とするため、他ユーザーのレコードを集約するAppView・インデクサが不要である
* 活動ログの正本はユーザーのAT Protocolリポジトリ上のレコードであり、Cumulog側に保存すべきデータが存在しない
* サーバー・DBを持たないことで、個人開発での運用負荷（[非機能要件: 運用性](../docs/06-non-functional.md)）を最小化できる

```
[ブラウザ: Cumulog SPA] --(OAuth / XRPC)--> [ユーザーのPDS (Bluesky公式PDS)]
        |
        +-- 静的ホスティング (cumulog.mp0.jp) から配信
```

## サーバーサイド構成

* Cumulogは静的ファイル（HTML / JS / CSS / OAuthクライアントメタデータ）のみを配信する
* 静的ホスティングサービス（Cloudflare Pages相当）を利用し、`cumulog.mp0.jp` で公開する
* 独自のAPIサーバーは持たない。APIは PDS が提供するXRPCをそのまま利用する（API設計を参照 → [データフロー設計](05-data-flow.md)）
* DB設計は不要とする（サーバー側データストアを持たないため）

## データの保存場所

| データ | 保存場所 | 位置づけ |
| --- | --- | --- |
| 活動ログレコード | ユーザーのPDS（AT Protocolリポジトリ） | 正本 |
| 一覧表示用の取得済みレコード | ブラウザのメモリ内（アプリ状態） | 派生データ。永続化しない |
| OAuthセッション情報 | ブラウザのローカルストレージ領域 | ログアウトで削除（[認証・連携設計](03-auth.md)） |

* Cumulog側に永続的なキャッシュ・インデックス・表示補助データを持たない
* これにより、[公開・データ方針](../docs/03-publication-policy.md)の「利用終了時に派生データを削除対象とする」は、ブラウザ上のセッション・ローカルデータの削除のみで満たせる

## 技術スタック

* 言語：TypeScript
* UI：React + Vite によるSPA（スマートフォンブラウザ優先のレスポンシブデザイン）
* AT Protocol連携：`@atproto/api`（XRPCクライアント）、`@atproto/oauth-client-browser`（OAuth）
* ホスティング：静的ホスティングサービス（`cumulog.mp0.jp`）
* UIの表示言語は日本語のみとする（[非機能要件: 対応環境](../docs/06-non-functional.md)）

ライブラリの選定は同等の代替（Svelte等）を妨げないが、以降の設計はReact + Viteを前提に記述する。

## 対応環境

* スマートフォンブラウザ（iOS Safari / Android Chrome の現行版）を主対象とする
* PCブラウザ（Chrome / Firefox / Safari / Edge の現行版）でも基本操作ができる
* ネイティブアプリは対象外とする

## 拡張余地

* 将来、他ユーザーの公開ログ閲覧・カスタムフィード・月次年次集計を提供する場合は、Relay / Jetstream からレコードを収集するAppViewを別途追加する
* 本設計のSPAはその場合もクライアントとして継続利用でき、正本がPDS上にあるため移行時のデータ移設は不要である

## 関連ドキュメント

* [認証・連携設計](03-auth.md)
* [データフロー設計](05-data-flow.md)
* [要件: 制約](../docs/09-constraints.md) — 個人開発規模・ドメイン
