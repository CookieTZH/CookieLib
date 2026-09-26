#!/usr/bin/env python3
"""字体子集化脚本：从站点文本中提取用到的字符，对微软雅黑做子集化，生成精简 woff2。
运行：python scripts/subset-fonts.py
以后新增文章后，重新运行一次即可（会自动重新扫描全部字符）。
"""
import os, sys, re, json, glob

from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "fonts")
WIN_FONTS = r"C:\Windows\Fonts"

# 字体源：微软雅黑常规（msyh.ttc）与粗体（msyhbd.ttc）
SOURCES = {
    "regular": os.path.join(WIN_FONTS, "msyh.ttc"),
    "bold": os.path.join(WIN_FONTS, "msyhbd.ttc"),
}

# 基础字符集：ASCII 可打印 + 常用标点
ASCII = "".join(chr(c) for c in range(0x20, 0x7F))

def collect_chars():
    chars = set(ASCII)
    # 扫描 HTML 与文章 JSON 的全部文本
    files = glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "articles", "*.json"))
    for fp in files:
        try:
            text = open(fp, encoding="utf-8").read()
        except Exception:
            continue
        # JSON 里的 \uXXXX 转义还原（json 读取即可，但直接读原始文本更简单；这里直接取字符串里所有字符）
        for ch in text:
            if ord(ch) > 127:
                chars.add(ch)
    return "".join(sorted(chars))

def subset(src_ttc, out_woff2, unicodes, ttc_index=0):
    font = TTFont(src_ttc, fontNumber=ttc_index)
    opts = Options()
    # 保留 hinting，避免子集后显示发虚
    opts.hinting = True
    opts.name_IDs = [0, 1, 2, 3, 4, 6]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.drop_tables += ["GSUB", "GPOS", "GDEF", "kern", "morx", "meta"]  # 去除不必要的布局表
    ss = Subsetter(options=opts)
    ss.populate(unicodes=[ord(c) for c in unicodes])
    ss.subset(font)
    font.flavor = "woff2"
    font.save(out_woff2)
    font.close()
    return os.path.getsize(out_woff2)

def main():
    os.makedirs(FONT_DIR, exist_ok=True)
    text = collect_chars()
    print(f"收集到 {len(text)} 个字符")
    for name, src in SOURCES.items():
        out = os.path.join(FONT_DIR, f"msyh-{name}.woff2")
        size = subset(src, out, text)
        print(f"  {name}: {size/1024:.0f} KB  ->  {out}")

if __name__ == "__main__":
    main()
