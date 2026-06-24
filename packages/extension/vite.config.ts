import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Chrome Extension 构建配置
// 输出结构需与 manifest.json 中的路径匹配
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // HTML 入口 - Vite 会保留相对路径结构
        'src/popup/index': resolve(__dirname, 'src/popup/index.html'),
        'src/options/index': resolve(__dirname, 'src/options/index.html'),
        // JS 入口
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        injected: resolve(__dirname, 'src/content/injected.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'injected') return 'injected.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'es2022',
    minify: false,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
