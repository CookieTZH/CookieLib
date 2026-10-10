/* 构建收尾（npm run build 的最后一步）。
 *
 * 站点是**单文件架构**：CSS/JS 全部内联在 index.html 里，src/ 已于 10-03 回退时删除。
 * 所以这个脚本只做两件事：
 *   1) 生成 404.html（站内 404 层用的页面）
 *   2) 把dist/ 清空重建，镜像运行时按路径 fetch 的资源目录
 *
 * 为什么 404.html 不是 index.html 的完整副本：
 * 复制会把首页的 <title> 与 meta description 一起带过去，
 * 分享 404 链接时卡片标题是错的。所以这里只换标题与描述，正文清空
 * （app.js 读 location.pathname 后会自己弹出站内 404 层）。
 *
 * 镜像目录清单（MIRROR_DIRS）：
 *   articles/  文章清单 index.json + 逐篇正文 JSON（站内点卡片时 fetch）
 *   pics/      资料库清单 + 图片 + 壁纸 + 头像
 *   music/     音频、歌词、封面
 *   fonts/     字体子集
 * 构建链不处理这些按路径 fetch 的资源，必须手动搬进 dist，漏一个就 404。
 */
import { copyFileSync, cpSync, existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/* 运行时按路径取资源的目录：构建链不处理，必须原样镜像 */
const MIRROR_DIRS = ['articles', 'pics', 'music', 'fonts'];

/* ---- 生成 404.html ----
 * 取 index.html 的骨架，把 <title> 与 description 换成 404 专用。
 * 正文清空：app.js 读路径后会弹出站内 404 层，页面本身不该预置任何内容。 */
function build404() {
  let html = readFileSync(root + 'index.html', 'utf8');
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, '<title>页面不存在 · 海棠花下</title>')
    .replace(/<meta name="description" content="[^"]*"\/?>/,
      '<meta name="description" content="你访问的页面不存在或已被移动。">')
    /* 阅读层内容清空 */
    .replace(/(<div class="reader-body" id="readerBody">)[\s\S]*?(<\/div>\s*<\/div>)/,
      '$1$2');
  return html;
}

const html404 = build404();

/* 根目录 404.html */
writeFileSync(root + '404.html', html404, 'utf8');

/* ---- dist/ 产物 ----
 * 先整体清空再重建：留着旧产物有两个害处 ——
 * 一是上传时把已删除的文件又传上去，二是本地预览与实际部署不一致，排查时易被误导。 */
const dist = root + 'dist';
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist, { recursive: true });

copyFileSync(root + 'index.html', root + 'dist/index.html');
writeFileSync(root + 'dist/404.html', html404, 'utf8');
if (existsSync(root + '_redirects')) copyFileSync(root + '_redirects', root + 'dist/_redirects');
if (existsSync(root + '_headers')) copyFileSync(root + '_headers', root + 'dist/_headers');
for (const dir of MIRROR_DIRS) {
  if (existsSync(root + dir)) cpSync(root + dir, root + 'dist/' + dir, { recursive: true });
}
console.log('已生成 404.html，并镜像 ' +
  MIRROR_DIRS.map(d => d + '/').join('、') + '、_redirects、_headers 到 dist/');
