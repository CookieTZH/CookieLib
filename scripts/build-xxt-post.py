# -*- coding: utf-8 -*-
"""
把 xxt8582753 的投稿《人是怎么看网页的》从 xxtsoft.top 的原始 HTML
转换成本站 posts/ 的 JSON 格式。

一次性脚本（保留在仓库里是为了让投稿的转换过程可复查）。
转换规则见 README 注释块，核心是：
  1. 只取 <div class="article-content"> 内的正文
  2. <div class="tips"> 原样保留（本站已补 .tips 样式）
  3. <figure class="wfig"> 里的内联 SVG 原样保留（本站已补 .wfig 样式）
  4. 图片 src 从 assets/xxx.jpg 改写成 pics/xxt/xxx.jpg
  5. 剥掉原站的缩进空白，压成单行
"""
import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/xxt-article.html')
OUT = Path(__file__).resolve().parent.parent / 'posts' / 'how-people-read-web.json'

raw = SRC.read_text(encoding='utf-8')
m = re.search(r'<div class="article-content">([\s\S]*?)</div>\s*</div>\s*<script', raw)
if not m:
    sys.exit('没找到 article-content')
body = m.group(1)

# 图片：assets/ → pics/xxt/
body = body.replace('src="assets/', 'src="pics/xxt/')
# 站内 SVG 用了大量缩进，压掉纯空白行与行首缩进之间多余的空白
body = re.sub(r'>\s+<', '><', body)
body = re.sub(r'\s+', ' ', body)
body = re.sub(r'> <', '><', body)
body = body.strip()

# 正文首段之后插入署名（原文的「作者：xxt8582753」在 hero 图里，正文里没有）
byline = ('<p class="article-byline">本文由 <a href="https://xxtsoft.top" '
          'target="_blank" rel="noopener">xxt8582753</a> 投稿，'
          '原文首发于 <a href="https://xxtsoft.top/articles/scanning.html" '
          'target="_blank" rel="noopener">xxtsoft.top</a>。</p>')
first_p = body.find('</p>') + 4
body = body[:first_p] + byline + body[first_p:]

post = {
    'id': 'how-people-read-web',
    'title': '人是怎么看网页的',
    'date': '2026-10-01',
    'tags': ['投稿', '设计', '眼动研究'],
    'excerpt': 'F 型布局不是设计目标，而是一种失败信号；人其实不在“读”网页，而是在扫。'
               '把 NN/g 三十年的眼动研究串起来看，会发现一些和直觉相反的事。',
    'author': {
        'name': 'xxt8582753',
        'home': 'xxtsoft.top · 服务器有概率炸',
        'avatar': 'pics/avatar/xxt.jpg',
    },
    'content': body,
}

OUT.write_text(json.dumps(post, ensure_ascii=False, indent=2), encoding='utf-8')
print('已写出', OUT)
print('正文长度', len(body), '字符')
