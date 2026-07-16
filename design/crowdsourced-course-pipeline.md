# AI 探险号 · 众包课程创作-归档接口方案

> 目标：把 AI 探险号从“一个课程网站”扩展成“一套可众包生产的儿童互动科普课程系统”。贡献者可以基于公开 skill 生产新课程，先进入密码可见的实验区；经过结构校验、内容审核、UX 审核后，优秀作品归档到主页面正式课程。

---

## 一、产品边界

众包机制服务三个目标：

1. **扩展主题**：AI 之外，可扩展到数学、物理、网络安全、生命科学、编程等抽象知识。
2. **保持质量**：所有投稿必须遵守 `explain-skill` 与 `viz-ux-skill`，不能变成“文字讲义 + 换皮小游戏”。
3. **保护主站**：投稿内容先进入实验区，主页面只收录审核通过的精选作品。

不做的事：

- 不允许投稿直接进入正式课程。
- 不把模型 API Key 放进前端。
- 不把密码入口当真正安全边界；它只用于“预览/内测”，不是权限系统。
- 不让 AI 直接无审核地产生儿童端正式内容。

---

## 二、在线接入 AI vs 本地生成上传

### 方案 A：在线接入 AI 创作

结构：

```text
创作者浏览器
  -> 创作工作台
  -> 后端 API
  -> 模型服务
  -> 返回课程草稿
  -> 人工编辑/校验
  -> 投稿
```

优点：

- 新手门槛最低，不需要本地环境。
- 可以把 skill 固化进系统提示，直接生成符合格式的课程草稿。
- 可以在线做术语、结构、UX、信息密度检查。
- 适合教师、志愿者、非工程贡献者。

风险：

- 必须有后端代理，不能暴露 API Key。
- 有调用成本和额度管理问题。
- 生成内容可能看似完整但事实错误，必须有人工审核。
- 如果过度依赖在线生成，贡献者容易不理解课程方法论。

适合阶段：

- 中长期。
- 当已有审核后台、额度系统、投稿数据库后上线。

### 方案 B：本地生成 + 按格式上传

结构：

```text
贡献者阅读公开 skill
  -> 使用任意 AI/本地编辑器生成 course.json
  -> 本地预览或上传文件
  -> 系统校验 schema
  -> 进入实验区
```

优点：

- 工程简单，最适合当前静态站演进。
- 不承担模型调用成本。
- 不处理创作者的 API Key。
- 内容格式可控，主站只接收结构化课程包。
- 适合开源协作和 GitHub PR 流程。

风险：

- 对非技术贡献者门槛略高。
- 质量更依赖投稿规范和审核清单。
- 无法在线即时帮助改稿，反馈周期较长。

适合阶段：

- **第一阶段推荐方案**。
- 先把课程格式、校验器、实验区、归档流程跑通。

### 结论

推荐采用 **“本地生成 + 格式上传”为主，在线 AI 创作为增强项**。

原因：项目当前主应用是纯静态、可离线、低成本部署。众包系统的第一要务不是“自动生成很多内容”，而是建立可验证的课程契约。先把投稿格式、预览区、审核标准、归档接口做好，后续再接在线 AI，会更稳。

路线：

```text
Phase 1：本地生成/手写 course.json + 上传/PR + 实验区预览
Phase 2：网页上传 + 自动 schema/skill 检查 + 审核面板
Phase 3：教师/创作者端接 AI，在线生成草稿，但必须人工确认
```

---

## 三、课程包接口

每个众包课程是一个独立课程包。

```text
courses/
  official/
    ai-main.js
    ai-advanced.js
  lab/
    internet-security-basic.course.json
    physics-force-basic.course.json
  archived/
    math-probability-basic.course.json
```

课程包结构：

约束：每个 `chapter.sections` 必须包含 **4-8 个 S 小节**。少于 4 节通常无法形成完整学习弧线，超过 8 节应拆成两门课或两个章节。

