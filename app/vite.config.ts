import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const designPreviewMock = (name: string) =>
  fileURLToPath(new URL(`./src/design-preview/${name}.ts`, import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // design-previewモード（npm run dev:design）では、認証・PDS通信をfixtureベースの
  // モックに差し替え、全画面をログイン不要で表示確認できるようにする
  resolve: mode === 'design-preview'
    ? {
        alias: [
          { find: /^\.\.\/atproto\/oauth$/, replacement: designPreviewMock('oauth') },
          { find: /^\.\.\/atproto\/records$/, replacement: designPreviewMock('records') },
          { find: /^\.\.\/atproto\/public$/, replacement: designPreviewMock('public') },
        ],
      }
    : undefined,
  // AT ProtocolのループバックOAuthはリダイレクト先が127.0.0.1固定（RFC 8252）のため、
  // 開発サーバーも127.0.0.1にバインドしてストレージのオリジンと一致させる
  // （localhostで開くとコールバック後にオリジンが食い違いログインが壊れる）
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
}))
