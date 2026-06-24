import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Chrome Extension 构建配置
// 策略：HTML 页面正常构建，JS 脚本用 inlineDynamicImports 单入口打包成单文件
// 通过两次 build 来实现：第一次构建 HTML，第二次构建 JS 脚本
export default defineConfig(({ mode }) => {
  const isScripts = process.env.BUILD_TARGET === 'scripts';

  if (isScripts) {
    // 构建 content / background / injected — 每个都是独立的单文件
    // 不能在一个 rollupOptions 里放多个 input + inlineDynamicImports
    // 所以用 build.lib 分别构建
    const target = process.env.SCRIPT_NAME || 'content';
    const entryMap: Record<string, string> = {
      content: resolve(__dirname, 'src/content/index.ts'),
      background: resolve(__dirname, 'src/background/index.ts'),
      injected: resolve(__dirname, 'src/content/injected.ts'),
    };

    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: entryMap[target],
          name: target,
          fileName: () => `${target}.js`,
          formats: ['iife'],
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
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
    };
  }

  // 默认：构建 HTML 页面 (popup + options)
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          'src/popup/index': resolve(__dirname, 'src/popup/index.html'),
          'src/options/index': resolve(__dirname, 'src/options/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
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
  };
});
