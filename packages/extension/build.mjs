// build.mjs — 分步构建 Chrome Extension
// 核心策略：HTML 页面和 JS 脚本分开构建，每个 JS 用 lib mode 单文件输出
import { build } from 'vite';
import { copyFileSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');

// 清空 dist
if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const sharedAlias = { '@shared': join(__dirname, '../../shared') };
const define = { 'process.env.NODE_ENV': JSON.stringify('production') };

console.log('🔨 [1/5] 构建 HTML 页面 (popup + options)...');
await build({
  configFile: false,
  logLevel: 'warn',
  plugins: [(await import('@vitejs/plugin-react')).default()],
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
  resolve: { alias: sharedAlias },
  define,
});

// 构建 JS 脚本的通用函数
async function buildScript(name, entryPath) {
  console.log(`🔨 构建 ${name}.js...`);
  await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: join(__dirname, entryPath),
        name,
        fileName: () => `${name}.js`,
        formats: ['iife'],
      },
      // 不设置 inlineDynamicImports，lib mode + iife 默认就是单文件
      rollupOptions: {
        output: {
          // 确保不生成额外的 chunk 文件
          assetFileNames: `${name}-[hash].[ext]`,
        },
      },
      target: 'es2022',
      minify: false,
    },
    resolve: { alias: sharedAlias },
    define,
  });
  console.log(`  ✅ ${name}.js`);
}

console.log('🔨 [2/5] 构建 content.js...');
await buildScript('content', 'src/content/index.ts');

console.log('🔨 [3/5] 构建 background.js...');
await buildScript('background', 'src/background/index.ts');

console.log('🔨 [4/5] 构建 injected.js...');
await buildScript('injected', 'src/content/injected.ts');

console.log('🔨 [5/5] 复制静态资源...');
// 复制 manifest.json
copyFileSync(join(__dirname, 'manifest.json'), join(distDir, 'manifest.json'));
console.log('  ✅ manifest.json');

// 复制 icons
const iconsDir = join(distDir, 'icons');
mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 48, 128]) {
  copyFileSync(join(__dirname, 'icons', `icon${size}.png`), join(iconsDir, `icon${size}.png`));
}
console.log('  ✅ icons');

console.log('\n✅ 构建完成！输出目录: packages/extension/dist');