```json
{
  "schemaVersion": "1.0",
  "id": "internet-security-basic",
  "status": "lab",
  "title": "网络安全小侦探",
  "subtitle": "密码、隐私和骗子链接",
  "audience": "9-12",
  "track": "public-science",
  "author": {
    "name": "贡献者昵称",
    "contact": ""
  },
  "sourceSkills": [
    "explain-skill",
    "viz-ux-skill"
  ],
  "review": {
    "content": "pending",
    "ux": "pending",
    "childSafety": "pending",
    "engineering": "pending"
  },
  "chapters": [
    {
      "id": "password",
      "title": "密码 · 为什么不能太简单",
      "badge": {
        "emoji": "🔐",
        "title": "密码守门员",
        "summary": "你知道了密码为什么要长、要不容易猜"
      },
      "sections": [
        {
          "id": "password-bruteforce",
          "heading": "暴力破解 · 一个个试出来",
          "hook": "阿波：如果小偷不知道密码，他能不能把所有可能都试一遍？",
          "paras": [
            "很短的密码，可能组合很少。",
            "组合越少，机器就越容易一个个试完。"
          ],
          "ux": {
            "component": "uxPasswordCrackRace",
            "props": {
              "mode": "length-vs-time"
            }
          },
          "after": [
            "密码强度本质上和搜索空间有关：可选字符越多、长度越长，组合数量会快速变大。"
          ],
          "terms": {
            "暴力破解": {
              "s": "把可能的密码一个个试，直到试中。",
              "pro": "它不靠聪明猜测，而是消耗计算时间枚举候选；密码空间越大，成本越高。"
            }
          },
          "close": "你刚才看到的一个个试密码，就叫 [[暴力破解]]。所以好密码不是神秘，而是让搜索空间变大。"
        }
      ]
    }
  ]
}
```

### 必填字段

课程级：

- `schemaVersion`
- `id`
- `status`
- `title`
- `audience`
- `sourceSkills`
- `chapters`

章节级：

- `id`
- `title`
- `sections`

章节结构约束：

- `sections.length >= 4`
- `sections.length <= 8`
- 推荐 5-6 节：现象入口、核心机制、变量变化、边界误区、应用迁移、综合挑战。

小节级：

- `id`
- `heading`
- `hook`
- `paras`
- `ux`
- `after`
- `terms`
- `close`

### 禁止字段

- 禁止直接提交任意 `<script>`。
- 禁止内联远程 JS。
- 禁止外链不可控资源作为核心体验。
- 禁止把 API Key、手机号、真实儿童姓名写入课程包。

---

## 四、UX 组件接口

投稿课程不能随意写 HTML 交互，必须调用组件注册表。

```js
UXRegistry.register("uxPasswordCrackRace", {
  title: "密码破解时间赛跑",
  category: "interactive-viz",
  skillTags: ["过程可见", "单变量实时探索"],
  mount(container, props, ctx) {
    // 渲染交互
  }
});
```

课程包只引用：

```json
{
  "ux": {
    "component": "uxPasswordCrackRace",
    "props": {
      "mode": "length-vs-time"
    }
  }
}
```

运行时上下文：

```ts
type UXContext = {
  onComplete: () => void;
  onReset: () => void;
  toast: (message: string, ok?: boolean) => void;
  spark: (x: number, y: number) => void;
  track: (eventName: string, payload?: object) => void;
};
```

组件审核标准：

- 必须有明确完成条件。
- 必须支持重置。
- 必须无外部网络依赖。
- 位置判定使用容器相对坐标。
- 关系/流动类概念必须画连线或箭头。
- 调参类优先单变量实时探索。
- 不能只是换皮点击游戏，必须可视化知识机制。

---

## 五、创作-上传-归档流程

### 1. 创作入口

主页面增加“创作实验室”入口。

```text
首页
  正式课程
  进阶课程
  创作实验室（密码）
```

密码进入后看到：

```text
投稿区
  - 上传课程包
  - 查看课程模板
  - 查看 skill
  - 本地预览说明
  - 当前实验课程列表
```

### 2. 上传

上传方式分两种。

轻量静态版：

