// copy-assets.mjs - 构建后复制 manifest.json 和 icons 到 dist
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 复制 manifest.json
copyFileSync(join(__dirname, 'manifest.json'), join(__dirname, 'dist', 'manifest.json'));
console.log('✅ manifest.json copied');

// 复制 icons
const iconsDir = join(__dirname, 'dist', 'icons');
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 48, 128]) {
  copyFileSync(
    join(__dirname, 'icons', `icon${size}.png`),
    join(iconsDir, `icon${size}.png`)
  );
}
console.log('✅ icons copied');

// 复制 popup HTML（Vite 可能已经处理了，但确保结构正确）
const srcDir = join(__dirname, 'src');
// Vite 构建后 HTML 会在 dist 根目录，manifest 中的路径需要匹配
console.log('✅ Build assets ready');
