import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/vietphuc-remix-demo/', // Thêm chính xác dòng này
})
