---
type: Design Document
title: 認証・連携設計
description: AT Protocol OAuthによる認証、権限スコープ、対応PDS判定、セッション管理、連携解除・利用終了時の扱いを定義する。
tags: [cumulog, 基本設計, 認証, oauth, atproto]
timestamp: 2026-07-11
---

# 認証・連携設計

## 認証方式

* AT Protocol OAuth を用いる。アプリパスワードによるログインは採用しない
* Cumulog SPAはパブリッククライアントとし、`@atproto/oauth-client-browser` を利用する
* クライアントメタデータ（`client-metadata.json`）は `cumulog.mp0.jp` 上に静的ファイルとして配置し、そのURLを `client_id` とする
* ログインフローは、handle入力 → 認可サーバーへのリダイレクト → コールバックでのセッション確立、とする

## 権限スコープ

* 要求するスコープは、活動ログの作成・閲覧・編集・削除に必要な範囲に限定する（[アカウント連携](../docs/05-functional/account.md)）
* MVPで要求するスコープは `atproto` と `repo:jp.mp0.cumulog.log`（コレクション単位のgranularスコープ）とする
* リポジトリ全体への広範なアクセスを許す `transition:generic` は要求しない（不要な権限を要求しない要件に反するため）
* MVPの対象であるBluesky公式PDSはgranularスコープに対応している。将来の任意PDS対応でgranularスコープ未対応のPDSを扱う場合の方針は、その時点で設計する（広範スコープへの暗黙のフォールバックはしない）
* Bluesky共有（Should）を実装する時点で、`repo:app.bsky.feed.post` を追加要求する。それまでは要求しない

## 対応PDS判定

MVPはBluesky公式PDSを利用するアカウントのみを対象とする。

* ログイン時にhandleからDIDを解決し、DIDドキュメントの `#atproto_pds` サービスエンドポイントを取得する
* エンドポイントのホストが `bsky.social` に一致する、または `.host.bsky.network` で終わる（サフィックス一致）場合を「Bluesky公式PDS」と判定する
* サフィックス一致とするのは、Bluesky公式PDSのホストが `morel.us-east.host.bsky.network` のような複数ラベルを持つためである（1ラベルのみのワイルドカード一致では公式PDSを弾いてしまう）
* 判定に該当しない場合は、認可フローに進まず「MVPではBluesky公式PDSのアカウントのみ利用できる」旨と対象外である理由を表示する
* 判定用のホストパターンは設定値として保持し、Bluesky側のインフラ変更に追従できるようにする

## セッション管理

* OAuthセッション（トークン類）は `@atproto/oauth-client-browser` の管理に委ね、ブラウザのローカルストレージ領域に保持する
* ログイン状態は画面上で常に確認できる（ログイン中のhandleを表示する）
* 内部の所有者識別・レコード操作はDIDで行い、handleは表示にのみ用いる（[公開・データ方針](../docs/03-publication-policy.md)）
* トークンの更新はライブラリの自動リフレッシュに委ねる
* リフレッシュ不能（認証失効）となった場合は、認証が切れた旨を表示し、再ログインへ誘導する。このとき編集中の入力内容は可能な限り画面上に保持する

## ログアウト・連携解除・利用終了

* ログアウト時は、ブラウザ上のOAuthセッション情報とアプリ状態を削除する
* Cumulogはサーバー側にユーザーデータを保持しないため、利用終了時にCumulog側で削除すべき派生データはブラウザ上のデータのみである
* PDS側に残る認可の取り消しは、ユーザーがPDS（Blueskyの設定画面）側で行えることを設定画面で案内する
* 活動ログレコード自体はログアウト・連携解除では削除されず、ユーザーのリポジトリに残ることを案内する（[公開・データ方針: 利用終了時の扱い](../docs/03-publication-policy.md)）

## 関連ドキュメント

* [要件: アカウント連携](../docs/05-functional/account.md)
* [全体構成](01-architecture.md)
* [エラー処理設計](06-error-handling.md) — 認証失効・権限不足の表示
