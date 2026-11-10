# 治疗性运动：基础与技术

Kisner & Colby, *Therapeutic Exercise: Foundations and Techniques*（6th ed., F. A. Davis, 2012）的中文译本阅读站。

- 25 章，表格重建为中文表格，段落可切换显示英文原文。
- 阅读进度、字号、原文开关都存在浏览器 localStorage。
- Astro 生成，发布在 GitHub Pages：`/te-zh/<slug>/`。

## 翻译流水线

```bash
node scripts/make-chunks.mjs 8000 /tmp/te_chunks   # 按 ~8000 词切块
# 每块交给一个 subagent，输出到 src/data/zh/<slug>.part<k>.txt
node scripts/check.mjs                             # 检查块覆盖与表格行列
npm run build
```

`src/data/raw/` 是 PDF 转出的原始 markdown 块，`src/data/source/` 是清洗后的分块 JSON。

原文版权归 F. A. Davis Company 与作者所有；本站译文仅供学习参考。
