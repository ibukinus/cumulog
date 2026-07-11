import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // AT ProtocolのループバックOAuthはリダイレクト先が127.0.0.1固定（RFC 8252）のため、
  // 開発サーバーも127.0.0.1にバインドしてストレージのオリジンと一致させる
  // （localhostで開くとコールバック後にオリジンが食い違いログインが壊れる）
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
})
