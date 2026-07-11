# Cumulog

Cumulog（キュムログ）のSPAクライアント。設計は [design/](../design/index.md) を参照。

## 開発コマンド

```sh
npm run dev    # 開発サーバーを起動する
npm run build  # 型チェックと本番ビルドを行う
npm test       # vitestでテストを実行する
npm run lint   # oxlintで静的解析を行う
```

開発サーバーは必ず **http://127.0.0.1:5173/** で開くこと（`localhost` は不可）。

AT ProtocolのループバックOAuthはリダイレクト先が `127.0.0.1` 固定のため、`localhost` で開くとコールバック後にオリジンが食い違い、ログインできない。開発サーバーはこの理由で `127.0.0.1` にバインドしている（vite.config.ts）。
