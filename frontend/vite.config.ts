import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: 저장소 이름이 base path가 됨 (https://<user>.github.io/CoursePick/)
// Netlify / 커스텀 도메인 / localhost dev 에선 '/'
const base = process.env.DEPLOY_TARGET === 'gh-pages' ? '/CoursePick/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
