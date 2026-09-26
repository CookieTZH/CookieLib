/* 部署资源同步脚本（npm run build 的收尾步骤）。
 * 1) 404.html：GitHub Pages 的自定义 404 页，内容与 index.html 保持一致；
 *    用户访问站点内任何不存在的路径时由它应答，站内脚本识别深层路径后弹出 404 页。
 * 2) pictures/、articles/、fonts/：经 JS 动态引用、不经 Vite 处理，build 后需镜像进 dist/。
 * 每次修改 index.html 或文章后，重新运行 npm run build（或 npm run sync404）。 */
import { copyFileSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/* 根目录 404.html（直接把项目根推给 GitHub Pages 的部署方式） */
copyFileSync(root + 'index.html', root + '404.html');

/* dist/ 产物（npm run build 的部署方式） */
if (existsSync(root + 'dist')) {
  copyFileSync(root + 'index.html', root + 'dist/404.html');
  for (const dir of ['pictures', 'articles', 'fonts']) {
    if (existsSync(root + dir)) cpSync(root + dir, root + 'dist/' + dir, { recursive: true });
  }
  console.log('已同步 404.html，并镜像 pictures/、articles/、fonts/ 到 dist/');
} else {
  console.log('已同步 404.html');
}
