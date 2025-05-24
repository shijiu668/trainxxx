import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'  // 需要先导入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          // 确保不重写路径
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  })