```text
贡献者提交 GitHub PR
  -> 添加 courses/lab/xxx.course.json
  -> CI 校验
  -> 合并后实验区可见
```

带后端版：

```text
网页上传 course.json
  -> 后端保存 draft
  -> 自动校验
  -> 生成预览链接
  -> 审核通过后写入 lab
```

### 3. 自动校验

上传后立即跑四类检查：

```text
Schema Check
  字段完整、类型正确、id 唯一

Skill Check
  是否有 hook/paras/ux/after/terms/close
  after 是否为空话
  术语是否被 [[划线]] 引用
  每节核心术语数量是否过载

UX Check
  component 是否存在
  props 是否符合组件 schema
  是否有完成条件和重置

Safety Check
  是否包含隐私信息
  是否含成人/恐吓/歧视内容
  是否包含外部脚本或危险链接
```

自动校验不决定归档，只决定能否进入实验区。

### 4. 实验区预览

实验区课程有明显标记：

```text
实验课程
未审核 / 内容已审 / UX 已审 / 候选归档
```

预览页显示：

- 课程标题
- 作者
- 使用 skill
- 校验结果
- 审核状态
- 体验入口
- 反馈按钮

### 5. 人工审核

审核分四类：

| 审核 | 看什么 | 通过标准 |
|---|---|---|
| 内容审核 | 知识是否正确 | 无硬伤，术语解释准确 |
| 儿童适配 | 9–12 岁是否能理解 | concrete-first，不靠抽象定义 |
| UX 审核 | 交互是否解释机制 | 不是换皮游戏，过程可见 |
| 工程审核 | 是否稳定可合并 | 无脚本风险，无样式污染 |

审核结论：

```text
reject      退回
revise      修改后再审
lab         留在实验区
candidate   候选归档
official    归档到主页面
```

### 6. 归档

归档不是复制粘贴，而是状态迁移：

```text
courses/lab/xxx.course.json
  -> courses/archived/xxx.course.json
  -> courses/official-index.json 增加入口
```

归档时冻结版本：

```json
{
  "id": "internet-security-basic",
  "version": "1.0.0",
  "status": "official",
  "archivedAt": "2026-07-15",
  "reviewers": ["content-reviewer", "ux-reviewer"]
}
```

后续修改走新版本：

```text
1.0.0 正式归档
1.1.0 小修
2.0.0 大改
```

---

## 六、前端 UX 逻辑

### 创作者视角

```text
进入创作实验室
  ↓
选择：从模板开始 / 上传已有课程包
  ↓
填写元信息
  ↓
逐节编辑
  ↓
选择 UX 组件
  ↓
填写术语解释
  ↓
运行自查
  ↓
生成预览
  ↓
提交审核
```

编辑器每节固定 6 块：

```text
1. 标题：术语 · 一句话
2. 阿波开场 hook
3. 正文 paras
4. UX 组件选择与参数
5. after 技术深入
6. close 收束 + [[术语]]
```

系统不给“空白富文本编辑器”，而给结构化表单。这样可以强制遵守课程节奏。

### 审核者视角

```text
审核后台
  ↓
查看自动校验结果
  ↓
左侧课程结构 / 右侧实时预览
  ↓
逐节打分
  ↓
标注问题
  ↓
通过 / 退回 / 候选归档
```

审核界面必须突出两个问题：

- 这个 UX 是否真的解释知识点？
- after 是否提供了真实技术信息？

### 学生视角

学生只看到两种课程：

```text
正式课程：默认展示
实验课程：密码入口后展示，有“实验”标记
```

学生不需要知道投稿、审核、版本等后台信息。

---

## 七、接口设计

### 静态/PR 版接口

```text
courses/lab/*.course.json
courses/official/*.course.json
courses/course-index.json
```

构建时生成：

```json
{
  "official": [
    {
      "id": "internet-security-basic",
      "title": "网络安全小侦探",
      "path": "courses/official/internet-security-basic.course.json"
    }
  ],
  "lab": [
    {
      "id": "physics-force-basic",
      "title": "力和运动实验室",
      "path": "courses/lab/physics-force-basic.course.json",
      "passwordGate": true
    }
  ]
}
```

