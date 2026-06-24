// build.mjs — 分步构建 Chrome Extension
// 1. 构建 HTML 页面 (popup + options)
// 2. 构建 content.js (IIFE, inlineDynamicImports)
// 3. 构建 background.js (IIFE, inlineDynamicImports)
// 4. 构建 injected.js (IIFE, inlineDynamicImports)
// 5. 复制 manifest.json 和 icons

import { build } from 'vite';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');

// 清空 dist
if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

console.log('🔨 [1/5] 构建 HTML 页面 (popup + options)...');
await build({
  logLevel: 'warn',
  build: {
    outDir: distDir,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        'src/popup/index': join(__dirname, 'src/popup/index.html'),
        'src/options/index': join(__dirname, 'src/options/index.html'),
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
    alias: { '@shared': join(__dirname, '../../shared') },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [(await import('@vitejs/plugin-react')).default()],
});

console.log('🔨 [2/5] 构建 content.js...');
await build({
  logLevel: 'warn',
  build: {
    outDir: distDir,
    emptyOutDir: false,
    lib: {
      entry: join(__dirname, 'src/content/index.ts'),
      name: 'content',
      fileName: () => 'content.js',
      formats: ['iife'],
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    target: 'es2022',
    minify: false,
  },
  resolve: {
    alias: { '@shared': join(__dirname, '../../shared') },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});

console.log('🔨 [3/5] 构建 background.js...');
await build({
  logLevel: 'warn',
  build: {
    outDir: distDir,
    emptyOutDir: false,
    lib: {
      entry: join(__dirname, 'src/background/index.ts'),
      name: 'background',
      fileName: () => 'background.js',
      formats: ['iife'],
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    target: 'es2022',
    minify: false,
  },
  resolve: {
    alias: { '@shared': join(__dirname, '../../shared') },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});

console.log('🔨 [4/5] 构建 injected.js...');
await build({
  logLevel: 'warn',
  build: {
    outDir: distDir,
    emptyOutDir: false,
    lib: {
      entry: join(__dirname, 'src/content/injected.ts'),
      name: 'injected',
      fileName: () => 'injected.js',
      formats: ['iife'],
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    target: 'es2022',
    minify: false,
  },
  resolve: {
    alias: { '@shared': join(__dirname, '../../shared') },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});

console.log('🔨 [5/5] 复制静态资源...');
// 复制 manifest.json — 去掉 background 的 type:module（因为现在是 IIFE）
let manifest = await import('fs').then(m => m.readFileSync(join(__dirname, 'manifest.json'), 'utf-8'));
manifest = manifest.replace('"service_worker": "background.js",\n    "type": "module"', '"service_worker": "background.js"');
import('fs').then(m => m.writeFileSync(join(distDir, 'manifest.json'), manifest));
console.log('  ✅ manifest.json');

// 复制 icons
const iconsDir = join(distDir, 'icons');
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 48, 128]) {
  copyFileSync(join(__dirname, 'icons', `icon${size}.png`), join(iconsDir, `icon${size}.png`));
}
console.log('  ✅ icons');

console.log('\n✅ 构建完成！输出目录: packages/extension/dist');
