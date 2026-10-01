/* 部署资源同步脚本（npm run build 的收尾步骤）。
 * 1) 404.html：自定义 404 页，内容与 index.html 保持一致；
 *    用户访问站点内任何不存在的路径时由它应答，站内脚本识别路径后弹出 404 页。
 * 2) _redirects：Netlify 的 SPA 回退规则（/articles/*、/pictures/* → index.html）。
 * 3) pics/、articles/、fonts/、music/：经 JS 动态引用、不经 Vite 处理，build 后需镜像进 dist/。
 * 每次修改 index.html 或文章后，重新运行 npm run build（或 npm run sync404）。 */
import { copyFileSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/* 根目录 404.html（直接把项目根推给静态托管/Netlify 根目录部署的方式） */
copyFileSync(root + 'index.html', root + '404.html');

/* dist/ 产物（npm run build 的部署方式） */
if (existsSync(root + 'dist')) {
  copyFileSync(root + 'index.html', root + 'dist/index.html');
  copyFileSync(root + 'index.html', root + 'dist/404.html');
  if (existsSync(root + '_redirects')) copyFileSync(root + '_redirects', root + 'dist/_redirects');
  if (existsSync(root + '_headers')) copyFileSync(root + '_headers', root + 'dist/_headers');
  for (const dir of ['pics', 'articles', 'fonts', 'music']) {
    if (existsSync(root + dir)) cpSync(root + dir, root + 'dist/' + dir, { recursive: true });
  }
  console.log('已同步 404.html，并镜像 pics/、articles/、fonts/、music/、_redirects、_headers 到 dist/');
} else {
  console.log('已同步 404.html');
}