### 后端 API 版接口

```http
POST /api/courses/drafts
GET  /api/courses/drafts/:id
PUT  /api/courses/drafts/:id
POST /api/courses/drafts/:id/validate
POST /api/courses/drafts/:id/submit

GET  /api/review/queue
GET  /api/review/courses/:id
POST /api/review/courses/:id/decision

POST /api/courses/:id/archive
GET  /api/courses/index
```

AI 增强接口：

```http
POST /api/creator/ai/outline
POST /api/creator/ai/section-draft
POST /api/creator/ai/ux-ideas
POST /api/creator/ai/check-skill
```

AI 接口只产出草稿，不直接发布。

---

## 八、权限设计

角色：

```text
anonymous
  可浏览正式课程

lab_viewer
  输入密码后可浏览实验区

creator
  可上传/编辑自己的草稿

reviewer
  可审核内容与 UX

maintainer
  可归档到 official
```

静态版只有：

```text
anonymous
lab_viewer
maintainer via GitHub
```

后端版再扩展 creator/reviewer。

---

## 九、工程落地路线

### Phase 1：静态众包闭环

目标：不用后端，先跑通课程包格式。

任务：

1. 新增 `courses/lab/`、`courses/official/`。
2. 定义 `course.schema.json`。
3. 写 `scripts/validate-course.js`。
4. 主页面增加“实验课程”密码入口。
5. 实验区读取 `courses/course-index.json`。
6. 新增 `CONTRIBUTING.md` 和投稿模板。
7. 用 1 门非 AI 示例课试跑。

### Phase 2：上传与审核后台

目标：降低非工程贡献门槛。

任务：

1. 做创作工作台。
2. 支持上传 JSON。
3. 支持网页预览。
4. 支持审核状态。
5. 支持归档按钮。

推荐技术：

```text
Cloudflare Workers + D1/KV
```

或：

```text
Supabase Auth + Postgres + Edge Functions
```

### Phase 3：在线 AI 创作助手

目标：让教师/志愿者快速生成第一版草稿。

任务：

1. 后端代理模型 API。
2. 固化 skill prompt。
3. 输出严格 JSON。
4. 自动跑 schema/skill 检查。
5. 人工确认后才能提交审核。

---

## 十、关键论证

### 为什么不是“在线 AI 一键生成并发布”

因为本项目的质量壁垒不是文字，而是：

- 知识点主要矛盾是否抓准。
- UX 是否体现概念机制。
- 技术 after 是否有真实信息密度。
- 术语是否体验后命名。
- 儿童是否能在具体操作中理解。

这些都需要审核。AI 可以加速草稿，但不能代替归档判断。

### 为什么先做本地生成上传

因为当前项目的工程优势是静态、轻量、可离线。先用结构化课程包把“内容契约”定下来，后端和 AI 才有稳定目标。如果先做在线创作，容易把工程复杂度花在账号、额度、聊天界面上，反而还没有定义清楚“什么是合格课程”。

### 为什么要密码实验区

密码实验区解决的是产品秩序：

- 正式课程保持干净。
- 未完成作品可以给小范围用户试。
- 审核者可以直接体验。
- 好作品再归档，不影响主线质量。

但它不是安全系统。真正权限要靠后端。

---

## 十一、最小可执行版本

最小闭环只需要：

```text
1. course.schema.json
2. 一个课程 JSON 模板
3. 一个 validate 脚本
4. 一个 lab 课程入口
5. 一个密码显示实验区
6. 一个“归档”动作：把 status 改 official 并加入 index
```

这就能支持：

```text
贡献者本地生成
  -> PR 上传
  -> 自动校验
  -> 实验区预览
  -> 人工审核
  -> 正式归档
```

后续教师端 API、在线 AI 创作、审核后台，都可以在这个课程包契约上平滑增加。

---

## 十二、第一阶段已收敛方案（小范围可控测试）

