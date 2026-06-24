import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Chrome Extension 构建配置
// 关键：content script / background / injected 必须输出为 IIFE 格式
// 因为 Chrome MV3 content script 不支持 ES Module
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // HTML 入口
        'src/popup/index': resolve(__dirname, 'src/popup/index.html'),
        'src/options/index': resolve(__dirname, 'src/options/index.html'),
        // JS 入口 — 必须输出为 IIFE
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        injected: resolve(__dirname, 'src/content/injected.ts'),
      },
      output: {
        // IIFE 格式：Chrome MV3 content script / service worker 不支持 ESM
        format: 'iife',
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
