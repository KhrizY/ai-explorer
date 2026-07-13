# AI 探险号

面向小学生的 AI 科普互动网站。9 门课，从「计算机怎么学习」讲到「自己装一个桌面 AI」，全程纯点击、零输入框。

🔗 **[在线访问](https://khrizy.github.io/ai-explorer/)**

## 课程

| # | 课程 | 内容 |
|---|------|------|
| 1 | 🧠 机器学习基本原理 | 传统编程 vs 机器学习、训练三要素、三种学习方式 |
| 2 | ⛽ 数据——AI的燃料 | 数据标注、ImageNet 众包流程、Garbage In Garbage Out |
| 3 | 📊 经典机器学习算法 | 线性回归、决策树、K近邻、SVM、集成学习 |
| 4 | 🕸️ 像大脑一样思考 | 神经元、层级抽象、前向/反向传播、2012 爆发原因 |
| 5 | 👁️ AI怎么看懂图片 | 卷积窗口、特征金字塔、池化压缩 |
| 6 | ⚡ 猜下一个字就行 | Transformer、注意力机制、预训练、涌现智能 |
| 7 | 🗺️ 现在有哪些 AI 可以用 | 美国阵营（GPT/Claude/Gemini/Llama）vs 中国阵营（DeepSeek/Qwen/智谱/Kimi） |
| 8 | 🤖 Agent——让AI替你干活 | API、CLI、Bash、工具调用、RAG 知识库 |
| 9 | 🖥️ 装一个桌面 AI 助手 | OpenCode + DeepSeek API 手把手配置教程 |

## 交互组件

- **card-row** — 可点击展开的卡片组，hover 浮起 + emoji 弹跳
- **process-flow** — 纵向步骤流程图，点击展开详细描述
- **expert-tree** — 可点击决策树，逐级展开 if-else 分支
- **blackbox** — 黑箱训练动画，卡片飞入 → 齿轮旋转 → 输出结果
- **word-attention** — 词注意力可视化，点击词查看关注关系
- **tab-panel** — 横向 Tab 切换面板
- **inline-term** — 正文内 `[[关键词]]` 自动渲染为金色下划线 badge，点击弹出释义
- **finger-hint** — 👆 弹跳引导动画，点击后消失（术语和卡片独立控制）

## 技术栈

纯静态，零框架零构建工具。

```
index.html
├── css/style.css          # 深紫渐变暗色主题，CSS 变量驱动
├── js/app.js              # 路由 + 首页卡片渲染
├── js/course.js           # 课程渲染引擎（顺序展开、Block 组件、inline 解析）
└── data/courses.json      # 全部课程数据（JSON 驱动）
```

## 内容规范

- 正文去术语：专有名词用 `[[术语]]` 标记，点击查看释义
- 一节一意：每节 ≤ 5 个 block，留有白
- 先现象后解释：先让读者「看到」，再解释「为什么」
- 所有 S 模块都有可视化/交互组件
- 每节底部 `nextHint` 引导语，串联阅读流

## 本地运行

直接打开 `index.html`，或：

```bash
npx serve .
```

## 部署

GitHub Pages，`main` 分支根目录。推送即自动部署。