用户确认：当前是小范围可控测试，第一步可以暂不考虑严格安全问题。基于此，第一阶段采用**纯静态同源 MVP**。

### 当前 MVP 目标

跑通这条链：

```text
贡献者按 skill 写 course JSON
  -> upload.html 粘贴/导入 JSON
  -> 前端校验格式
  -> 保存到同源 localStorage
  -> index.html 输入课程码
  -> 动态转换为 CHAPTERS['lab:CODE']
  -> 直接进入主阅读器体验
```

### 已落地页面

```text
upload.html
  众包课程上传页
  支持载入模板、文件导入、格式校验、保存本地草稿、发布服务器课程

index.html
  首页新增“实验课程”隐藏入口
  输入课程码后优先读取本地缓存，找不到再请求服务器课程
  复用现有阿波、术语划线、逐段展开、金币、通关流程
```

### 当前课程码机制

课程包 JSON 不手写 `code`。上传页点击“保存到实验区”时，只写入当前浏览器 `localStorage`，不会公开。点击“发布”后，服务器写入：

```json
{
  "code": "1234",
  "status": "published"
}
```

发布后主站输入 `1234` 即可查看。也可以访问：

```text
index.html?lab=1234
```

### 部署研判

#### 1. 本地/同设备测试

可行，且最轻：

```text
打开 upload.html 保存课程
  -> 仅留在当前浏览器实验区
  -> 点击发布
  -> 获得 4 位课程码
```

限制：课程存在当前浏览器的 `localStorage`，换设备/换浏览器不可见。

#### 2. 同源静态部署测试

可行：

```text
把 index.html、upload.html、ui-system.css 一起部署到同一域名
```

只要 `upload.html` 和 `index.html` 同源，`localStorage` 可共享。

适合：

- 内部评审
- 演示上传流程
- 单个测试者自己上传、自己查看

限制：

- A 用户上传的课程，B 用户看不到。
- 无法真正集中收稿。

#### 3. 分支网页直接接入主网页

有两种方式：

```text
方式 A：静态分支页和主站同源部署
  /index.html
  /upload.html
  /courses/lab/*.json
```

构建时把 `courses/lab/*.json` 写入课程索引，主站按课程码 fetch 对应 JSON。这是第一阶段之后最推荐的“无后端共享版”。

```text
方式 B：GitHub PR / 分支提交
  贡献者提交 course.json
  维护者合并到 lab 目录
  部署后主站可按课程码 fetch
```

这个方式适合真正众包，不依赖个人浏览器存储。

#### 4. 多人上传/集中收稿

需要后端：

```text
POST /api/courses/drafts
GET /api/courses/by-code/:code
```

可选 Cloudflare Workers + D1/KV 或 Supabase。第二阶段再做。

### 第一阶段 UX 路径

#### 创作者

```text
首页
  -> 实验课程
  -> 上传作品
  -> 载入模板
  -> 修改 JSON
  -> 校验格式
  -> 保存到实验区
  -> 点击预览
  -> 主站自动进入课程
```

#### 测试者

```text
首页
  -> 实验课程
  -> 输入课程码
  -> 查看课程
```

#### 维护者

```text
收集课程码和 JSON
  -> 体验课程
  -> 判断是否合格
  -> 合格后移入 official/lab 索引
```

### 第一阶段工程限制

当前 MVP 故意不解决：

- 跨用户共享上传内容
- 真正权限系统
- 在线 AI 生成
- 自动归档到 Git
- 后台审核队列

这些都依赖服务端，应该在课程格式和 UX 路径验证后再做。

---

## 十三、动态发布版本（Render + TTL）

用户确认下一步希望从“同设备 localStorage 预览”升级到“别人电脑也能输入课程码预览”的动态版本。当前部署形态是 GitHub → Render，因此推荐做一个轻量 API 服务，先不做账号和审核后台。

### 13.1 目标

让课程包具备两种状态：

```text
本地草稿
  保存在浏览器 localStorage / IndexedDB
  作者自己可长期保留和反复修改

临时发布
  POST 到 Render API
  获得课程码和有效期
  其他设备可在有效期内用课程码预览
  到期服务器自动删除
```

核心设计：**服务器只保存临时发布版，本地浏览器仍保留草稿**。课程过期后，作者可以从本地再次发布。

### 13.2 为什么 Render Free 初期够用

当前需求只是小规模上传/读取 JSON：

- 文件很小：一个课程包通常几十 KB。
- 请求频率低：小范围测试，不是大规模课堂实时并发。
- 计算轻：只做 JSON 校验、保存、读取、删除。

Render Free Web Service 初期可用于验证闭环，但要注意：

- 免费实例可能冷启动。
- 不要把课程写入 Render 本地文件系统；重启/部署后不可靠。
- 持久数据应放外部 KV/数据库。

### 13.3 推荐存储

首选：支持 TTL 的 KV / Redis。

```text
Render Web Service
  -> Upstash Redis / Vercel KV / Cloudflare KV / Supabase
```

推荐 KV key：

```text
course:{CODE}
```

value：

```json
{
  "course": {},
  "createdAt": "2026-07-15T00:00:00Z",
  "expiresAt": "2026-07-22T00:00:00Z",
  "ttlDays": 7
}
```

如果使用 Redis：

```text
SET course:1234 <json> EX 604800
```

这样 7 天后自动清除，不需要手写清理任务。

### 13.4 API 设计

最小 API：

```http
POST /api/courses/publish
GET  /api/courses/:code
POST /api/courses/:code/renew
DELETE /api/courses/:code
```
```

发布请求：

```json
{
  "course": {},
  "ttlDays": 7
}
```

发布响应：

```json
{
  "code": "1234",
  "expiresAt": "2026-07-22T00:00:00Z",
  "previewUrl": "/index.html?lab=1234"
}
```

读取响应：

```json
{
  "course": {},
  "expiresAt": "2026-07-22T00:00:00Z"
}
```

过期或不存在：

```json
{
  "error": "COURSE_NOT_FOUND_OR_EXPIRED"
}
```

### 13.5 主站加载顺序

输入课程码后：

```text
1. 查本地 localStorage
2. 本地没有 → 请求 Render API
3. API 有 → 动态加载并进入阅读器
4. API 没有 → 提示课程不存在或已过期
```

这样兼容当前本地 MVP，也支持跨设备预览。

### 13.6 上传页 UX 增量

上传页新增发布区：

```text
本地保存
  保存到本机实验区

临时发布
  有效期：1 天 / 7 天 / 30 天
  发布到服务器
  显示课程码、过期时间、预览链接

重新发布
  如果服务器课程过期，本地草稿仍在
  点击重新发布，生成新的有效期
```

本机课程列表应显示：

```text
课程名
发布课程码（仅已发布课程显示）
发布状态：未发布 / 已发布 / 已过期
过期时间
按钮：发布 / 预览 / 删除
```

删除规则：

- 未发布草稿：只删除当前浏览器 `localStorage` 里的本地记录。
- 已发布课程：先删除本地记录，再请求 `DELETE /api/courses/:code` 清除服务器临时发布版。
- 如果服务器删除失败，本地删除仍生效；界面提示“服务器发布版可能仍在有效期内”。

### 13.7 清理策略

优先使用 KV/Redis TTL 自动清理。

如果选用普通数据库，则加字段：

```text
expires_at
```

再加一个低频清理任务：

```text
DELETE FROM courses WHERE expires_at < now()
```

但第一版建议避免 cron，直接用 TTL 存储。

### 13.8 安全边界（当前小范围测试版）

用户已确认当前是小范围可控测试，可暂不做严格权限，但仍保留基础工程边界：

- 课程包仍然只允许 JSON，不允许上传 JS。
- 服务端做 schema 校验。
- 限制单个课程包大小。
- 限制 TTL 最大值，例如 30 天。
- 课程码使用随机后缀，避免猜码过于容易。

后续再加：

- 作者登录
- 审核队列
- 归档后台
- 发布次数限制
- 滥用检测
