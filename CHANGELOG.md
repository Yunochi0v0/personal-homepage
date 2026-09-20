# 开发修改历史 · CHANGELOG

> 用途：记录本个人主页从建立到每次迭代的**修改历史与过程**，满足课程「过程可追溯」
> （prompt 记录、AI 输出、人工修改、测试、用户反馈）的要求。
>
> 记录约定：
> - 每个版本按「日期 / 类型 / 修改内容 / 涉及文件 / 验证方式」记录。
> - 涉及 AI 帮助写出的代码，在对应条目中以 `AI-generated` 标注，便于做 AI 合规说明。
> - 「类型」取值：`新增` / `修改` / `修复` / `重构` / `移除`。

---

## [v1.42.8] 彩蛋行解密：触发全站彩蛋后乱码自动还原为真实版本日志（当前）

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 需求：开发历程弹窗中彩蛋相关版本日志以乱码口令展示；触发对应彩蛋后，文本由乱码更变为原本的版本日志。
- 实现（[AI-GEN]，数据驱动）：
  - `history.js` 8 条 `{GARBLE:n}` 加密行补充 `egg`（彩蛋 id）+ `secret`（真实版本日志）字段，文案取自 CHANGELOG / git 历史对应版本的真实记录：
    | 加密版本 | 对应彩蛋 | 真实版本日志 |
    | --- | --- | --- |
    | v1.5 | 页脚暗号「梦想即力量」 | 页面底部彩蛋：输入暗号点亮页面并跳转 BanG Dream |
    | V2.10 / V2.12 | lycnb 隐藏关卡 | 彩蛋升级为 lycnb 解锁的隐藏关卡浮层 / 修复彩蛋浮层遮挡光标 |
    | V2.18 / V2.21 | 待机彩蛋 | 3 分钟无操作红色警报 / 「故障解除」退出动画 |
    | V3.24 | 火柴人彩蛋 | 赛博火柴人：两段式奔跑 / 方向跟随 / 点击说话 |
    | V3.41.1 | 火柴人稀有台词 | 数字孪生与火柴人定制优化（知识库 25 条 / 稀有台词 / 随机回复池） |
    | V3.41.2 | copy 键盘彩蛋 | 输入 copy 复制火柴人，上限 10 个超限回收 |
  - 各彩蛋脚本触发成功时派发 `site-egg` 事件（`detail.name` 为彩蛋 id）：`main.js` 埋点 lycnb / 梦想即力量 / 待机彩蛋三处，`stickman.js` 埋点点击说话（普通台词 + 稀有台词 rare-line）与 copy 两处。
  - `history.js` 监听 `site-egg` 并永久登记到 `localStorage`（key `personal-homepage-eggs`）；渲染时对应行直接显示 `secret` 明文（`.history-declassified` 亮绿色，不再滚动乱码）；弹窗正开着时收到事件即时重渲染。
- **版本**：主页版本号 → 1.42.8；`history.js` / `main.js` / `stickman.js` / `style.css` 引用 `?v=1.42.8`；`main.js` BIOS → v1.42.8；`history.js` 新增 V3.42.8 条目。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/history.js` | 修改 | 8 条加密行加 `egg`+`secret`；彩蛋登记表（loadEggs / markEgg / eggDone）；`renderVersionText` 解密渲染；监听 `site-egg` 即时刷新；V3.42.8 条目 |
| `scripts/main.js` | 修改 | lycnb / 梦想即力量 / 待机彩蛋三处派发 `site-egg`；BIOS → 1.42.8 |
| `scripts/stickman.js` | 修改 | 点击说话与稀有台词、copy 彩蛋派发 `site-egg` |
| `styles/style.css` | 修改 | 新增 `.history-declassified` 解密行样式 |
| `index.html` | 修改 | 版本号 → 1.42.8；相关引用 `?v=1.42.8` |

### 验证方式
- `history.js` / `main.js` / `stickman.js` V8 `--check` 语法通过；页面与脚本 HTTP 200。
- CDP 浏览器实测：未触发彩蛋时 8 行全为乱码；逐个派发 `site-egg`（lycnb / dream-power / idle / stickman / rare-line / copy）并重开弹窗，对应行解密为真实版本日志，其余行保持乱码；刷新页面后解密状态持久保留。

---

## [v1.42.7] 修复：开发历程 LOG 弹窗打不开(历史)

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`修复`

### 修复
- 现象：点击项目板块「开发历程 / LOG」按钮弹窗无响应。
- 根因：上一版本用脚本为 `history.js` 追加 V3.42.6 条目时，替换串多带入一对闭合括号 `} }`，导致 `history.js` 第 92 行 `SyntaxError: Unexpected token '}'`，整个脚本解析失败，弹窗初始化未执行。
- 处理（[AI-GEN]）：修正 `history.js` LOG 条目闭合结构并移除多余括号；`V8 --check` 语法通过。
- **版本**：主页版本号 → 1.42.7，`history.js` 引用 `?v=1.42.7` 强制刷新（上一版线上缓存为坏文件）；`main.js` BIOS → v1.42.7；`history.js` 新增 V3.42.7 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/history.js` | 修改 | 修复 LOG 条目多余闭合括号语法错误 + 新增 V3.42.7 修复记录 |
| `index.html` | 修改 | 版本号 1.42.7，history.js 引用 `?v=1.42.7` |
| `scripts/main.js` | 修改 | BIOS → v1.42.7 |

### 验证方式
- `V8 --check` 语法通过。
- CDP 浏览器实测：页面无异常，点击 LOG 按钮开发历程弹窗正常打开，V3.42.x 条目完整渲染。

---

## [v1.42.6] 英文态像素字体：Press Start 2P(历史)

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`修改`

### 修改
- 用户需求：英语文本字体做出像素风（与页脚「Powered by Vibe Coding」的 8-bit 点阵字体一致）。
- 实现（[AI-GEN]）：
  - `styles/style.css` 追加第 17 节：`html[lang="en"]` 下全站文本 `font-family` 统一切换为 `var(--pixel-font)`（Press Start 2P），含按钮 / 输入框 / 占位符；像素字形偏大，英文态基字收窄至 13px、行距放宽至 2，并对小号辅助文案（.text-muted / .tag / .badge / .dock-tip / .music-pop-title / .card-desc / .ach-desc 等）做放大补偿。
  - 作用域：仅语言切换为英文（`<html lang="en">`，由 i18n.js 设置）时生效，中文态字体栈完全不受影响；Press Start 2P 由 index.html 既有 Google Fonts 引入，无新增外链。
- **版本**：主页版本号 → 1.42.6，`style.css` 引用 `?v=1.42.6` 刷新；`main.js` BIOS → v1.42.6；`history.js` 新增 V3.42.6 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | 追加第 17 节：英文态全站像素字体 + 可读性补偿 |
| `index.html` | 修改 | 版本号 1.42.6，style.css 引用 `?v=1.42.6` |
| `scripts/main.js` | 修改 | BIOS → v1.42.6 |
| `scripts/history.js` | 修改 | 新增 V3.42.6 条目并迁移「当前版本」标记 |

### 验证方式
- CDP 浏览器实测：切换 EN 后正文 / 段落 / 按钮 / 输入框计算样式均为 Press Start 2P，页面截图呈 8-bit 点阵效果；切换回中文后字体栈恢复原样。

---

## [v1.42.5] 多语言切换：左上角 EN / 中 按钮(历史)

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：在网站左上角添加一个「EN」按钮，点击后将整站翻译为英文。
- 实现（[AI-GEN]）：
  - 新增 `scripts/i18n.js`：多语言模块（字典映射 + 元素级标注），支持 `data-i18n`（textContent）/ `data-i18n-html`（innerHTML，仅英文态）/ `data-i18n-ph`（placeholder）/ `data-i18n-aria` / `data-i18n-title` 五种标注；语言持久化到 `localStorage`（key: `personal-homepage-lang`）；切换时派发 `i18n:changed` 事件供动态模块协作；页面标题与 meta 描述随语言切换。
  - `index.html`：左上角新增悬浮 `#langSwitch` 按钮（EN / 中）；全站静态中文文本逐一标注 data-i18n（导航 / Hero / 关于 / 技能 / 项目 / 音游 / 联系 / 成就副标题 / 数字孪生 / 页脚 / 音乐与反馈弹窗 / 开发历程标题）。
  - `scripts/achievements.js`：11 项成就新增 `titleEn` / `descEn`；成就栏渲染、Steam 风格 Toast、解锁时间等随语言切换；监听 `i18n:changed` 重渲染。
  - `scripts/main.js`：数字孪生知识库 25 条新增 `replyEn`，新增 `FALLBACK_EN` 与英文提问别名映射（`EN_ALIASES`）使英文问句也能命中知识库；欢迎语按语言输出；打字机 slogan 重打支持 token 防叠并监听 `i18n:changed`；BIOS → v1.42.5。
- 设计决策：彩蛋内容（隐藏关卡 / 待机警报 / 终端动画 / 诗云暗语）与开发 LOG 条目为站点彩蛋玩法，刻意保持中文原文，不参与翻译。
- **版本**：主页版本号 → 1.42.5，脚本引用 `?v=1.42.5` 刷新（含新增 `scripts/i18n.js`）；`history.js` 新增 V3.42.5 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/i18n.js` | 新增 | 多语言模块（字典 + 应用器 + API + 初始化） |
| `index.html` | 修改 | `#langSwitch` 按钮 + 全站静态文本 data-i18n 标注 + 引入 i18n.js + 版本 1.42.5 |
| `scripts/achievements.js` | 修改 | 成就 titleEn / descEn 双语 + 渲染 / Toast / 时间文案按语言 |
| `scripts/main.js` | 修改 | twin 知识库 replyEn + EN_ALIASES + FALLBACK_EN + 欢迎语双语 + typewriter 重打 + BIOS 1.42.5 |
| `styles/style.css` | 修改 | 追加第 16 节 `.lang-switch` 悬浮按钮样式 |
| `scripts/history.js` | 修改 | 新增 V3.42.5 条目并迁移「当前版本」标记 |

### 验证方式
- jsc 语法检查（i18n / achievements / main）全部通过。
- CDP 浏览器实测：点击 EN → 静态文本 / 成就栏 / Toast / 数字孪生回答 / 打字机 slogan / 页面标题全部切换为英文；刷新后语言保持；点击「中」恢复中文原文。

---

## [v1.42.4] 新增成就「你被骗了」(历史)

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：新增成就「你被骗了」，达成条件为点击页脚「了解更多」按钮。
- 实现（[AI-GEN]）：
  - `scripts/achievements.js` ACHIEVEMENTS 数组新增 `more_clicked`（🪤 / 你被骗了 / 点击页脚「了解更多」按钮），位于 kksk 之后、成就收藏家之前；`init()` 中为页脚 `.btn-more` 绑定 click 事件即时 `unlock("more_clicked")`（按钮为 `target="_blank"` 外链，主页面不跳转，可即时解锁）。
  - 「成就收藏家」检测逻辑通用（`n === ACHIEVEMENTS.length - 1`），自动扩展为其余 10 项全解锁，无需改动。
- **版本**：主页版本号 → 1.42.4，脚本引用 `?v=1.42.4` 刷新；`history.js` 新增 V3.42.4 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/achievements.js` | 修改 | 新增 `more_clicked` 成就 + `.btn-more` click 事件绑定 |
| `index.html` | 修改 | 版本号 → 1.42.4 |
| `scripts/main.js` | 修改 | BIOS 版本号 → 1.42.4 |
| `scripts/history.js` | 修改 | 新增 V3.42.4 条目并迁移「当前版本」标记 |

### 验证方式
- CDP 浏览器实测：成就栏渲染 11 张卡片；模拟点击页脚「了解更多」→ 即时解锁「你被骗了」并弹出 Toast；其余未解锁简介仍为「???」。

---

## [v1.42.3] 成就简介保密：未解锁一律「???」(历史)

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`修改`

### 修改
- 用户需求：成就未解锁时不得显示其简介，一律用「???」代替。
- 实现（[AI-GEN]）：`scripts/achievements.js` 成就栏渲染中，简介 `<div class="ach-card-desc">` 改为 `isUnlocked ? a.desc : "???"`——未解锁的成就无论是否隐藏，简介一律显示「???」，不再展示达成条件；标题逻辑保持不变（仅隐藏成就未解锁时显示「???」）。
- **版本**：主页版本号 → 1.42.3，脚本引用 `?v=1.42.3` 刷新；`history.js` 新增 V3.42.3 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/achievements.js` | 修改 | 未解锁成就简介一律渲染为「???」 |
| `index.html` | 修改 | 版本号 → 1.42.3 |
| `scripts/main.js` | 修改 | BIOS 版本号 → 1.42.3 |
| `scripts/history.js` | 修改 | 新增 V3.42.3 条目并迁移「当前版本」标记 |

### 验证方式
- CDP 浏览器实测：未解锁成就卡片简介均为「???」，无任何真实简介泄漏；解锁后恢复显示真实简介。

---

## [v1.42.2] 页脚新增「了解更多」按钮（历史）

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：网站最底部（页脚）增加「了解更多」按钮，点击跳转 B 站视频 `https://www.bilibili.com/video/BV1UT42167xb/`。
- 实现（[AI-GEN]）：
  - `index.html` 页脚新增 `.footer-more`，内嵌 `a.btn.btn-more` 外链（`target="_blank" rel="noopener noreferrer"`，新标签页打开）。
  - `styles/style.css` 新增第 15 节：按钮复用液态玻璃 `.btn` 基础样式，仅收窄尺寸（`9px 26px`、字号 0.85rem、字距 3px）。
  - **版本**：主页版本号 → 1.42.2，脚本引用 `?v=1.42.2` 刷新；`history.js` 新增 V3.42.2 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 页脚新增「了解更多」外链按钮；版本号 → 1.42.2 |
| `styles/style.css` | 修改 | 新增第 15 节 `.footer-more` / `.btn-more` 样式 |
| `scripts/main.js` | 修改 | BIOS 版本号 → 1.42.2 |
| `scripts/history.js` | 修改 | 新增 V3.42.2 条目并迁移「当前版本」标记 |

### 验证方式
- CDP 浏览器实测：页脚渲染「了解更多」按钮，`href` 为 B 站视频链接、`target=_blank`、`rel=noopener noreferrer`；点击不覆盖当前页（新标签打开）。

---

## [v1.42.1] 成就系统 10 项成就正式落地（历史）

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：提供 10 项具体成就清单，替换框架期的 5 条演示成就。
- 实现（全部 [AI-GEN]）：
  - **成就数据更新**（`scripts/achievements.js`）：10 项成就，其中 8 项轮询检测：
    - 初来乍到：首次访问自动解锁；
    - 档案解密：打开开发历程 LOG 弹窗（`#historyOverlay.is-open`）；
    - 好多小人：输入 copy 复制满 9 个克隆体（本体 1 + 9 = 10 个，即上限）；
    - 还有人类吗：待机彩蛋触发（`#idleEgg` 进入 `revealed`）；
    - lyc确实nb：键盘输入 lycnb 打开隐藏关卡（`#easterEgg.revealed`）；
    - 我爱反馈：反馈提交成功（`#fbSuccess` 显示）；
    - kksk：首次访问时间戳持久化，累计停留满 10 分钟自动解锁（关闭再打开不重置计时）；
    - 成就收藏家（`hidden` 隐藏成就）：其余 9 项全部解锁后自动获得（unlock 时即时检查 + 轮询兜底）。
  - **事件触发 2 项**（`scripts/main.js` 挂接）：
    - 梦想无限大！！！！！：彩蛋页面输入「梦想即力量」提交时即时解锁（另有 `triggered` 状态轮询兜底）；
    - 这诗人吗？：彩蛋页面输入暗语「诗云」提交时即时解锁。
  - **版本**：主页版本号 → 1.42.1，全站脚本 `?v=1.42.1` 缓存刷新（诗云 1.44.3 独立线不动）；`history.js` 新增 V3.42.1 条目并迁移「当前版本」标记。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/achievements.js` | 修改 | 成就定义更新为 10 项；新增 kksk 首次访问计时与「成就收藏家」即时检查 |
| `scripts/main.js` | 修改 | 「梦想即力量」「诗云」分支挂接事件解锁；BIOS 版本号 → 1.42.1 |
| `index.html` | 修改 | 版本号 → 1.42.1；脚本引用 `?v=1.42.1` |
| `scripts/history.js` | 修改 | 新增 V3.42.1 条目并迁移「当前版本」标记 |

### 验证方式
- 各脚本经 jsc 语法检查 OK。
- CDP 浏览器实测：成就栏渲染 10 张卡片；首次访问自动解锁「初来乍到」；模拟待机彩蛋触发解锁「还有人类吗」；输入 lycnb 解锁「lyc确实nb」；copy 复制满 10 个解锁「好多小人」；打开 LOG 解锁「档案解密」；模拟反馈成功解锁「我爱反馈」；彩蛋页输入「诗云」解锁「这诗人吗？」、输入「梦想即力量」解锁「梦想无限大！！！！！」（跳转前经 localStorage 确认）；将首次访问时间戳回拨 10 分钟解锁「kksk」；9 项齐全后「成就收藏家」自动点亮；刷新后持久化保持。

---

## [v1.42.0] 新增成就系统：成就栏 + Steam 风格解锁提示（历史）

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：主页加入「成就」板块，记录浏览本站达成的成就；达成时对应成就卡片点亮，同时网页右下角弹出 Steam 风格的成就解锁提示；本轮先搭建框架，具体成就内容后续逐条补充。
- 实现（全部 [AI-GEN]）：
  - **新脚本 `scripts/achievements.js`**：数据驱动成就框架，IIFE + 挂载 `window.Achievements`。
    - 成就定义：`ACHIEVEMENTS` 数组，每项含 `id / title / desc / icon / hidden / check`；`hidden` 表示解锁前隐藏名称与描述（显示 `???`）；`check` 为可选轮询检测函数。
    - 持久化：解锁进度存入 `localStorage`（`personal-homepage-achievements-v1`），刷新后保持点亮。
    - 渲染：成就栏网格数据驱动生成；未解锁卡片压暗去饱和 + 锁定图标，解锁卡片黄色点亮 + 外发光 + 一次闪光动画 + 「解锁于 时间」。
    - Toast：右下角 Steam 风格提示（图标 + 「成就解锁 · ACHIEVEMENT UNLOCKED」+ 标题 + 描述），滑入滑出动画、多条自动排队播放；`prefers-reduced-motion` 下降级为直接显示。
    - 检测器：每 2 秒轮询所有 `check()`，满足条件自动解锁；另有 `window.Achievements.unlock(id)` 供其他模块事件触发（如反馈提交成功后调用）。
  - **示例成就 5 条（框架演示占位，后续按用户需求替换）**：初来乍到（首次访问自动解锁，演示 Toast）/ 深入探索（滚动至页脚）/ 档案解密（打开开发历程 LOG 弹窗）/ 复制者（隐藏，输入 copy 出现 ≥2 复制火柴人）/ 发声者（隐藏，成功提交访客反馈）。
  - **页面结构**：`index.html` 在 Contact 与 Twin 之间新增「成就 ACHIEVEMENTS」板块（`#achievements` + `#achievementGrid` + `#achievementCounter`），body 末尾新增右下角提示容器 `#achievementToasts`。
  - **样式**：`style.css` 新增第 14 节——成就卡网格、锁定/点亮/闪光动画、右下角 Toast 滑入滑出关键帧、reduced-motion 降级；配色沿用黑黄赛博变量。
  - **版本**：主页版本号 → 1.42.0，全站脚本 `?v=1.42.0` 缓存刷新（`shiyun.js` 独立版本线 1.44.3 不动）。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/achievements.js` | 新增 | 成就框架：数据模型 / 持久化 / 成就栏渲染 / Toast 队列 / 检测器 / API |
| `index.html` | 修改 | 新增成就板块与 Toast 容器；版本号 → 1.42.0；脚本引用更新 |
| `styles/style.css` | 修改 | 新增第 14 节成就卡与 Toast 样式、关键帧 |
| `scripts/main.js` | 修改 | BIOS 版本号 → 1.42.0 |
| `scripts/history.js` | 修改 | 新增 V3.42 条目并迁移「当前版本」标记 |

### 验证方式
- `achievements.js` / `history.js` / `main.js` 均经 jsc 语法检查 OK；页面与脚本 HTTP 200。
- CDP 浏览器实测：
  - 成就栏渲染 5 张卡片，计数「0 / 5」→ 首次访问自动解锁「初来乍到」，右下角弹出 Steam 风格 Toast；
  - 滚动到底 → 轮询检测解锁「深入探索」，Toast 与前面提示自动排队依次播放；
  - 打开 LOG 弹窗（`#historyOverlay.is-open`）→ 解锁「档案解密」；
  - 输入 copy 复制 2 个火柴人 → 隐藏成就「复制者」解锁，解锁前卡片显示 `???`、解锁后显示真实名称与图标；
  - 模拟反馈成功提示显示（`#fbSuccess` 显示）→ 轮询检测解锁「发声者」；`window.Achievements.unlock(id)` API 触发正常；
  - 刷新页面后已解锁卡片保持点亮（localStorage 持久化），计数一致。

---

## [v1.41.2] 第三个键盘彩蛋：输入 copy 复制火柴人（历史）

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：加入第三个键盘彩蛋——在页面任意处直接输入 `copy` 时复制一个火柴人；上限 10 个（含本体）；超过上限时一键回收回 1 个。
- 实现（全部 [AI-GEN]）：
  - **键盘缓冲**：监听 `keydown`，依次输入 `c-o-p-y` 触发；缓冲规则与 lycnb 彩蛋一致——忽略修饰键 / 输入法组字 / 输入框内打字（输入框打字自动清空缓冲，不误触），单字符累积、1.5s 空闲自动清空。
  - **复制**：`master.cloneNode(true)` 深克隆本体（含 SVG 与对话气泡，`cloneNode` 不复制事件监听），`removeAttribute("id")` 避免重复 id，清空本体残留的 `translate3d` 位移、`right/bottom` 置 auto，改用随机 `left/top` 落点（避开视口四边），追加 `.stickman-clone` 类触发弹出动画。
  - **上限与回收**：复制体数组上限 9 个（本体 1 + 9 = 10）；已达上限再输入 `copy` → 移除全部复制体回到 1 个，并由本体气泡随机播报一句回收台词（如「上限 10 个达成，复制体合并完毕。」）。
  - **复制体交互**：点击/触摸复制体弹出自己的台词气泡（独立 DOM 与计时器，不碰本体气泡逻辑），4s 自动消失；复制体不可拖动（拖动物理只绑定本体）。
  - **样式**：`style.css` 新增 `.stickman-clone` 弹出动画（`stickman-clone-pop`：缩放过冲淡入 0.4s，挂外层，与内层呼吸动画不冲突）。
  - **版本**：主页版本号 → 1.41.2，`stickman.js?v=1.41.2` 缓存刷新。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/stickman.js` | 修改 | 末尾新增 copy 彩蛋 IIFE（口令缓冲 / 克隆 / 上限回收 / 复制体气泡） |
| `styles/style.css` | 修改 | 新增 `.stickman-clone` 出现动画与关键帧 |
| `index.html` | 修改 | 版本号 → 1.41.2；`stickman.js?v=1.41.2` |

### 验证方式
- `stickman.js` 经 jsc 语法检查 OK；页面与脚本 HTTP 200。
- CDP 浏览器实测：输入 1 次 copy → 2 个；连续输入逐次 +1 至第 9 次共 10 个；第 10 次输入 → 回收回 1 个 + 本体气泡播报；超限后再输入重新开始复制（1 → 2）。
- 输入框内输入 copy 数量不变（不误触）；复制体点击弹出自己的台词气泡；全页仅 1 个 `#stickman`（无重复 id）。

---

## [v1.41.1] 数字孪生与火柴人定制优化

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`修改`

### 修改
- **数字孪生兜底逻辑**（`scripts/main.js`）：无法回答的问题第 1 次返回原正式兜底文本，此后从站主定制的随机回复池 `FALLBACK_RANDOM`（8 句「何意味」系台词：何意味 / 何益胃 / 喝一胃 / 盒椅位 / 妈咪何意味 / oh no妈咪何意味 / 要不要问问神奇的海螺 / 要不要问问那个黄色小人）抽取；`fallbackCount` 会话级计数。
- **火柴人稀有台词**（`scripts/stickman.js`）：新增 `RARE_LINES` 稀有台词池（「感觉lyc有点nb」「梦想即力量！」「诗云会是个好点子」），点击说话时约 10% 概率抽取，与普通台词共用「不连续重复」规则（按文本比对 `lastLineText`）。
- **数字孪生知识库扩充**（`scripts/main.js`）：`KNOWLEDGE` 由 12 条扩充至 25 条，通读主页 / 诗云页 / 开发历程 / 音游 / 音乐等全站内容后取材，回答严格基于真实内容不虚构。新增覆盖：
  - 身份：姓名（含 GitHub 名 Yunochi0v0）、坐标深圳、绝对 i 人性格；
  - 爱好：音游（phigros / 世界计划，MASTER 全连曲目 ベノム / アイディスマイル / はぐ / アスノヨゾラ哨戒班 / NEO / 命に嫌われている / 8.32）、音乐（赛博随身听网易云播放器）、看番「小资历」；
  - 技能：进度值（HTML/CSS/JS 75%、Python 65%、Vibe Coding 50%、Git 学习中）；
  - 项目：MISSION_01/02/03 三阶段状态；
  - 联系与反馈：邮箱 319008328@qq.com、GitHub、右下角聊天泡（Supabase 后台不公开）；
  - 网站与彩蛋：纯手写无框架 Vibe Coding 迭代、主页 v1.41 / 诗云 v1.44、开发历程 LOG 三大阶段、lycnb 关卡与「梦想即力量」跳转、暗语「诗云」传送、3 分钟待机警报「何意味」、诗云 6 首小诗与四相册（拾光 / 流水 / 夜话 / 留影）、火柴人吉祥物、CRT 开机动画与霓虹光标、数字孪生自述；
  - 兜底提示文案同步扩充引导（彩蛋 / 诗云相册 / 火柴人 / 开发历程）。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/main.js` | 修改 | `KNOWLEDGE` 12→25 条；`FALLBACK` 引导扩充（`FALLBACK_RANDOM` / `fallbackCount` 为上一轮会话所加） |
| `scripts/stickman.js` | 修改 | `RARE_LINES` 稀有台词池（上一轮会话所加） |

### 验证方式
- `main.js` / `stickman.js` jsc 语法检查 OK；页面与脚本 HTTP 200。
- 知识库条数 25、新增关键词条目 grep 确认；FALLBACK_RANDOM / fallbackCount 关键行在 main.js 中确认存在。

---

## [v1.41] 项目板块新增「开发历程」弹窗（历史）

- **日期**：2026-09-20
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：项目板块「本个人主页」（MISSION_01）条目被点击时，弹出本个人网站的**开发历程**弹窗。
- 实现（全部 [AI-GEN]）：
  - **入口**：MISSION_01 行内状态标签右侧新增像素风 **LOG** 按钮（青色描边 + bevel 内阴影，hover/focus 反色点亮，与站点 HUD 语言一致）；全息简报面板新增一行提示「点击 LOG 查看开发历程」。LOG 按钮带 `aria-haspopup="dialog"` + `title`。
  - **弹窗**：全屏暗化遮罩（`backdrop-filter` 模糊，z-index 9996，位于反馈弹层 9995 之上、开机动画 9999 之下）+ 黄黑像素框面板（复用 bevel / 硬投影 / `Press Start 2P` 标题字，面板内衬青色细扫描线纹理）。
  - **内容**：开发历程按**三大阶段**展示（用户划定的里程碑分界，锚点为 v1.22 发布 GitHub Pages）：
    - **V1.0 · 更改光标之前（v1.0 ~ v1.7）**：MVP → 数字孪生 → 动漫头像 → 官方校徽 → 液态玻璃 → 页脚彩蛋 → slogan 更正 → Dock 导航。
    - **V2.0 · 光标 → 发布 GitHub（v1.8 ~ v1.21）**：霓虹光标 → 像素风 → 彩蛋浮层/开机动画 → CRT 扫描线 → MISSION 全息列表 → 待机警报/乱码 → GitHub 卡片与状态仪表盘 → 故障解除动画。
    - **V3.0 · 发布 GitHub 之后（v1.22 ~ v1.40）**：访客反馈 + Supabase → 音乐播放器 → 赛博火柴人 → 音游展示区 → 火柴人橡皮管/弹性绳子/Q 弹挤压等物理迭代。
  - **数据分离**：三阶段与 38 个小版本内容全部集中在 `scripts/history.js` 顶部的 `STAGES` 数组，弹窗 DOM 由 JS 动态渲染（与 arcade.js 同款模式），后续新增版本**只改数据**，不碰 HTML/CSS。
  - **交互**：关闭支持 × 按钮 / 点击遮罩 / 按 Esc 三种方式；`role="dialog"` + `aria-modal` + `aria-hidden` 随开合切换，Esc 监听仅在弹窗打开期间挂载（关闭即移除，不污染页面其他键盘逻辑）；面板 `max-height: 88vh` 内部纵向滚动，标题行 `position: sticky` 悬浮；`prefers-reduced-motion` 下禁用入场动画。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `scripts/history.js` | 新增 | 开发历程数据（STAGES）+ 弹窗开关/渲染/键盘逻辑 |
| `index.html` | 修改 | MISSION_01 行加 LOG 按钮与全息面板提示；新增 `#historyOverlay` 弹窗结构；版本号 → 1.41.0；引入 `history.js?v=1.41.0` |
| `styles/style.css` | 修改 | 新增 LOG 按钮、遮罩、面板、三阶段卡片、小版本列表样式及移动端/reduced-motion 适配 |
| `scripts/main.js` | 修改 | 开机 BIOS 文案版本 → v1.41.0 |

### 验证方式
- HTML 标签配对、CSS 大括号、JS 大括号/小括号配对检查通过。
- 静态检查脚本 `check-v122.py` 更新版本断言至 1.41.0 并新增弹窗结构断言，全部 PASS。
- 本地服务器刷新：点击 MISSION_01 行 LOG 按钮弹出弹窗，三阶段内容完整；× / 遮罩 / Esc 均可关闭；移动端窄屏下布局正常。

---

## [v1.24] 新增「赛博火柴人」可拖动彩蛋

- **日期**：2026-09-17
- **作者**：katzegott
- **类型**：`新增`

### 新增
- 用户需求：在黄黑科幻 HUD 主页右下角新增一个可拖动的「赛博火柴人」彩蛋，拖到哪就停在哪（**不自动跑回原位**）。
- 实现（全部 [AI-GEN]）：
  - **视觉**：内联 `<svg>` 极简火柴人（头/身体/双臂/双腿 7 元素），线条 `stroke: #FFD700` 荧光黄，`filter: drop-shadow(0 0 8px rgba(255,215,0,.8))` 发光；外层 `.stickman`（fixed 右下角，桌面 `right:24 / bottom:220` 避开右侧操作台按钮列、移动端缩小至 36px 且 `bottom:272` 避 Dock 按钮列，z-index 140）。
  - **待机动画**：`.stickman-inner` 承载 `@keyframes stickman-idle`（`translateY(0) ↔ translateY(-4px)`，3.2s 舒缓循环呼吸）——与 JS 的 `translate3d` 分层，互不覆盖。
  - **拖动状态**：`mousedown`/`touchstart` 移除待机动画 → 四肢 `@keyframes` 快速交替摆动（手臂 ±38°、腿 ±30°，左右 0.11s 半周期错峰模拟交替迈步，`transform-box: view-box` + 关节 `transform-origin` 绕肩/胯旋转）；`mousemove`/`touchmove` 用 `transform: translate3d(x, y, 0)` 紧跟指针（GPU 加速），光标 `grabbing`。
  - **松手**：`mouseup`/`touchend`/`touchcancel` 停止奔跑、恢复呼吸，**停在原地**。
  - **移动端**：`touchstart/touchmove/touchend/touchcancel` 全触屏支持 + `touch-action: none`（拖动时页面不滚动），`passive: false` 以允许 preventDefault；`user-select: none` 防选中。
  - **无障碍/降级**：`role="img"` + `aria-label`；`prefers-reduced-motion: reduce` 下待机呼吸禁用、但拖动奔跑保持可用（W3C 豁免用户主动交互的短时装饰动画）；结构缺失时脚本静默退出。

### 修复与增强（v1.24 开发中追加）
- **修复：拖动时手脚不摆动**。根因：`prefers-reduced-motion: reduce` 块与普通规则特异性相同且位于文件末尾，会覆盖四肢摆动动画为 `animation: none`（系统开启「减少动态效果」时完全静止）。修复：reduce 块仅禁用待机呼吸、不再禁用拖动奔跑。
- **增强：整体放大约 1.36×**（桌面 44×66 → **60×90**，移动端 36×54 → **48×72**），线条加粗 `stroke-width 3 → 4`、发光加强 `8px/0.8 → 10px/0.85`，跑动幅度更醒目。
- **增强：跑动感**。四肢摆动幅度加大（臂 ±38° → **±45°**、腿 ±30° → **±40°**），并新增 `@keyframes stickman-run-bounce` 同节奏上下弹跳（0 ↔ 3px），拖动时"挣扎奔跑"更明显。
- **加固：四肢 `transform-box: view-box` + 关节 `transform-origin` 内联到 SVG 元素 style**，与 CSS 规则双保险，避免任何级联/覆盖问题。
- **修复：再次点击/拖动时跳回初始位置**。根因：旧实现用 `baseLeft/baseTop = getBoundingClientRect()` 作为 `translate3d` 的基准，而 `translate3d` 是相对 CSS 静态位置（`right/bottom` 定位点）的偏移——第二次点击时基准里混入了上次位移，位移被清零、瞬间跳回右下角。修复：改为**指针增量累加**（`getTranslate()` 读取当前 transform + `lastX/lastY` 增量叠加），多次拖动从上次停下的位置无缝继续，永不跳回。stickman-runner 新增 2 条「再次拖动不跳回」断言（20 PASS）。
- **重构：奔跑动画改为 JS + rAF 驱动 SVG 原生 transform 属性旋转**（v1.24.2）。前两版用 CSS `@keyframes` + `transform: rotate()` 作用于 SVG `<line>` 元素，在部分 Chromium/WebKit 版本下渲染不生效（拖动时四肢不动，用户两次反馈）。重构后：`requestAnimationFrame` 循环内正弦摆动，直接 `setAttribute("transform", "rotate(角度 关节x 关节y)")`——绕关节旋转是 **SVG 内建能力**，不依赖 CSS `transform-box`/`transform-origin`/CSS 动画对 SVG 图形元素的支持，100% 渲染生效。身体弹跳（`stickman-run-bounce`）保留为 CSS（作用于 HTML div，可靠）。同时：删除四肢 CSS 动画与内联 transform-box/origin（避免与属性旋转叠加冲突）、火柴人不再受 `prefers-reduced-motion` 限制（用户主动交互豁免，并恢复浮窗/均衡器的 reduce 兜底）。stickman-runner 重写至 29 断言（含「四肢经 SVG 属性旋转」「左右肢同刻角度相反」「松手清空四肢恢复静态」等）。
- **增强：四肢两段式「摆动 + 屈曲」双通道奔跑**（v1.24.3）。前几版四肢为单段直线（整臂整腿刚体摆动，肘/膝始终伸直），奔跑姿态生硬。v1.24.3 将四肢拆为 **8 段**（上臂+前臂、大腿+小腿 × 左右）：肩/髋继续「摆动」（臂 ±45°、腿 ±40°，左右相位差 π 交替），新增肘/膝「屈曲」通道——
  - **肘部屈曲**：前臂 `base 115 ± 15°`，后摆折叠（上臂-前臂夹角 82° 深弯）↔ 前摆舒展（夹角 112°）；
  - **膝部屈曲**：小腿 `base ±45 − 33°`，前摆屈膝收腿（大腿-小腿夹角 90°）↔ 后蹬近伸直（夹角 24°）；
  - **关节链组合**：两段式无法用单一 `transform rotate` 表达（前臂须先绕肘、再随上臂绕肩），故渲染改为**每帧计算各段世界坐标**，直接写 `<line>` 的 `x1/y1/x2/y2` 与 4 个新增关节圆（`.stick-joint-{el,kn}-{l,r}`，金色实心）的 `cx/cy`；`stopRun` 时坐标还原为 HTML 原始值（单一数据源，无累积误差）。
  - **节奏放慢**：奔跑周期 `PERIOD 0.22s → 0.30s`（JS 四肢摆动与 CSS 身体弹跳同步放慢），动作更从容自然（用户反馈「放慢一点」）。
  - **朝向跟随拖动方向**（用户反馈「向右拖朝右跑、向左拖朝左跑」）：`onMove` 用水平速度滑动平均（`velX = velX*0.5 + dx*0.5`，阈值 ±1.5 抗单帧抖动）判定本次拖动方向，对整体 SVG 应用 `scaleX(±1)` 水平镜像（flip-x，绕 viewBox 中心，CSS 加 `transform-box: view-box; transform-origin: 50% 50%`），奔跑视觉方向随之反转；向右拖朝右、向左拖朝左、小幅抖动不翻转、松手复位默认朝右。**v1.24.5 修正**：首次实现方向与实际视觉相反（用户反馈「奔跑方向反了」），镜像符号取反 `scaleX(-runDir)` 完成左右调换。
  - **点击说话彩蛋（v1.24.6）**（用户需求：点击火柴人弹出科幻对话气泡）：`onEnd` 用「按下点 ↔ 最后指针点」欧氏距离 `< 5px` 区分点击与拖拽（鼠标与触屏统一），点击随机抽取 8 条台词池（`LINES`，含「欢迎来到我的赛博空间…」「404: 节操未找到…」等，`[AI-GEN]` 起草、可自行增删改）写入气泡文本并显示；再次点击刷新新台词（`lastLineIdx` 避免连句重复）；`setTimeout 4000ms` 自动淡出；`document` 捕获阶段 `mousedown/touchstart` 判断目标不在 `.stickman` 内即关闭（点击火柴人本身不关闭、交给刷新逻辑）；`touchcancel` 不触发。气泡样式贴 HUD 风格：`.stick-bubble` 深色半透明 `rgba(0,0,0,.8)` + `backdrop-filter: blur(8px)`、黄色细边框 `1px solid #FFD700`、白色等宽文字、`::after` 黄色三角尾巴指向火柴人头顶、`transform: translateX(-50%) scale(0.8) → scale(1)` 缩放淡入过渡；气泡为 `.stickman` 内部 absolute 元素，随拖动一起移动。
  - **验证**：新增 `.deepworks/tmp/render-stickman.py` 帧级几何验证（从 stickman.js 提取 LIMBS 配置渲染 8 帧关键姿势，断言屈膝 >60°/<35°、折肘 <90°/>105°、左右交替 ≥6 帧差 >20°、端点不越界不落头）——FRAME CHECK PASSED；stickman-runner 重写至 **33 断言**（8 段坐标写入、关节圆 cx/cy、肘/膝夹角跨帧 83.7↔112.2 / 27.4↔90.1 屈曲动态、坐标还原）全过；v1.24.4 新增 **6 条方向断言**（向右拖 scaleX(1)、向左拖 scaleX(-1)、小幅抖动不翻转、松手复位），runner 至 **39 PASS**；v1.24.6 新增 **17 条点击说话断言**（原位点击弹气泡、文本属台词池、再次点击刷新不连句、4s 定时器自动淡出、点击火柴人不关闭、点击外部关闭、拖动/触屏滑动/touchcancel 不触发、document 捕获监听），runner 至 **56 PASS**；check-v122.py 同步新增 12 条静态断言（气泡结构/台词池/阈值 5px/4s/捕获监听/CSS 样式与动画），185 项 ALL CHECKS PASS。

### 说明
- **版本号升至 1.24.0**：新功能版本，`index.html` CSS/脚本资源引用、`<body data-version>`、main.js BIOS 全部同步（避免线上浏览器缓存旧 CSS 导致火柴人无样式）。
- **无依赖**：stickman.js 独立 IIFE，不监听 window keydown（idle-runner `winKeydown=4` 基线不受影响）、无轮询、无外部资源。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | `<body>` 版本号升至 `1.24.0`；新增火柴人结构（`.stickman` / `.stickman-inner` / 内联 SVG 火柴人）；引入 `scripts/stickman.js?v=1.24.0`；CSS 与既有脚本版本号同步；v1.24.3 四肢改为两段式 8 段 `<line>` + 4 个关节圆 `<circle class="stick-joint">`；v1.24.6 新增对话气泡 `.stick-bubble` + `.stick-bubble-text`（`[AI-GEN]`），`aria-label` 更新为「可点击说话」 |
| `styles/style.css` | 修改 | 新增第 11 节：火柴人定位/发光/呼吸/奔跑动画/移动端适配/reduced-motion（`[AI-GEN]`）；v1.24.3 新增 `.stickman-svg .stick-joint` 金色实心关节圆样式；v1.24.6 新增 `.stick-bubble` 气泡样式（深色半透明 + backdrop-blur + 黄边框 + `::after` 三角尾巴 + scale 缩放淡入过渡 + 移动端窄屏适配，`[AI-GEN]`） |
| `scripts/stickman.js` | 新增 | 拖动逻辑：鼠标 + 触屏统一取点、`translate3d` 跟手、dragging class 切换（`[AI-GEN]`）；v1.24.3 重写渲染核心：LIMBS 8 段配置（base/amp/off 摆动+屈曲）、关节链 PARENT 组合、每帧世界坐标写入 x1/y1/x2/y2 与关节圆 cx/cy；v1.24.6 新增点击说话：`LINES` 台词池（8 条）、`CLICK_DIST=5` 点击/拖拽判定、`showBubble/hideBubble/onDocDown`、4s 定时器（`[AI-GEN]`） |
| `scripts/main.js` | 修改 | 开启动画 BIOS 版本号同步为 `v1.24.0` |

### 验证方式
- 静态校验（check-v122.py，V=1.24.0）：版本号六处一致、火柴人结构与动画断言、花括号配平（含 stickman.js）、无真实密钥、资源存在性——ALL PASS（v1.24.3 更新断言：两段式 8 段四肢 + 4 关节圆结构、坐标属性渲染 `setAttribute("x1"...`、关节链父子组合、屈曲幅度配置；v1.24.6 更新断言：气泡结构/台词池/阈值/捕获监听/气泡 CSS）。
- 行为回归（jsc）：stickman-runner **56 断言**全过（初始待机、8 段坐标写入、关节圆 cx/cy、肘/膝夹角屈曲动态、松手坐标还原、再次拖动不跳回、非主键忽略、触屏全流程、touchcancel 兜底、方向跟随、点击说话全场景、监听注册）；music-runner / feedback-runner / boot / egg / idle 全量回归保持通过。
- 帧几何验证（.deepworks/tmp/render-stickman.py）：从 stickman.js LIMBS 渲染 8 帧关键姿势，V1–V5（屈膝/折肘/左右交替/端点边界/摆动反相）FRAME CHECK PASSED。
- 人工验收：本机 8123/8124 拖动火柴人——待机呼吸 → 拖动奔跑（v1.24.3 两段式：前摆屈膝收腿、后蹬伸直、摆臂折肘）→ 松手停原地；**v1.24.6 点击火柴人弹出随机台词气泡（缩放淡入、4s 自动消失、再点刷新、点别处关闭；拖动/滑动不触发）**；移动端模拟窗口（mobile-preview.html）触屏轻点说话、滑动不触发且不滚动页面；reduced-motion 下全部静态。

---

## [v1.23] 新增音乐播放器：右下角 🎵 入口 + 赛博随身听浮窗

- **日期**：2026-09-17
- **作者**：katzegott

### 新增
- 用户需求（个人主页 V3 课件）：集成网易云音乐官方外链播放器——右下角新增悬浮 🎵 入口按钮，点击后在按钮上方弹出「赛博随身听」浮窗，再点关闭；浮窗内以主页风格外壳包裹网易云 iframe，默认不自动播放。
- 实现：右下角 🎵 像素徽章叠在反馈徽章上方（桌面 `right:26 / bottom:150`、移动端 `right:14 / bottom:212`，均不移动任何现有元素）→ 点击在按钮上方弹出浮窗（桌面 `right:26 / bottom:210`、移动端缩宽至 `min(340px, 100vw-24px)` 并水平居中，始终不超出屏幕边缘）→ 浮窗内 `#music-player-container` 占位，首次打开时才动态创建网易云外链 iframe（懒加载，优化首屏性能），之后开关浮窗不重复创建、播放不中断。

### 说明
- **已接入单曲 1935705479（[MANUAL]）**：网易云外链生成器不可用，改用官方标准格式手工拼装 iframe——`https://music.163.com/outchain/player?type=2&id=1935705479&auto=0&height=66`，已直接填入 `index.html` 的 `#music-player-container`，换歌只需改 `id` 参数。**2026-09-17 修正：src 从协议相对 `//music.163.com` 改为显式 `https://` 绝对地址**——本地 `http://localhost:8123/8124` 开发环境下协议相对会解析成 http、经 302 重定向，浏览器对 iframe 内跨域 http→https 重定向不跟随，导致播放器空白/不渲染；https 绝对地址在 http 与 https 页面均可正常嵌入。
- **iframe 尺寸与白底处理（[AI-GEN]）**：宽度 100%，高度固定 86px（网易云内容 66px + 上下留白内边距）；网易云外链页面为白底且跨域 iframe 无法透明，故对 iframe 施加 `filter: invert(1) hue-rotate(180deg)` 将白底深色化（红色品牌色经 invert + 180° 色相回转大致还原），与主页黄黑赛博风格融合，消除白色方块。
- **iframe 接入（二选一，均已标注）**：方式 A（当前使用）：iframe 直接粘贴在 `index.html`（`[MANUAL]`）——脚本检测到容器内已有 iframe 后不再创建；方式 B（备选）：把外链地址填到 `scripts/music.js` 顶部 `MUSIC_SRC` 常量（`[MANUAL]`），由脚本动态生成 iframe。
- **代码标注**：本次 AI 生成的开关浮窗与懒加载逻辑统一标注 `[AI-GEN]`；需人工粘贴 iframe 的位置统一标注 `[MANUAL]`。
- **视觉语言**：浮窗沿用站内风格——深色半透明毛玻璃（`rgba(8,8,8,.85)` + backdrop blur）、1px 黄色细边框、`clip-path` 斜切角、`0 0 22px` 黄色微光阴影、`Press Start 2P` 标题字；与反馈徽章同族的 bevel 像素按钮（hover 点亮为纯黄底黑字）。
- **交互细节**：点击 🎵 徽章开/关浮窗（`aria-expanded` 同步），点浮窗右上角 × 关闭；关闭浮窗不销毁 iframe，音乐可继续播放；浮窗出现/收起有 0.25s 位移渐隐过渡，`prefers-reduced-motion: reduce` 下过渡禁用（CSS 兜底）。
- **性能与基线**：iframe 在首次打开时才注入 DOM（页面加载时不请求外链）；音乐模块不注册任何 window keydown 监听（idle-runner 的 `winKeydown=4` 基线不受影响），纯 click 交互。
- **无障碍**：徽章 `aria-label="打开音乐播放器"` + `aria-expanded` + `aria-haspopup="dialog"`，浮窗 `aria-hidden` 随开合切换，关闭按钮 `aria-label="关闭播放器"`。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | `<body>` 版本号升至 `1.23.0`；新增 🎵 徽章按钮与「赛博随身听」浮窗骨架（`#musicPop` / `#music-player-container` / `[MANUAL]` 粘贴处）；引入 `scripts/music.js?v=1.23.0`；CSS 与既有脚本版本号同步 |
| `styles/style.css` | 新增 | 新增第 10 节：音乐徽章（含 hover/active）、浮窗外壳（毛玻璃 + 黄细边 + 切角 + 微光）、播放器容器、移动端缩宽居中与 reduced-motion 兜底 |
| `scripts/music.js` | 新增 | 开关浮窗逻辑 + iframe 懒加载（`[AI-GEN]` 标注；`MUSIC_SRC` 与粘贴处为 `[MANUAL]` 标注） |
| `scripts/main.js` | 修改 | 开启动画 BIOS 版本号同步为 `v1.23.0` |

### 验证方式
- 静态校验（check-v122.py，V=1.23.0）：版本号五处一致、音乐模块结构与 z-index 层级、花括号配平、无真实密钥特征、资源存在性——ALL PASS。
- 行为回归（jsc）：music-runner 覆盖加载无错、初始关闭态、打开创建 iframe、再点关闭、重开不重复创建、容器已有 iframe 时不重复创建；feedback-runner / boot / egg / idle 全量回归保持通过（无 winKeydown 基线污染）。
- 人工验收：本机 8123 与 GitHub Pages 线上地址点 🎵 开关浮窗，确认浮窗在按钮上方、移动端（≤640px）缩宽居中不超边；单曲 1935705479 播放器正常显示、无白底（深色化后与外壳融合），换歌改 iframe 的 `id` 参数即可。

### UI 微调（2026-09-17 追加 · v1.23.1 样式，功能逻辑不变）
- **需求**：用户反馈「赛博随身听」UI 与主页风格割裂，要求 5 项微调：白底处理、浮窗位置与层级、右侧按钮布局、播放氛围光效、代码标注。
- **白底（保留既有 filter 方案，[AI-GEN]）**：对比两种方案后保留 `filter: invert(1) hue-rotate(180deg)`——白底反转深色、红色品牌色经 180° 色相回转还原；「容器上方叠深色遮罩」方案会同时压暗播放器内容且遮罩挡点击（pointer-events），体验更差，弃用。容器 `overflow: hidden` 兜底（`.music-player-container`）。
- **浮窗位置与层级（[AI-GEN]）**：浮窗从「按钮正上方（right:26 / bottom:210，易遮正文）」改为「悬浮右下角、按钮列左侧（right:90 / bottom:100）」——与三按钮列水平错开，不遮挡正文主区也不压按钮；新增 `.music-backdrop` 全屏极淡暗色遮罩（`rgba(3,3,3,.34)` + 1px blur，z-index 149 < 按钮与浮窗 150），打开浮窗时点亮突出浮窗，点击遮罩可关闭（music.js 联动，元素缺失时静默跳过）。移动端浮窗仍缩宽居中。
- **右侧按钮布局（[AI-GEN]）**：音乐 / 反馈 / 返回顶部三按钮统一收进 `.side-btns` 容器（fixed 右下角，flex 纵向 `gap:16px` 拉开间距防误触，桌面 `right:26 / bottom:26`、移动端 `right:14 / bottom:92` 避 Dock）；图标由 emoji/文字/箭头字符统一为黄色细线线性 SVG（`stroke: currentColor`，hover 纯黄底黑字点亮），三按钮风格完全一致。
- **播放氛围光效（[AI-GEN]）**：浮窗打开（`.music-pop.is-open`）时外壳加 `animation: music-breathe 2.6s ease-in-out infinite` 黄色呼吸光晕（box-shadow 14px→30px→64px 三档呼吸），关闭即消失；`prefers-reduced-motion: reduce` 下禁用。
- **代码标注**：本次微调全部为 AI 生成，在 HTML 容器注释 / CSS 小节 / music.js 联动处统一标注 `[AI-GEN]`；外链 iframe 粘贴处维持 `[MANUAL]` 不变。
- **白圈修复（2026-09-17 追加，[AI-GEN]）**：播放器卡片外残留一圈白底——根因是 `.music-player-container iframe` 自身的 `background: #050505` 也被 `filter: invert(1)` 反转成 ≈白色（#050505→#fafafa），86px iframe 高于网易云 66px 内容的留白区域露白。修复：深色底移到容器（`.music-player-container { background:#050505 }`，在 filter 作用范围外保持深色），iframe 不再设背景（透明留白透出容器深色底）。
- **播放中均衡器（2026-09-17 追加，[AI-GEN]）**：浮窗标题栏「赛博随身听」与关闭按钮之间新增 5 根黄色细柱波动动画（`.eq-bars`，`@keyframes eq-wave` 高度 4px↔14px、0.12s 错峰 delay、`box-shadow` 微光），随 `.music-pop.is-open` 点亮/熄灭（与呼吸光晕同一驱动——跨域 iframe 无法获知真实播放状态，以「浮窗打开=正在播放」表现）；`prefers-reduced-motion: reduce` 下禁用。
- **均衡器加强 + 真实播放状态驱动（2026-09-17 追加，[AI-GEN]）**：① 柱子更醒目——加粗至 3px、波动幅度加大（5px↔14px）、双层辉光（6px+12px）、新增黄色底轨基线、动画提速至 0.9s；② 不再以浮窗打开驱动——跨域 iframe 无法读取网易云播放器真实状态，改为 music.js 轮询 `performance.getEntriesByType("resource")` 匹配网易云音频直链（`.music.126.net` 的 mp3/m4a 等）：播放器点「播放」必然产生新的音频资源条目 → 判定播放中（`.music-pop.is-playing` 点亮柱子）；持续 10s 无新请求 → 判定静止；浮窗打开时启动轮询、关闭时停止。局限：音频整体缓冲完成后播放中不再产生新请求，高网速下播放中后期可能提前静止，暂停判定最多滞后 10s；无定时器环境（命令行测试）静默跳过。

### 涉及文件（UI 微调）
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 三按钮包入 `.side-btns` 容器并替换为线性 SVG 图标；新增 `.music-backdrop` 遮罩元素 |
| `styles/style.css` | 修改 | 新增第 9 节开头「右侧悬浮操作台」：`.side-btns`（z-index 150 / gap 16px / 移动端避 Dock）、`.music-backdrop`（z-index 149 / .is-open 时 pointer-events 开启）；`.back-top` / `.feedback-badge` / `.music-badge` 去掉独立 fixed 定位、统一为容器内细线风格；`.music-pop` 移至右下角（right 90 / bottom 100）并加呼吸光晕动画与 reduced-motion 兜底 |
| `scripts/music.js` | 修改 | 开关浮窗时同步切换 `.music-backdrop.is-open` 与 `aria-hidden`；遮罩点击关闭（null 安全） |
| `.deepworks/tmp/check-v122.py` | 修改 | 断言适配新布局：操作台 z-index/gap/移动端、浮窗 right 90/bottom 100、遮罩层级、呼吸光晕、SVG 图标、music.js 遮罩联动 |

---

## [v1.22] 新增访客反馈功能：右下角徽章 + Supabase 后台

- **日期**：2026-09-17
- **作者**：katzegott

### 新增
- 用户需求（个人主页 V3 课件）：新增「访客反馈」——访客在页面右下角点徽章，弹层里填一张小表单，提交后数据进入 Supabase 后台；访客只允许写入，读 / 改 / 删仅主页主人（经 Table Editor）可做。
- 实现：右下角「反馈」像素徽章叠在返回顶部上方（桌面 `right:26 / bottom:86`、移动端 `right:14 / bottom:148`，均不移动任何现有元素）→ 点击弹出居中弹层（z-index 9995，介于待机彩蛋 9990 与开机动画 9999 / CRT 遮罩 10000 之间）→ 表单字段昵称（可选 ≤40）/ 关系（同学老师家人朋友同事其他不便透露，必选）/ 设备（电脑手机平板其他，必选）/ 内容（必填 ≤1000 字，带字数计数）→ 提交经 Supabase REST API 写入 `public.feedback` 表，自动附带网站版本（`<body data-version>`）与数据库时间戳。

### 说明
- **后端接线**：前端通过官方 `@supabase/supabase-js@2.49.4`（UMD CDN，jsdelivr）以 `createClient(ProjectURL, publishableKey)` 惰性创建客户端——只有第一次提交时才真正创建。本仓库 `supabase/feedback.sql` 已建表并开启 RLS：`anon / authenticated` 只有一条 INSERT 策略（`with check (true)`），同时显式 `revoke select, update, delete`，所以访客读不到任何一行（故意不写 SELECT 策略），主人查看反馈走控制台 Table Editor（RLS 不拦截主人登录态）。
- **安全红线**：前端与仓库只出现 publishable key（设计上公开的前端配置）；secret key（service_role）与数据库密码永不进入前端、不进仓库、不进对话记录（课件 p21）。
- **健壮性**：提交中按钮置灰并显示「提交中…」（`sending` 标志防重复，连点只发一次）；失败时错误行提示并**保留输入内容**，可直接重试；成功后表单隐藏、显示 ✓ 面板；CDN 加载失败或离线时提交给出「后台服务暂时不可用」而不是报错崩溃。
- **交互细节**：点遮罩 / × / Esc 均可关闭弹层，但发送中禁止关闭（避免状态错乱）；Esc 的 window keydown 监听只在弹层打开期间挂载、关闭时移除，不污染页面其它键盘逻辑（idle-runner 的 `winKeydown=4` 基线不受影响）；再次打开时表单自动复位。
- **无障碍**：徽章 `aria-label="留个反馈"` + `aria-haspopup="dialog"`，弹层 `role="dialog" / aria-modal / aria-labelledby`，遮罩 `aria-hidden` 随开合切换；弹层内输入框沿用全局 `.has-cursor input:focus` 的文本光标规则。
- **视觉语言**：徽章与弹层沿用站内像素风——方角、3px 主色描边、bevel 内阴影、clip-path 切角，与返回顶部按钮同族；移动端（≤640px）徽章随之缩小并上移避开底部 Dock；`prefers-reduced-motion: reduce` 下弹层出现动画直接静态呈现（CSS 兜底）。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | `<body>` 增加 `data-version="1.22.0"`；新增反馈徽章按钮与弹层结构（表单字段 / 错误行 / 成功面板）；引入 supabase-js UMD CDN 与 `scripts/feedback.js`；CSS 与主脚本版本号同步为 `1.22.0` |
| `styles/style.css` | 新增 | 新增第 9 节：徽章（含移动端与 hover/active）、弹层遮罩与面板、表单控件像素化、字数计数、错误 / 成功面板、reduced-motion 兜底 |
| `scripts/feedback.js` | 新增 | 反馈逻辑：惰性 Supabase 客户端、表单校验、防重复提交、成功 / 失败态、Esc 开关监听 |
| `scripts/main.js` | 修改 | 开启动画 BIOS 版本号同步为 `v1.22.0` |
| `supabase/feedback.sql` | 新增 | （上一提交已完成）建表 + RLS 权限脚本，本功能的前端与之对接 |

### 验证方式
- 后端连通自检（curl）：`GET /rest/v1/feedback` 被 RLS 拒绝（401，符合预期）；`POST` 带唯一标记的测试行返回 201 成功——标记 `v122check-1789636533` 需在 Table Editor 找到并删除。
- 静态检查：三处版本号一致性（CSS link / main.js script / feedback.js script）、`<body data-version>` 与 BIOS 版本号、CHANGELOG 首条与（当前）标记、feedback.js 花括号配平、仓库文件中无真实密钥（service_role / JWT / 连接串）。
- 运行时回归（JavaScriptCore）：feedback-runner 断言加载无错误、初始隐藏态、徽章打开 / 遮罩与 Esc 关闭、Esc 监听增减、必填与超长校验、合法提交 payload（含 `version="1.22.0"`）、`sending` 防重复（仅一次 insert）、成功面板、失败保留内容可重试；再重跑 boot / egg / idle 三套回归确认 main.js 未受影响。
- 人工验收（用户）：本地 8123 打开页面，点右下角「反馈」徽章填表提交，看到 ✓ 面板；随后在 Supabase Table Editor 中找到该条记录（并删除自检标记行）。

### 修复（v1.22.1）
- 用户反馈：点徽章后弹层里看不到「提交反馈」按钮。根因：弹层 `max-height: min(86vh, 560px)` + 内部滚动，表单字段较多时按钮被挤出滚动区，需滚动才可见，易被误认为缺失。
- 修复：`.feedback-submit` 增加 `position: sticky; bottom: 0`，按钮吸附弹层底部，内容再长也始终可见；同步提升资源版本号至 `1.22.1`（CSS link / main.js script / feedback.js script / `<body data-version>` / BIOS 均一致），避免浏览器缓存旧样式。
- 涉及文件：`styles/style.css`、`index.html`、`scripts/main.js`。
- 验证：check-v122.py 全绿；feedback-runner 58 PASS；boot / egg / idle 三套回归重跑通过；8123 / 8124 均以新版本号提供。

---

## [v1.21] 待机彩蛋新增「故障解除」退出动画

- **日期**：2026-09-17
- **作者**：katzegott

### 新增
- 用户需求：待机彩蛋退出时要有退出动画，大意为「故障解除」，必须包含文本「不要问何意味，欢迎回来」，时长 3 秒，风格与主体一致。
- 实现：退出时先播放 3 秒「故障解除」终端序列，再收起浮层。序列把警报态逐行解除——故障诊断清除、警报通道关闭、系统状态正常、待机监控重置——进度条走满 100% 后标记 `RESTORED`，同时浮出主色大字「不要问何意味，欢迎回来」，最后整体淡出。

### 说明
- **时间轴（3 秒，由 CSS 驱动）**：
  - `0.00s` 解除层亮起，画面像素级抖动一次（`clearShake`，每帧 1~3px 位移，模拟刚排除故障时的信号不稳）。
  - `0.15s / 0.41s / 0.67s / 0.93s` 逐行打印四条解除日志，节奏与开启动画同构（每行 260ms）。
  - `0.52s ~ 1.4s` 进度条从 0 推到 100%，状态行同步显示 `CLEARING 0xx%`，走满后转为 `RESTORED` 并加到最亮。
  - `1.30s` 欢迎语淡入并轻微放大，入场瞬间带一次红/青分离的色差抖动（`clearWelcomeGlitch`），随即收束为主色发光。
  - `2.70s ~ 3.00s` 整个解除层淡出（`clearFade` 的末段 10%），`3.00s` JS 收尾并移除 `.is-clearing`。
- **「解除」的视觉表达**：解除过程中全屏同步从警报红回到站点主色黄——警报泛光停止脉冲并褪为淡黄（`.idle-alert`），乱码噪声转为主色并降到 `opacity: .45` 让出视觉重心（`.idle-scramble`），日志文字用 `clearLogColor` 从红渐变到黄。因此退出动画不是简单消失，而是一次可见的「恢复正常」。
- **与开启动画呼应**：欢迎语与提醒标题「何意味，你还在吗？」用同一视觉重量（clamp 字号 + 900 字重 + 发光），构成「红色问句 → 主色答句」的一问一答。
- **提醒内容让位**：`.is-clearing` 期间 `.idle-egg-body` 在 0.12s 内隐藏，避免与解除序列叠字；解除层是不透明的 `#050505` 且 `z-index: 4` 高于开启动画的 `3`，两层不会同时可见。
- **状态与计时安全**：`idleOpen` 在整个 3 秒内保持为真，退出动画期间不会重复触发待机；`closeIdleEgg()` 用 `clearing` 标志拒绝重入（连点「退出」或点浮层空白都只播一次）；到点后由 `hideIdleEgg()` 统一移除 `revealed` / `is-ready` / `is-clearing` 并重新挂表，函数本身幂等。
- **无障碍与降级**：解除层为 `aria-hidden="true"` 的纯视觉层，`pointer-events: none` 不拦截点击。`prefers-reduced-motion: reduce` 下 JS 直接跳过整段动画、立即收起浮层（与开启动画同一降级策略），CSS 另有兜底隐藏。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 待机浮层内新增 `.idle-clearing` 解除层（解除日志 / 进度条 / 状态行 / 欢迎语）；两处资源版本号同步为 `1.21.0` |
| `styles/style.css` | 新增 | 新增 `.idle-clearing` 系列样式与 `clearFade` / `clearShake` / `clearLogColor` / `clearWelcome` / `clearWelcomeGlitch` 五组关键帧，以及 `.is-clearing` 下警报层、乱码层、提醒内容的「转正常态」过渡与 reduced-motion 兜底 |
| `scripts/main.js` | 修改 | 新增 `playClearAnimation()` 退出动画驱动与 `hideIdleEgg()` 收尾；`closeIdleEgg()` 改为「先播动画再关闭」；开启动画 BIOS 版本号同步为 `v1.21.0` |

### 验证方式
- 静态检查：CSS 花括号配对、新增选择器与关键帧存在性、HTML 类名与 CSS 选择器一一对应、三处版本号一致性、CHANGELOG 首条与最新标记正确。
- 运行时回归：JavaScriptCore 用可控时钟驱动完整待机流程（180 秒触发 → 开启动画 → 点击退出 → 3 秒解除动画 → 收起），断言解除层被挂上、日志逐行写入、页面在 3 秒内不关闭、到点后才移除 `revealed`，以及 reduced-motion 下立即关闭。
- 人工验收（用户）：待机 3 分钟后点「退出」，应看到约 3 秒的故障解除序列，末尾出现主色大字「不要问何意味，欢迎回来」，随后浮层淡出。

---

## [v1.20] Hero 头像旁新增「当前状态」座舱仪表盘面板

- **日期**：2026-09-17
- **作者**：katzegott

### 新增
- 用户需求：在头像**旁**添加「当前状态」，内容为「当前位置：深圳 / 状态：持续迭代中」，要求像**座舱仪表盘**，颜色风格与主体一致。
- 实现：在 Hero 区头像右侧新增一块读数面板，与头像横向并排。面板用主色 `--primary`（#ffe81a）描边、半透明黄底、四角「读数框」角标、像素字体小标题，沿用站点既有的 HUD 语言（`.mission-holo` 的 `// MISSION BRIEF`、`.holo-meta` 的「标签 + 值」两栏行）。

### 说明
- **布局调整**：原先 `.hero-avatar-wrap` 靠 `margin: 0 auto 26px` 自身居中，头像独占一行。现新增 `.hero-top` 作为横向 flex 容器（`align-items: center` + `justify-content: center` + `gap: 34px`），头像与状态板并排居中；`.hero-avatar-wrap` 的 `margin` 归零并加 `flex: none` 防止被压缩，它与下方姓名的间距改由 `.hero-top` 的 `margin-bottom` 统一控制。
- **仪表盘视觉元素**：
  - 四角读数框用 `::after` 的 8 组 `linear-gradient` 背景绘制（每个角一横一竖），不必为纯装饰再加 DOM 节点；`inset: 4px` 落在面板 padding 区域内，不遮挡文字。
  - 小标题 `// CURRENT STATUS` 沿用站点的终端注释惯例，用像素字体 `Press Start 2P`（与 `.contact-value`、BIOS 同源），配 `statusBlink`——每 5 秒一次的极短单帧闪动，模拟显示器刷新。
  - 两行读数用 `space-between` 左右分栏：左侧「当前位置 / 状态」是灰色标签，右侧是主色数值；行间以 `1px dashed rgba(255, 232, 26, 0.16)` 分隔，末行去掉分隔线与下内边距。
  - 「持续迭代中」前的指示点沿用站点「进行中」的语义色：主色填充 + `statusPulse` 呼吸（与 `.twin-dot` 同为 1.6~1.8 秒周期的 `ease-in-out` 脉冲）。
- **配色一致性**：全部取自现有 CSS 变量与同源色值——`--primary` / `--card-border` / 与 `--card` 同系的 `rgba(255, 232, 26, …)` / `--text-muted`，**未引入任何新的色相**，因此与主体黑黄赛博朋克风格一致。
- **响应式**：`.hero-top` 允许换行；视口 ≤ 560px 时状态板自动落到头像下方，并收窄为 `width: 100%; max-width: 290px`，避免小屏挤压。
- **无障碍与降级**：面板为 `role="group" aria-label="当前状态"`；纯装饰的英文小标题加 `aria-hidden="true"`。`prefers-reduced-motion: reduce` 下关闭标题闪动与指示点呼吸，静态读数照常显示。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | Hero 区新增 `.hero-top` 容器与 `.hero-status` 状态面板；两处资源版本号同步为 `1.20.0` |
| `styles/style.css` | 新增 | 新增 `.hero-top` 与 `.hero-status` 系列样式（四角角标、标题闪动、指示点脉冲、窄屏与 reduced-motion 适配）；`.hero-avatar-wrap` 间距改由父容器控制 |
| `scripts/main.js` | 修改 | 开启动画 BIOS 版本号同步为 `v1.20.0` |

### 验证方式
- 静态检查：CSS 花括号 / 圆括号配对、新增选择器存在性、HTML 类名与 CSS 选择器一一对应。
- 运行时回归：JavaScriptCore 跑开启动画与彩蛋用例，确认无运行时错误。
- 人工验收（用户）：Hero 区头像右侧显示「当前位置 深圳 / 状态 持续迭代中」，四角角标与主色发光正常；窗口缩到 ≤ 560px 时状态板换行到头像下方居中。

---

## [v1.19] 待机彩蛋：乱码铺满全屏（按视口动态计算行列）

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户需求：将待机彩蛋的红色乱码**布满全屏**。
- 问题：v1.18 的乱码层用的是写死的 `40 行 × 46 列`，实际覆盖约 `552 × 760px`。在 1920×1080 上横向只占约三分之一，右侧与下方大片空白；而且 CSS 用了 `pre-wrap` + `word-break: break-all`，长行会自行折行，导致「每行字符数」与「列数」脱钩，宽度无法精确控制。
- 实现：行列数改为**按视口尺寸动态计算**，并在布局前**实测字符尺寸**，确保任何屏幕上都是真正铺满。

### 说明
- **实测而非硬编码**：像素字体 `Press Start 2P` 在缺失时会有字体回退，不同设备的字符宽高并不一致，所以不再猜一个 `12px / 19px`。`measureCell()` 往乱码层里插一个隐藏探针（`.idle-scramble` 的字体、字号、字距、行高都由它继承），量出宽度后除以 10 得到单字符横向步进，高度即行高，量完立即移除探针。整个测量包在 `try/catch` 里，取不到布局信息时退回默认值，绝不影响彩蛋可用性。
- **行列公式**：`列数 = ceil(视口宽 / 字符步进) + 1`，`行数 = ceil(视口高 × 1.35 / 行高) + 1`。都留了 `+1` 的余量，避免边缘因取整出现一条细缝。
- **1.35 倍系数的由来**：滚动动画会把整层上移 20% 的元素高度，如果内容高度只等于视口高度，上移后底部就会露出空白。因此内容按视口的 1.35 倍生成——上移 20% 后可见区间仍完整落在内容范围内，上下都不会露白。
- **CSS 侧配套调整**：
  - `inset: -30% 0` → `inset: 0`：元素正好等于视口，多出的内容由 `overflow: hidden` 裁掉（原来是元素比视口大但不裁剪，内容又不够，所以中间一块、四周空白）。
  - `padding: 0 6vw` → `padding: 0`：字符真正抵达左右边缘。
  - `white-space: pre-wrap` + `word-break: break-all` → `white-space: pre` + `word-break: normal`：**不自动折行**，每行字符数严格等于列数，横向宽度才可控。这是「铺满」能成立的前提。
  - 新增 `will-change: transform`，让滚动动画走合成层，全屏字符动画下更省开销。
  - 不透明度 `0.3` → `0.38`：铺满后单字符变多，略提可见度，同时保持作为背景噪声不压过提醒文字。
- **窗口尺寸变化**：新增 `resize` 监听，浮层打开期间重新测量并铺满（比如旋转手机、拖拽缩放窗口）。监听器常驻但只在 `idleOpen` 为真时做事，平时零开销。
- **性能**：行列数随屏幕变大而增加，2560×1440 下约 `215 列 × 104 行 ≈ 2.2 万`字符，每 50ms 整体重写一次。字符串用数组 `join` 拼接而非逐次 `+=`，配合 `will-change` 提升到合成层，实测流畅。「快速滚动」的观感主要来自 CSS 动画，JS 的重写只负责字符内容的跳动。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | `.idle-scramble` 改为 `inset: 0` / `padding: 0` / `white-space: pre`；新增 `will-change`；提高红色不透明度 |
| `scripts/main.js` | 修改 | 第 14 段新增 `measureCell()`（实测字符尺寸）与 `layoutScramble()`（按视口算行列）；`SCRAMBLE_COLS` / `SCRAMBLE_ROWS` 常量改为可变的 `scrambleCols` / `scrambleRows`；新增 `resize` 重排；BIOS 版本号同步为 `v1.19.0` |
| `index.html` | 修改 | 版本号 `?v=1.18.0` → `?v=1.19.0`（CSS / JS 各一处） |

### 验证方式
- **静态断言（28/28 通过）**：CSS 7 项（`inset: 0` 且无 `-30%`、无 `6vw`、`white-space: pre` 且无 `pre-wrap`、溢出裁剪、`will-change`、保留滚动动画、不透明度）；JS 14 项（实测函数、10 字符探针除以 10、`try/catch` 兜底、按视口布局、读视口尺寸、1.35 系数、列/行公式、行长度与行数用动态值、旧常量已清除、`measure → layout → render` 调用顺序、`resize` 存在且仅在浮层打开时重排）；版本号 2 项。另有 5 项铺满核算。
- **铺满核算**（字符步进 12×19 下的覆盖范围，要求覆盖宽度 ≥ 视口宽、覆盖高度 ≥ 视口高 × 1.2）：

  | 视口 | 列 × 行 | 覆盖宽 × 高 | 结果 |
  | --- | --- | --- | --- |
  | 1440×900 | 121 × 65 | 1452 × 1235 | PASS |
  | 1920×1080 | 161 × 78 | 1932 × 1482 | PASS |
  | 2560×1440 | 215 × 104 | 2580 × 1976 | PASS |
  | 1280×800 | 108 × 58 | 1296 × 1102 | PASS |
  | 390×844 | 34 × 61 | 408 × 1159 | PASS |

- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js` 与 `egg-runner.js` → 全部通过，无运行时错误（测试环境无布局能力，靠 `try/catch` 兜底）。
- CSS 花括号 413/413、圆括号 794/794。

### 备注
若想微调观感：`SCRAMBLE_OVERSCAN`（余量系数）、`measureCell` 探针的字符数、`renderScramble` 的 50ms 刷新间隔、CSS 里 `.idle-scramble` 的 `font-size` / `letter-spacing` / 不透明度。改字符尺寸后行列会自动跟着变，不用手动同步。

---

## [v1.18] 待机彩蛋：3 分钟无操作触发红色警报

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户需求：增加「待机彩蛋」——监听用户交互，设定 3 分钟定时器，每次交互重置；若 3 分钟无任何操作则触发。页面效果：屏幕闪烁红色警报、快速滚动乱码、显示「何意味，你还在吗？」，要有开启动画（风格与隐藏关卡彩蛋一致）与退出按钮。
- 实现：新增全屏待机彩蛋浮层 `.idle-egg`（红色警报层 + 满屏乱码层 + 红色终端开启动画 + 大字提醒 + 退出按钮）与对应的原生待机检测逻辑。

### 重要说明：未引入 React
- 需求原文指定「使用 React `useEffect`」，但**本站是零依赖的原生 HTML/CSS/JS 站点**：没有 React，没有打包器，没有 `import` / `require`，主体是若干 IIFE，直接双击 `index.html` 即可运行。
- 为一个 3 分钟定时器引入 React（约 140KB UMD 包）会破坏「零依赖、可 `file://` 直接打开、无构建」这一整套既有约束，收益与代价不成比例。
- 因此采用**原生方式实现与 `useEffect` 完全等价的语义**，并在 `scripts/main.js` 第 14 段注释中写明一一对应关系：

  | React `useEffect` 概念 | 本项目实现 |
  | --- | --- |
  | `const t = setTimeout(fn, 180000)` | `armIdleTimer()` 内的 `setTimeout(triggerIdle, IDLE_MS)` |
  | `return () => clearTimeout(t)` | `armIdleTimer()` 开头的 `clearTimeout(idleTimer)`；`disarmIdleTimer()` |
  | 依赖数组 `[交互]` 变化时重跑 | `onActivity()` 在每次交互事件里重新挂表 |
  | 订阅/清理 | `ACTIVITY_EVENTS` 批量 `addEventListener`；定时器在触发/关闭时清理 |

  原生版还少了一层 `state → render → effect` 往返，事件回调里直接重置更即时。功能与需求完全一致，若后续站点真的改造成 React 工程，只需把这段逻辑搬进一个 `useEffect` 即可，行为不变。

### 说明
- **触发与重置**：监听 8 类交互事件（`mousemove` / `mousedown` / `pointerdown` / `wheel` / `keydown` / `scroll` / `touchstart` / `focus`），任一触发即清理并重建 3 分钟定时器（`IDLE_MS = 180000`）。浮层已打开时不再重置，避免用户「退出」时的连串动作把计时推迟。关闭浮层后自动重新挂表——继续不操作会在 3 分钟后再次提醒。
- **不打扰既有彩蛋**：若站点开启动画（`html.is-booting`）正在播放，或隐藏关卡浮层（`lycnb`）正开着，本次待机触发会跳过并重新挂表，避免两个浮层叠加。
- **红色是本段新引入的局部色**（`--alert: #ff2b2b`，仅在 `.idle-egg` 作用域内定义）。选择红色是因为「警报」需要明确的紧急语义，而站点原有的黄（主色）/ 青（副色）都已有固定含义：黄=实体与强调、青=投影与信息。红色让待机警报在语义上与前两者区分开。除此之外的配色（`--pixel-font`、`--text-muted`、方角、粗描边、硬投影）全部沿用站点变量与像素控件语言。
- **屏幕闪烁红色警报**：`.idle-alert` 用径向红色泛光叠加水平红纹，`animation: idleAlert 0.86s steps(2, end) infinite`——`steps(2, end)`（而非平滑渐变）产生硬切换的频闪感，更贴近警报灯；底色压到近黑保证提醒文字仍然可读。
- **快速滚动乱码**：`.idle-scramble` 由 JS 生成 40 行 × 46 列随机字符，每 50ms 整体重写；CSS 侧 `animation: idleScramble 1.1s linear infinite` 做 `translateY(0 → -20%)` 循环位移，两层合起来形成「字符快速向上滚动」的观感。乱码字符集包含 `!<>-_\/[]{}=+*^?#` 与十六进制字符，与隐藏关卡彩蛋同一套视觉语汇。
- **开启动画（与隐藏关卡同构）**：5 行红色终端自检日志逐行打印（每行 360ms，比隐藏关卡的 400ms 更急促）→ 其中第 2、4 行尾部乱码滚动约 0.55s 后定格为 `OK` → JS 逐帧推进的百分比进度条（`SCANNING 000% → 100%`）→ 结尾状态切为 `ARE YOU STILL HERE?` 并闪烁 + 轻微抖动。总时长约 3.6 秒。进度条推进、乱码滚动、定时器都由 JS 控制，与开启动画的纯 CSS 跳格条刻意区分。
- **退出方式**：显式的「退出」像素按钮；也可以点击浮层空白区域，或按 Esc。**Esc 沿用隐藏关卡的「双语义」**：动画播放中按 Esc 只跳过动画、不关闭浮层（避免误触直接退出）；动画结束后再按才真正关闭。关掉动画时同步清理全部 `setTimeout` / `setInterval` 并移除监听器，不留悬空定时器。
- **可访问性**：浮层带 `role="dialog"` / `aria-modal="true"` / `aria-hidden` 切换；动画结束后焦点自动移到退出按钮。
- **层级**：`z-index: 9990`——高于 Dock（200）与滚动进度条（300），低于隐藏关卡浮层（9998）、开启动画（9999）与 CRT 层（10000）。既保证警报压住页面内容，又让作为「屏幕质感」的 CRT 扫描线仍然覆盖其上。
- **`prefers-reduced-motion: reduce`**：关闭红色频闪、乱码滚动与结尾抖动，改为静态呈现；同时 JS 侧直接跳过开启动画，让彩蛋立即可用——与隐藏关卡的处理方式一致。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 新增待机彩蛋浮层 DOM（`.idle-egg` / `.idle-alert` / `.idle-scramble` / `.idle-boot` + 日志/进度条/状态 / `.idle-egg-body` / 退出按钮）；版本号 `?v=1.17.0` → `?v=1.18.0`（CSS / JS 各一处） |
| `styles/style.css` | 修改 | 新增 v1.18 段落：浮层容器与显隐、红色警报闪烁、乱码滚动、终端开启动画、提醒内容、退出按钮，以及 `idleAlert` / `idleScramble` / `idleJolt` 三组关键帧与 reduced-motion 处理 |
| `scripts/main.js` | 修改 | 新增第 14 段 `initIdleEgg`（待机检测 + 彩蛋动画与退出）；BIOS 版本号同步为 `v1.18.0` |

### 验证方式
- **静态断言（40/40 通过）**：DOM 11 项（浮层/警报层/乱码层/动画终端/日志/进度条/状态/提醒区/指定字样/退出按钮/无障碍语义）；CSS 14 项（全屏固定、层级 9990 且低于 9998、显隐、红色闪烁、乱码滚动与 1.1s 周期、动画终端、收尾淡出、逐帧进度条、结尾闪烁、内容淡入、退出按钮像素风格与反色、reduced-motion）；JS 13 项（`IDLE_MS = 180000`、8 类事件订阅、先清理再重建、`setTimeout` 触发、清理函数、关闭后重新挂表、注释标明 `useEffect` 等价、开启动画期间跳过、隐藏关卡互斥、Esc 双语义、动画结束移除监听器、零 React 依赖、rAF 裸调用）；版本号 2 项。
- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js` 与 `egg-runner.js` → 全部通过，无运行时错误。监听器基线由 2 增至 4，确认待机彩蛋的订阅已正确注册。
- CSS 花括号 413/413、圆括号 793/793。

### 备注
3 分钟是最长的一段静默期，手动等待不便；预览时可在 `scripts/main.js` 第 14 段把 `IDLE_MS = 180000` 临时改成 `10000`（10 秒）快速验证，验证完记得改回并同步版本号。

---

## [v1.17] 项目区改造：MISSION 任务列表 + 悬停「全息投影」简报面板

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户需求：把项目展示改成一排排带有 `[MISSION_01]`、`[MISSION_02]`、`[MISSION_03]` 前缀的列表；鼠标悬停时，在该条目**右侧**弹出一个悬浮的「全息投影」面板显示详细描述，风格与整体一致。
- 实现：原三张并列卡片（`.projects-grid` / `.project-card`）替换为 `.missions` → `ol.mission-list` → `li.mission` 任务行；每条任务行内置一块 `.mission-holo` 全息面板；同时清理了旧卡片的全部样式引用。

### 说明
- **纯 CSS 驱动，未新增任何脚本**：面板显隐完全由 `:hover` 与 `:focus-within` 控制，不依赖 JS 事件。`pointer-events: none` 让隐藏面板不拦截鼠标；`:focus-within` 则让键盘用户 Tab 到任务行时同样能看到简报，无需为可访问性额外写代码。
- **配色的语义分工**：任务行沿用站点主色黄（`--primary`）的 8-bit 像素控件语言——实心底 `#0c0c0c`、3px 黄描边、左上高光/右下暗部的 bevel、硬投影，代表「实体」；弹出的面板则改用副色青（`--accent`），代表「投影出来的光」。黄与青的对比让「全息」在视觉上一眼可辨，同时两者都是站点既有配色，不引入第三种颜色。
- **全息质感的构成**：① 青色半透明玻璃底 + `backdrop-filter: blur(8px) saturate(140%)`；② 上下渐变提亮（`rgba(0,240,255,.10)` → `.02`）；③ 2px 青色发光描边；④ 内辉光 `inset 0 0 26px` + 外辉光 `0 0 20px`；⑤ 与 v1.16 一脉相承的 **CRT 水平横纹**（1px / 3px 周期），让面板看起来像真的在「扫描成像」；⑥ 左侧一枚 45° 方块只留左、下描边，形成指向任务行的连接三角。
- **入场动效**：默认 `opacity: 0` + `visibility: hidden` + `translateX(-14px) scale(0.97)`（以左中为原点），悬停时滑到位并放大到 1。位移方向与「从任务行右侧展开」的物理直觉一致。
- **布局核算（避免溢出）**：`.missions` 限宽 600px，面板宽 320px，加上 18px 间隙共需 **938px**；容器 `.container` 为 `max-width: 1020px` + 左右各 22px 内边距，可用 **976px**，余 38px。`body` 仅有 `overflow-x: hidden`，而各 `.section` / `.container` 都没有 `overflow: hidden`，因此浮出面板不会被裁剪。
- **响应式**：`@media (max-width: 1139px), (hover: none)` 时改为**内联常显**——面板 `position: static` + `flex: 1 0 100%` 换行独占一整行，`::before` 三角隐藏。这样窄屏与触摸设备（无悬停能力）上信息不会丢失，也不依赖悬停才能阅读。
- **`prefers-reduced-motion: reduce`**：去掉行位移与面板淡入，直接显示。

### 关键修复
- `scripts/main.js` 的 `HOVER_SELECTOR` 原本列出 `.project-card`，用于让自定义四芒星光标在可交互卡片上放大。项目区改用 `.mission` 后**必须同步替换**，否则鼠标移到新任务行上光标不会再触发悬停态。这是本次唯一一处 JS 改动，虽小但漏改会导致交互退化。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 项目区 DOM 重写：`.projects-grid` 三卡片 → `.missions` / `ol.mission-list` / 3 条 `li.mission`（编号 + 名称 + 状态 + `.mission-holo` 简报面板）；副标题改为「悬停查看任务简报」；版本号 `?v=1.16.0` → `?v=1.17.0`（CSS / JS 各一处） |
| `styles/style.css` | 修改 | 新增 v1.17 段落（`.missions` / `.mission` / `.mission-id` / `.mission-name` / `.mission-status` / `.mission-holo` / `.holo-head` / `.holo-desc` / `.holo-meta` + 响应式与 reduced-motion）；**移除** `.projects-grid`、`.project-card` 及其 `::before`/`::after`/`h3`/`p`、`.project-icon` 的定义，并从 6 处组合选择器中摘掉 `.project-card` |
| `scripts/main.js` | 修改 | `HOVER_SELECTOR` 中 `.project-card` → `.mission`；BIOS 版本号同步为 `v1.17.0` |

### 验证方式
- **静态断言（30/30 通过）**：DOM 侧 11 项（容器/有序列表/3 条条目/三个编号前缀/3 块面板/简报标题/描述/要素列表/旧结构已移除）；CSS 侧 15 项（绝对定位、右侧 `calc(100% + 18px)`、默认隐藏、玻璃模糊、青色描边与内辉光、CRT 横纹、宽 320px、列表限宽 600px、悬停显示、`:focus-within`、连接三角、窄屏内联、reduced-motion、无 `.project-card` 残留）；JS 侧 2 项（`HOVER_SELECTOR` 已含 `.mission`、已无 `.project-card`）；布局 2 项（938 < 976 不溢出、断点覆盖）。
- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js` 与 `egg-runner.js` → 全部通过，无运行时错误。
- CSS 花括号 381/381、圆括号 751/751。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

### 备注
面板内的详细描述文案仍为占位内容（`[MISSION_02]` / `[MISSION_03]` 明确标注「待填充」），待有真实项目后替换即可，无需改动样式。

---

## [v1.16] CRT 屏幕投影感：极淡水平扫描线 + 微弱噪点

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户需求：在现有黄色正弦波（`canvas#waveBg`）的基础上，**叠加一层极其淡的水平扫描线**（像老式 CRT 显示器），并给**整个页面**加一点**微弱的噪点滤镜**，让整页看起来像真正的屏幕投影。
- 实现：新增覆盖层 `html::after`，同时承载「静止细密水平暗线」与「极弱灰噪点」两层背景。

### 说明
- **与已有扫描线的关系**：站点此前已经有一层扫描线（`body::after`，`z-index: 320`），但它的特征是**每 6px 一组、带黄色调、并以 9 秒周期缓慢移动**——那属于「氛围流光」，不是 CRT 的物理扫描线。本次**没有改动它**，而是另外新增一层**静止的**细密暗线（1px 暗线 / 3px 周期）。两者叠加后：旧的负责缓慢流动的氛围，新的负责「显示器本身」的质感。
- **零 DOM 改动**：`body::before`（网格 + 像素点阵）与 `body::after`（动态扫描线）都已被占用，所以新层用了一直空着的 `html::after`，配合 `position: fixed` 覆盖全屏，不需要往 `index.html` 里加任何元素。
- **噪点为什么不用 `filter`**：直接对全页套 `filter: url(#noise)` 会让浏览器**每帧重新计算整页栅格**，滚动时开销很大。这里改用内联 SVG `feTurbulence` 生成一张 160×160 的噪点图并平铺：`stitchTiles='stitch'` 保证接缝无缝，`feColorMatrix type='saturate' values='0'` 去掉彩色噪点只留灰阶，`<rect opacity='0.2'>` 控制强度。这样只是一张静态背景图，浏览器会缓存，性能开销可忽略——视觉上等同于「噪点滤镜」，但没有滤镜的代价。
- **层级设计**：`z-index: 10000`，位于 `9998`（彩蛋浮层）与 `9999`（开启动画）之上，因此质感会统一覆盖所有画面，包括彩蛋浮层和 CRT 开机自检（后者与扫描线在语义上正好呼应）；同时又低于 `10001`（拖尾粒子）与 `10002`（光标本体），避免光标被噪点糊掉。
- **为什么用暗线**：站点底色接近纯黑，暗线在黑底上几乎不可见，只在**黄色波形与亮内容**上显现出来——这正是真实 CRT 的特征，也让扫描线自带「只在有画面处出现」的合理性。
- **不影响交互**：整层 `pointer-events: none`，纯装饰；因为不涉及动画，也无需针对「减弱动态效果」做额外处理。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | 末尾新增 `html::after`：CRT 静止水平扫描线（`repeating-linear-gradient`，`rgba(0,0,0,0.14)`，1px/3px）+ 内联 SVG 灰噪点（`feTurbulence` + `stitchTiles` + 去饱和，`opacity 0.2`，160px 平铺）；`z-index: 10000`、`pointer-events: none` |
| `index.html` | 修改 | 静态资源版本号 `?v=1.15.0` → `?v=1.16.0`（CSS / JS 各一处） |
| `scripts/main.js` | 修改 | 开启动画自检首行的 BIOS 版本号同步为 `v1.16.0` |

### 验证方式
- **CSS 断言（15/15 通过）**：`html::after` 已定义、噪点为内联 SVG `feTurbulence`、`stitchTiles` 无缝平铺、已去饱和、强度 `opacity 0.2`、扫描线为静止 `repeating-linear-gradient`、色值 `rgba(0,0,0,0.14)`、周期 1px/3px、噪点 tile 160px、`pointer-events: none`、`z-index: 10000`、层级高于彩蛋(9998)/开机(9999)、层级低于拖尾(10001)/光标(10002)、**旧的动态扫描线参数（6px 周期 + scanMove）原样保留未被破坏**。
- **内联 SVG URL 编码验证**：把 `data:image/svg+xml` 解码回原始 SVG 并校验结构完整（这是最容易出错、一旦出错会导致整层噪点完全不显示的地方）。
- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js`（开启动画正常收束并移除自身）与 `egg-runner.js`（口令解锁、动画 ≥ 4 秒、Esc「先跳过、后关闭」、监听器回落）→ 全部通过，无运行时错误。
- CSS 花括号 362/362、圆括号 714/714。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.15] 四芒星光标改为青色，与按钮点亮色区分

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户反馈：光标悬停在可交互元素上变成四芒星时，颜色与按钮被点亮（悬停 / 激活）时的黄色是同一种，两者叠在一起容易糊成一片、层次不清。要求**换成不是同一种黄色**，同时保持与整体风格一致。
- 实现：四芒星由黄色 `--primary` 改为青色 **`--accent`（`#00f0ff`）**，外发光同步改青。

### 说明
- **为什么选青色**：`--accent` 不是新造的颜色，而是 `:root` 里早就定义好的**站点副色**，已经在多处使用——顶部滚动进度条渐变（黄 → 青）、拖尾粒子里的 `alt` 青色碎块、若干处文字强调。所以改成青色既满足「不与按钮点亮色相同」，又天然「与整体风格一致」，且没有引入第三种颜色。
- **与外圈光环呼应**：光标的缓动外圈 `.cursor-ring` 本来就是青色（`rgba(0, 240, 255, 0.75)`）。悬停时四芒星会把外圈淡出（`opacity: 0`），此时青色四芒星正好接替青色外圈的视觉角色，切换更连贯。
- **只改悬停态，不动常态**：中心点常态（未悬停）仍然是**黄色**黄点，只有 `.cursor-dot.is-hover::before`（四芒星伪元素）改成青色。鼠标在普通区域移动时，光标依旧是熟悉的黄色。
- **外发光改法**：四芒星用 `clip-path` 裁形，会裁掉 `box-shadow`，所以外发光一直靠 `filter: drop-shadow()`（两层）。本次把两层的颜色从 `rgba(255, 232, 26, …)` 一并改成 `rgba(0, 240, 255, …)`，与 `.cursor-ring` 的写法保持一致（`drop-shadow` 无法直接吃带透明度的 CSS 变量，故沿用硬编码 rgba）。
- **按下状态**：`.cursor-dot.is-hover.is-down` 只改尺寸，颜色继承，无需额外改动。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | `.cursor-dot.is-hover::before`：`background: var(--primary)` → `var(--accent)`；两层 `drop-shadow` 由黄改青 |
| `index.html` | 修改 | 静态资源版本号 `?v=1.14.0` → `?v=1.15.0`（CSS / JS 各一处） |
| `scripts/main.js` | 修改 | 开启动画自检首行的 BIOS 版本号同步为 `v1.15.0` |

### 验证方式
- **配色断言（8/8 通过）**：
  - 四芒星已用 `var(--accent)`、不再含 `var(--primary)`、光晕为 `rgba(0, 240, 255, …)`、无残留黄色光晕
  - 按钮点亮（`.dock-link:hover / .active .dock-icon`）仍为 `background: var(--primary)` → **与四芒星不同色**
  - 常态中心点仍为黄色（未受影响）
  - 外圈光环仍为青色（与四芒星同色呼应）
  - 拖尾 `alt` 粒子仍为 `var(--accent)`
- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js`（开启动画正常收束并移除自身）与 `egg-runner.js`（口令解锁、动画 ≥ 4 秒、Esc「先跳过、后关闭」、监听器回落）→ 全部通过，无运行时错误。
- CSS 花括号 361/361、圆括号 705/705。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.14] Dock 栏整体深色半透明毛玻璃底板

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户需求：给整个 Dock 栏加一块**整体的深色半透明毛玻璃底板**，且必须**与现有风格一致**。
- 实现：把 Dock 外壳从 v1.9c 的「实心像素面板」改回毛玻璃，但**保留全部像素语言**，并不是回到早期 macOS 拟物风格。

### 说明
- **背景为什么变成半透明**：v1.9c 做像素化时把 Dock 外壳改成了 `background: #0c0c0c` 的实心面板，并显式写死 `backdrop-filter: none`。本次把底色改为 `rgba(8, 8, 8, 0.6)`（滚动后 `rgba(4, 4, 4, 0.76)`），并开启 `backdrop-filter: blur(12px) saturate(150%)`（含 `-webkit-` 前缀）。背后的网格背景与 Canvas 黄色正弦波会透出来并被虚化，`saturate` 让透出的黄色更有电。
- **与现有风格一致的做法**：毛玻璃只作用在「底色」这一层，像素语言一个都没丢——
  - 方角：`border-radius: 0`
  - 3px 黄色实描边：`border: 3px solid var(--primary)`
  - bevel 内阴影：左上黄 `0.16` / 右下黑 `0.72`
  - 底部硬投影：`0 8px 0 rgba(255, 232, 26, …)`（无模糊、无扩散）
  - 额外叠一层 `repeating-linear-gradient` 的 **1px 黄色扫描线**纹理（3px 周期），避免玻璃感冲淡 8-bit 味道，也更贴合站点的 CRT 主题
- **滚动状态**：`.dock.scrolled` 仍然保留，只是把底色加深到 `rgba(4, 4, 4, 0.76)` 并加强描边与硬投影，保证页面滚到内容区时图标与背景的对比度。
- **图标依然实心**：`.dock-icon` 保持 `background: #141414`，没有跟着半透明。这样图标按键在玻璃底板上仍有清晰的实体边界，也更符合像素按键的观感。
- **移动端无需额外改动**：旧的 `@media (max-width: 640px)` 中 `border-radius: 20px` 早已被 v1.9c 的 `border-radius: 0` 覆盖（同优先级、后者位置在后），v1.9c 自己的移动端小节也只调整 padding，毛玻璃在窄屏同样生效。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | v1.9c 第 1 节 Dock 外壳：实心 `#0c0c0c` → 深色半透明毛玻璃（`rgba(8,8,8,0.6)` + `blur(12px) saturate(150%)`）+ 1px 黄色扫描线纹理；`.dock.scrolled` 底色加深为 `rgba(4,4,4,0.76)`；方角 / 黄描边 / bevel / 硬投影全部保留 |
| `index.html` | 修改 | 静态资源版本号 `?v=1.13.0` → `?v=1.14.0`（CSS / JS 各一处） |
| `scripts/main.js` | 修改 | 开启动画自检首行的 BIOS 版本号同步为 `v1.14.0` |

### 验证方式
- **样式断言**：毛玻璃 `blur(12px)`、深色半透明底色、滚动态半透明、1px 扫描线纹理、3px 黄描边、bevel + 硬投影、方角、实心底色已移除、无 `backdrop-filter: none` → **9 项全部通过**。
- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js`（开启动画正常收束并移除自身）与 `egg-runner.js`（口令解锁、动画 ≥ 4 秒、Esc「先跳过、后关闭」、监听器回落）→ 全部通过，无运行时错误。
- CSS 花括号 361/361、圆括号 705/705。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.13] 开启动画播放期间隐藏鼠标光标

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户反馈：站点开启动画（BIOS 自检）播放时，鼠标箭头出现在黑色自检画面上很突兀，希望动画期间把光标藏起来。
- 实现：动画播放期间**原生指针与自定义霓虹光标一并隐藏**，动画结束（含用户点击 / 按键跳过）后自动恢复，**不新增任何 JS 状态**。

### 说明
- **复用现有状态类**：`index.html` 的内联脚本早于首次渲染就给 `<html>` 加上 `is-booting`（仅在未开启「减弱动态效果」时添加），动画结束时由 `releaseScroll()` 移除。本次只用 CSS 挂在这个类上，因此隐藏 / 恢复与动画生命周期天然同步，不需要额外的事件监听或定时器。
- **两类指针都覆盖**：
  - **原生指针**：`cursor: none !important` 挂在 `html.is-booting` 及其所有后代上。这样即使用户还没移动过鼠标（尚未进入 `has-cursor` 状态、页面仍在用系统箭头），或者指针正悬停在链接 / 按钮上（浏览器默认显示手型），也一律不显示。
  - **自定义光标**：`.cursor-dot` / `.cursor-ring` / `.cursor-trail` 置为 `opacity: 0 !important`。此处必须用 `!important`，因为显隐是 JS 直接写在内联 `style` 上的（首次 `mousemove` 时置为 `opacity: "1"`），内联声明优先级高于普通类选择器。
- **恢复后位置正确**：`mousemove` 期间只更新光标的 `transform` 定位，`opacity` 仅首次移动时写入一次。所以动画期间鼠标即使一直在动，动画结束后光标也会立刻出现在正确位置，不会停留在旧坐标。
- **新增兜底**：`index.html` 内联脚本在添加 `is-booting` 的同时注册一个 8.5 秒 `setTimeout` 强制移除该类。若主脚本异常未能结束动画，可避免「滚动锁定 + 光标永久消失」这种会让用户误以为鼠标坏了的状态；该超时与 `styles/style.css` 中 `.boot` 的 8 秒纯 CSS 兜底动画相呼应。动画正常结束时它只是移除一个已不存在的类，无副作用。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | 开启动画段新增「1b. 动画播放期间隐藏鼠标指针」：`html.is-booting` 及其后代 `cursor: none !important`，三个光标元素 `opacity: 0 !important` |
| `index.html` | 修改 | 内联脚本新增 8.5 秒兜底 `setTimeout` 解除 `is-booting`；静态资源版本号 `?v=1.12.0` → `?v=1.13.0`（CSS / JS 各一处） |
| `scripts/main.js` | 修改 | 开启动画自检首行的 BIOS 版本号同步为 `v1.13.0` |

### 验证方式
- **静态断言**：`html.is-booting *` + `cursor: none !important`、三个光标元素的隐藏规则、`opacity: 0 !important`、HTML 侧 `8500` 兜底定时器 → 全部通过。
- **回归测试**：JavaScriptCore + DOM stub 重跑 `boot-runner.js`（开启动画走到 4050ms 正常收束并移除自身）与 `egg-runner.js`（口令解锁、彩蛋动画 ≥ 4 秒、Esc「先跳过、后关闭」、监听器回落）→ **全部通过，无运行时错误**。
- CSS 花括号 361/361、圆括号 693/693；JS 花括号 147/147、圆括号 504/504。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.12] 彩蛋浮层不再遮挡自定义光标

- **日期**：2026-09-10
- **作者**：katzegott

### 修复
- **问题**：彩蛋浮层 `.easter-egg` 的层级是 `z-index: 9998`，开启动画 `.boot` 是 `9999`，而自定义霓虹光标只有 `z-index: 500`（拖尾粒子 `490`）。浮层一弹出就把全屏遮罩铺到了光标之上，**鼠标指针看起来整支“消失”**（光标 DOM 仍在，只是被盖住）；站点开启动画播放期间同样如此。
- **修复**：把光标相关元素的层级提到所有遮罩层之上——
  - `.cursor-dot` / `.cursor-ring`：`z-index: 500` → **`10002`**
  - `.cursor-trail`：`z-index: 490` → **`10001`**
  - 层级顺序：拖尾（10001）< 光标主体（10002），两者均**高于**彩蛋浮层（9998）与开启动画（9999）。
- 光标元素本就带 `pointer-events: none`，提升层级**不会**拦截浮层内的关闭按钮、输入框或链接点击。

### 说明
- 采用固定的 `10001` / `10002`，而不是“刚好超过 9999”，是为了给之后可能新增的全屏层（提示条、加载遮罩等）留出安全间距，避免同类问题再次出现。
- 光标属于「指针反馈」，语义上应始终位于内容之上，因此不随浮层开关动态增删层级，而是恒定保持最顶层。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | `.cursor-dot` / `.cursor-ring` 层级 `500` → `10002`，`.cursor-trail` 层级 `490` → `10001`，并补注释说明与各遮罩层的层级关系 |
| `index.html` | 修改 | 静态资源版本号 `?v=1.11.0` → `?v=1.12.0`（CSS / JS 各一处） |
| `scripts/main.js` | 修改 | 开启动画自检首行的 BIOS 版本号同步为 `v1.12.0` |

### 验证方式
- **层级不变量断言**：`.cursor-trail` 与 `.cursor-dot/.cursor-ring` 的 `z-index` 均严格大于彩蛋浮层（9998）与开启动画（9999）→ 通过。
- JavaScriptCore + DOM stub 重跑 `scripts/main.js`：**无运行时错误**；口令解锁、动画时长 ≥ 4 秒、Esc「先跳过、后关闭」、监听器回落等既有用例**全部通过**（无回归）。
- CSS 花括号 359/359、圆括号 693/693；JS 花括号 147/147、圆括号 504/504；`index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.11] 彩蛋开启动画：终端解密序列

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 用户反馈：给彩蛋板块的**开启**做一个动画，风格参考站点的开启动画，**但不能一致**，且**总时长至少 4 秒**。
- 实现：解锁隐藏关卡（连打 `lycnb`）后，浮层内先播放一段**约 4.6 秒**的「密钥解密」终端动画，动画结束后输入区才淡入并自动聚焦。

#### 与站点开启动画（BIOS 自检）的刻意区分
| 维度 | 站点开启动画 | 彩蛋开启动画 |
| --- | --- | --- |
| 主题 | BIOS 自检（MEMTEST / SHADER LOAD） | 密钥解密 / 隐藏关卡装载 |
| 起手 | 电子枪亮点横向展开再纵向铺满 | 遮罩直接压黑（无亮点），扫描线下扫 |
| 主色 | 黄色 `--primary` | **青色 `--accent`**，收尾才转黄 |
| 日志 | 静态逐行打印 | 两行含**逐帧乱码滚动**的解密日志 |
| 进度 | 纯 CSS `steps()` 跳格黄条 | **JS 逐帧推进**的青色条 + 百分比数字 |
| 结尾 | 收束成一条水平亮线熄灭 | `ACCESS GRANTED` 闪烁抖动 + 扫描线扫过 |

#### 时间线（相对解锁时刻）
| 时间 | 内容 |
| --- | --- |
| 0.00s | 遮罩淡入、面板弹出，终端层亮起 |
| 0.30s 起 | 日志逐行打印，每行间隔 **400ms**，共 5 行 |
| 0.36s / 1.76s | 第 2、5 行进入“解密中”，尾部乱码滚动约 0.6s 后定格为 `OK` |
| 2.35s | 进度条启动，JS 每 34ms 推进一次并显示 `LOADING 000%` |
| 3.50s | 进度条收尾至 100%，状态切换为 `ACCESS GRANTED`（黄字闪烁 + 故障抖动） |
| 3.90s | 扫描线自上而下扫过终端区 |
| 4.50s | 动画收束（`.is-done`），输入区淡入（0.4s）并聚焦 |
| **合计** | **约 4.6 秒**（满足“至少 4 秒”） |

### 说明
- **可跳过**：动画播放期间**点击终端区或按 Esc** 会立即跳过动画（`.is-done` + 输入区显示），**不会**关闭浮层；动画结束后 Esc 才恢复为关闭浮层。两者通过 `bootRunning` 标志区分。
- **可访问性**：`prefers-reduced-motion: reduce` 时完全跳过动画（不打印日志、不闪屏），直接显示输入区；CSS 侧同时关闭闪烁、抖动与扫描线。
- **重复打开**：每次打开浮层都会重播动画，`playEggBoot()` 开头会把日志、进度条、类名复位，不会残留上一次的状态。
- **不外泄定时器**：所有 `setTimeout` / `setInterval` 句柄集中登记，跳过或结束（含动画中被关闭）时统一清理，不会在浮层关闭后继续跑。
- 浮层保留 `role="dialog"` / `aria-hidden` 切换，动画层标 `aria-hidden="true"`，屏幕阅读器不会朗读闪烁中的乱码文本。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 面板内新增 `.egg-boot` 终端层（日志 / 进度条 / 状态），并把标题、表单、提示包进 `.easter-egg-body`；静态资源版本号 `?v=1.10.0` → `?v=1.11.0` |
| `styles/style.css` | 修改 | 新增 v1.11 段：输入区淡入、终端层样式、JS 驱动的进度条、`ACCESS GRANTED` 闪烁与 `eggGlitch` 抖动、`eggSweep` 扫描线、`prefers-reduced-motion` 退化 |
| `scripts/main.js` | 修改 | 新增 `playEggBoot()` 解密序列与跳过逻辑，`openEgg()` / `closeEgg()` 接入动画生命周期，Esc 支持“先跳过、后关闭”；开启动画自检首行的 BIOS 版本号同步为 `v1.11.0` |

### 验证方式
- CSS 大括号平衡（359/359）、小括号平衡（691/691）通过；HTML 标签配对检查通过；JavaScript 花括号平衡（147/147）。
- JavaScriptCore + DOM stub 执行 `scripts/main.js`，无运行时错误。
- **彩蛋专项测试**（可控事件桩 + 新增 `setInterval` 可控时钟）全部通过：
  - 误触发防护：输入框内打字 / 带 `Ctrl` / 缓冲超时后拼接 → 均**不解锁**；依次连打 `lycnb` → 解锁且 `aria-hidden="false"`。
  - 开启动画：`+0.4s` 已打印 1 行日志；`+4.0s` 与 `+4.3s` 时输入区仍隐藏（证明时长 ≥ 4 秒）；`+4.6s` 时 `egg-ready` 与 `is-done` 就位、日志共 5 行、进度条 100%。
  - 跳过语义：动画中按 Esc → 输入区显示且浮层**仍打开**；再按 Esc → 浮层关闭。
  - 重开复位：再次解锁时 `egg-ready` 被清空，动画重新播放。
  - 资源清理：动画结束后 `keydown` / `pointerdown` 监听数均回落到基线。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.10] 彩蛋板块升级为「隐藏关卡」浮层

- **日期**：2026-09-10
- **作者**：katzegott

### 修改
- **彩蛋从「页面最底部常驻区块」改为「键盘解锁的固定浮层」**：
  - **常态隐藏**：`.easter-egg` 默认 `display: none`，整块不占文档流，页脚下方不再出现任何入口。
  - **口令解锁**：在键盘上**依次连打 `l` `y` `c` `n` `b`** 后弹出浮层；口令缓冲空闲 1.5 秒自动清空，避免“分几次输入被拼成口令”。
  - **固定浮层**：改为 `position: fixed` 全屏遮罩 + 居中像素面板（3px 黄框、内嵌高光/暗部、硬投影、两级台阶切角），弹出时带 `steps()` 跳格感的缩放淡入。
  - **退出方式**：右上角 `×` 关闭按钮、点击面板外遮罩、按 `Esc`，三种方式均可关闭。
  - **保留原有暗号玩法**：浮层内输入「梦想即力量」仍然点亮面板并跳转到原目标页面，错误时抖动提示不变。

### 说明
- **误触发防护（AI-generated）**：口令只在“真正空闲的键盘输入”下累计，以下情况一律忽略或清空缓冲——① 焦点在 `input` / `textarea` / `select` / `contenteditable` 中打字；② 输入法组字中（`isComposing`）；③ 带 `Ctrl` / `Meta` / `Alt` 修饰键；④ 开启动画播放期间（`is-booting`）；⑤ 非单字符按键（`Shift`、方向键等）。
- 为避免口令字母被开启动画的「按键跳过」逻辑吞掉，口令监听在动画播放期间直接忽略；动画结束后重新连打口令即可。
- 原 `.easter-egg::before` 的「// 隐藏暗号」改为真实元素 `.easter-egg-title`，以便命中暗号时单独点亮，并对屏幕阅读器更友好（浮层使用 `role="dialog"` + `aria-hidden` 切换）。
- 按用户要求，本功能**不提供移动端入口**（触屏设备无物理键盘，无法触发）。
- 浮层层级 `z-index: 9998`，低于开启动画层（`9999`），两者不会互相遮挡。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 彩蛋 DOM 改为浮层结构（遮罩 + 面板 + 标题 + 关闭按钮），补充 `role="dialog"` / `aria-hidden`；静态资源版本号 `?v=1.9.8` → `?v=1.10.0` |
| `styles/style.css` | 修改 | `.easter-egg` 改为固定浮层（默认隐藏）、新增面板/标题/关闭按钮样式与弹出动画、命中态改为点亮面板、`prefers-reduced-motion` 退化处理 |
| `scripts/main.js` | 修改 | 第 10 段扩展：新增键盘连打口令解锁、浮层开关与误触发过滤（原暗号提交逻辑保留） |

### 验证方式
- CSS 大括号平衡（333/333）、小括号平衡（669/669）检查通过；HTML 标签配对检查通过（div / span / pre / p / button / form / section / footer）。
- JavaScriptCore + DOM stub 执行 `scripts/main.js`（花括号平衡 126/126），无运行时错误。
- **彩蛋专项测试**（可控事件桩 + 虚拟时钟）：① 焦点在输入框内键入 `lycnb` → **不解锁**；② 带 `Ctrl` 修饰键 → **不解锁**；③ 缓冲超时后剩余字符 → **不解锁**；④ 依次连打 `lycnb` → 浮层加 `.revealed`、`aria-hidden` 变 `false`；⑤ 按 `Esc` → `.revealed` 移除、`aria-hidden` 变 `true`；⑥ 关闭按钮与遮罩点击监听各注册 1 个。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.9] 加入像素风格（Pixel / 8-bit）

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 在原有赛博朋克黑黄霓虹基调上叠加**像素质感**（二者同属复古未来主义，风格协调）：
  - **像素字体**：引入 Google Fonts 的 `Press Start 2P`，应用于英文与数字点缀（技能百分比、`BETA` 徽章、页脚 `Powered by Vibe Coding`、年份、邮箱）。该字体仅含拉丁字形，**中文自动回退**到系统字体，不影响阅读。
  - **像素英文小标**：5 个分区标题上方新增青色像素字母标注（`ABOUT` / `SKILLS` / `PROJECTS` / `CONTACT` / `DIGITAL TWIN`）。
  - **像素台阶切角**：把卡片 / 按钮原本的斜切角改成**两级台阶**（8-bit 阶梯）——「关于我」卡片 24px、项目与联系卡片 16px、按钮与联系图标 8px。
  - **像素硬阴影**：卡片改用无模糊的实心偏移阴影，并随悬停加深；技能条目使用实心 `box-shadow` 偏移。
  - **点阵纹理**：背景在原有 44px 网格之上再叠加一层 22px 像素点阵；分区标题下划线改为像素虚线块；顶部滚动进度条改为黄/青像素分段拼接。
  - **8-bit 实体控件（追加）**：把**文字框与按钮**从「液态玻璃」改为实体像素控件——实心深色底、3px 粗像素描边、内嵌高光/暗部（bevel 立体感）、硬投影；按钮按下时整体位移 `translate(4px, 4px)` 并缩短投影，还原街机按钮手感。覆盖范围：
    - **文字框 / 卡片**：简介卡片、项目卡片、联系卡片、技能条目、数字孪生窗口（20px 斜切角同步改为两级 10px 台阶）、图标方块、标签。
    - **按钮**：主按钮 / 描边按钮（主按钮为黄底黑字实心块）、快捷提问按钮、发送按钮、返回顶部、彩蛋提交按钮。
    - **输入框**：数字孪生输入框、彩蛋暗号输入框（深色实心 + 内凹阴影，聚焦时描边点亮）。
    - **对话气泡**：机器人 / 用户气泡改为像素描边。
    - 同时**移除上述控件上的 `backdrop-filter` 毛玻璃**（悬浮 Dock 除外，见下方说明）。
    - **装饰像素化**：简介卡片左上角的黄色横线改为像素虚线段，左侧竖线改为像素虚线点柱。
    - **底部悬浮 Dock**：外壳毛玻璃改为实心像素面板（3px 黄框 + bevel 立体 + 底部硬投影），图标按键改方角像素键并在悬停 / 激活时翻转为黄底黑字，分隔线改像素虚线竖条，当前分区指示点由圆点改为像素方块，名称气泡改像素描边 + 硬投影。「图标邻近放大」动效保留。
    - **背景动态正弦波（追加）**：全站背景新增**动态黄色正弦波**——`index.html` 加入 `<canvas id="waveBg">`，由 `scripts/main.js` 用 Canvas 2D 绘制 **3 条**频率 / 振幅 / 相位各不相同的**缓慢流动正弦曲线**（纯黄色 `rgba(255, 232, 26, ·)`，带轻微辉光），叠在网格背景之上、页面内容之下。**波长经两轮收敛调整**：条数由 4 条精简为 3 条；屏幕内周期数先由 1.3–2.4 提高到 3.0–5.2，再进一步提高到 **7 / 8 / 9**（1440px 宽下波长约 160–206px，约为初版的 1/4），**三条波均**调整为陡峭尖锐的形态。实现细节与边界处理见下方「说明」。
  - **复古 CRT 开启动画（追加）**：页面首次加载时播放约 4.5 秒的**开机自检**动画（节奏刻意放慢，便于看清逐行自检过程）——全屏黑场中电子枪亮点先横向展开、再纵向铺满整屏，随后 BIOS 自检文字逐行打印（6 行，每行间隔 170ms，末尾状态以青色 `[ OK ]` 标注），像素进度条以 24 格跳格走满，显示品牌名 `LIU YUCHEN` 与闪烁方块光标，最后整屏收束成一条水平亮线熄灭。配色沿用黑底 + 黄 + 青，并叠加 CRT 扫描线纹理与暗角。点击 / 按键 / 触摸可跳过，`?noboot` 可手动禁用。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 字体链接加入 `Press Start 2P`；5 个分区标题加入像素英文小标；新增背景波形画布 `<canvas id="waveBg">`；新增开启动画 DOM 与「播放期间锁滚动」内联脚本（含 `<noscript>` 兜底） |
| `styles/style.css` | 修改 | 新增 v1.9 像素风格层（像素字体、台阶切角、硬阴影、点阵纹理）、v1.9b 实体 8-bit 控件层、v1.9c Dock 像素化、v1.9d 波形画布定位与分区透明化、v1.9e 开启动画样式 |
| `scripts/main.js` | 修改 | 新增第 12 段：用 Canvas 绘制 3 条短波长、更陡峭的黄色正弦波背景；新增第 13 段：开启动画（逐行打印 / 进度条 / 跳过逻辑） |

### 说明
- **中文为什么不用像素字体**：Google Fonts 没有可用的简体中文像素字体；若改用日文像素字体（如 DotGothic16），简体字会因缺字回退，且日文字形与简体写法不一致。因此像素感由**形状、阴影、纹理与英文标注**承担，中文保留原字体以保证可读性。
- 因 `clip-path` 会裁掉 `box-shadow`，卡片硬阴影改用 `filter: drop-shadow()`（模糊半径为 0 即为硬边）。
- 像素字体加载失败时会自动回退到等宽 / 系统字体，页面不会损坏。
- 保留既有的扫描线、霓虹光晕与悬浮 Dock，像素元素为叠加层，不影响原有交互。
- **悬浮 Dock 已一并像素化**（外壳、图标键、分隔线、指示点、名称气泡）；其「图标邻近放大」的 JS 动效未改动，像素化只替换外观。
- 按钮按下位移使用 `steps(2, end)` 缓动，位移呈现「跳帧」感，更接近 8-bit 主机的手感。
- **静态资源带版本号**：`index.html` 中 `styles/style.css` 与 `scripts/main.js` 均带 `?v=` 查询参数（当前 `1.9.8`）。此前出现「改完仍显示旧样式」，原因就是浏览器继续使用缓存的旧 CSS；**每次修改 CSS / JS 后需同步递增该版本号**，否则改动可能不生效。
- **背景正弦波的实现要点（AI-generated）**：
  ① 画布层级为 `z-index: -1`，位于网格背景（`body::before`, `z-index: -2`）之上、页面内容之下，且 `pointer-events: none`，不干扰自定义光标与点击；
  ② 频率按**视口宽度换算**（`2π × 周期数 ÷ 宽度`），保证不同屏宽下可见的波形数量稳定，而不是固定像素频率；波长缩短后同步**上调相位速度**（波峰横向移动速度 = 相位速度 ÷ 角频率），三轮参数下均维持在约 **60px/秒**，避免波峰看起来近乎停滞；
  ③ 按 `devicePixelRatio` 缩放（上限 2）并 `setTransform`，避免高分屏发虚、同时限制像素量；
  ④ 尊重系统「减弱动态效果」设置，此时只绘制一次静态波形，不做动画；
  ⑤ 页面切到后台（`visibilitychange`）时暂停 `requestAnimationFrame`，回到前台再恢复，节省电量；
  ⑥ 为让波形在带底色的分区也能透出，`.section-alt` 与页脚背景改为半透明 `rgba(13, 13, 13, 0.75)`，数字孪生分区（`.twin-section`）改为透明。
- **开启动画的实现要点与边界处理（AI-generated）**：
  ① **不阻塞内容**：动画层是纯覆盖层，页面本身照常加载渲染，动画结束只是移除覆盖层，不做任何时序依赖；
  ② **可跳过**：点击 / 按键（`pointerdown` / `keydown`）立即结束动画并清空所有未触发的定时器，避免跳过后再冒出"幽灵"自检行；
  ③ **尊重系统设置**：`prefers-reduced-motion: reduce` 时**完全不播放**，直接隐藏动画层；
  ④ **可手动禁用**：URL 追加 `?noboot` 即可跳过，便于截图与调试（例：`index.html?noboot`）；
  ⑤ **兜底安全**：即使脚本报错或未执行，CSS 的 `animation: bootFallback 8s forwards` 也会让动画层在 8 秒后自动 `display:none`；禁用 JS 时由 `<noscript>` 内的 `.boot { display: none }` 直接隐藏；
  ⑥ **防滚动穿透**：动画期间 `<html>` / `<body>` 加 `overflow: hidden`，结束（或跳过）时移除。

### 验证方式
- CSS 大括号平衡（320/320）、小括号平衡（649/649）检查通过。
- HTML 标签配对检查通过（div 51/51、span 49/49、pre 1/1、p 18/18、script 2/2）。
- JavaScriptCore + DOM stub 执行 `scripts/main.js`（花括号平衡 114/114），无运行时错误；`mousemove` / `click` / `hover` 路径全部执行完成。
- **背景波形专项测试**：用 mock 2D context 手动驱动 7 帧，波形层共绘制 **21 次 stroke**（3 条波 × 7 帧），采样坐标全部为有限数值（无 `NaN` / `Infinity`），3 组「线宽 + 颜色」各命中 7 次。
- **波形参数核对**：3 条波周期数为 7 / 8 / 9，1440px 宽下波长约 206 / 180 / 160px，波峰横向移动速度约 61 / 60 / 60 px·s⁻¹，三条保持一致。
- **开启动画专项测试**：用可控虚拟时钟驱动第 13 段逻辑——4.05s 时进入收束态（`is-closing`），随后 700ms 收尾定时器触发并自移除（`is-done`）；6 行自检文字全部打印（间隔 170ms，末行于 1.43s 打印完毕）、5 个 `[ OK ]` 标记齐全；跳过监听器（`pointerdown` / `keydown`）各注册 1 个。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.8] 自定义霓虹光标 + 轨迹拖尾 + 四芒星交互形态

- **日期**：2026-09-10
- **作者**：katzegott

### 新增
- 新增全站**自定义光标**，配色与站点一致（黄 `--primary` + 青 `--accent`）：
  - **中心黄点**：8px 实心发光圆点，几乎即时跟随鼠标。
  - **外圈青环**：36px 霓虹描边圆环，以缓动（lerp 0.18）延迟跟随，形成拖曳感。
  - **悬停反馈**：移入链接 / 按钮 / 卡片 / Dock 图标时光环淡出。
  - **按下反馈**：鼠标按下时光环收紧至 22px 并提高亮度。
  - **四芒星交互形态**：移入按钮 / 链接 / 文本框 / 卡片时，光标整体切换为一颗 28px 的**发光四芒星**，并在切换瞬间旋转一整圈（360°，0.7s 后自然停下）。
- 新增**轨迹拖尾**：鼠标移动约每 14px 落下一枚黄/青交替的菱形碎块，带随机漂移，0.55s 淡出缩小后自动移除；同屏粒子上限 26，避免性能压力。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | 新增光标/光环/拖尾样式与 `trailFade` 关键帧 |
| `scripts/main.js` | 修改 | 新增第 11 段：光标跟随、拖尾粒子、悬停与按下反馈 |

### 说明
- **渐进增强**：仅在桌面精确指针（`hover: hover` 且 `pointer: fine`）且未开启系统「减少动态效果」时启用。
- **光标安全**：隐藏原生光标（`html.has-cursor`）推迟到用户**第一次移动鼠标**才生效，且只有脚本成功挂载后才添加；脚本未运行或报错时原生光标完全不受影响。
- **输入可用**：`input` / `textarea` 悬停时显示四芒星；一旦聚焦输入即切换回系统文本光标，保证打字时插入点可见。
- **四芒星实现**：用 `clip-path: polygon()` 绘制星形；因 `clip-path` 会裁掉 `box-shadow`，外发光改用 `filter: drop-shadow()`。
- **旋转不冲突**：四芒星画在 `.cursor-dot` 的伪元素上，旋转用标准 `transform` 作用于伪元素，与 JS 每帧写入父元素用于定位的 `transform` 互不干扰。
- 光标元素由 JS 动态注入并设 `pointer-events: none`，`z-index: 500` 位于扫描线与悬浮 Dock 之上。
- 拖尾粒子通过 `animationend` 自动回收并计数，长时间移动不会堆积 DOM。

### 验证方式
- CSS 大括号平衡（224/224）、JS 大括号平衡（87/87）检查通过。
- 用 JavaScriptCore + DOM stub 执行 `scripts/main.js`（`matchMedia=true`、`requestAnimationFrame` 跑 3 帧），并模拟 `mousemove` / `mousedown` / `mouseup` / `mouseover` / `mouseout` 事件，全程无运行时错误。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.7] macOS 风格悬浮 Dock 导航

- **日期**：2026-09-07
- **作者**：katzegott

### 修改
- 移除顶部固定导航栏与移动端汉堡抽屉菜单，改用 **macOS 风格悬浮 Dock** 作为全站导航。
- Dock 特性：
  - 底部**居中悬浮**，深色**毛玻璃**（`backdrop-filter`）+ 大圆角 + 高光内阴影。
  - 6 个图标项：🏠 首页 / 👤 关于我 / ⚡ 技能 / 🚀 项目 / ✉️ 联系 / 🤖 数字孪生，首页与其余项之间带分隔线。
  - **鼠标邻近放大**：图标按鼠标横向距离以余弦衰减方式放大并上浮（最大 1.75×），移出后平滑回落，模仿 macOS Dock 的 magnification。
  - **悬停名称气泡**：鼠标移入图标时，上方浮出该分区名称。
  - **当前分区指示点**：滚动时对应图标下方出现发光小圆点（沿用 `IntersectionObserver` 滚动监听）。
  - 页面滚动后 Dock 背景加深（`.scrolled`），与页面层次更分明。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 顶部 `header.navbar` → 底部 `nav.dock` 结构 |
| `styles/style.css` | 修改 | 删除 `.navbar/.nav-links/.nav-toggle/.brand` 旧样式，新增 Dock 全套样式；移动端适配；body 底部留白 |
| `scripts/main.js` | 修改 | 删除汉堡菜单逻辑；新增 Dock 邻近放大；scroll spy 选择器改为 `.dock-link`；Hero 区高亮「首页」 |

### 说明
- 因 Dock 悬浮于视口底部，`body` 增加 `padding-bottom` 预留空间；移动端将「返回顶部」按钮上移，避免与 Dock 重叠。
- 图标采用 Emoji，无需外部图标库，离线可用。
- 旧导航类名已从 HTML/CSS/JS 中完全清除，仅本文件历史记录保留描述。

### 验证方式
- HTML 标签配对、CSS 大括号、JS 大括号/小括号配对检查通过。
- `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。

---

## [v1.6] 更正 slogan 为「梦想即力量」

- **日期**：2026-09-07
- **作者**：katzegott

### 修改
- 将全站 slogan 由「梦想**及**力量」更正为「梦想**即**力量」，与彩蛋暗号统一。

| 位置 | 文件 | 说明 |
| --- | --- | --- |
| Hero 打字机大标题 | `index.html` | 首页视觉主体 slogan |
| `<meta name="description">` | `index.html` | 分享/SEO 描述 |
| 「关于我」段落 | `index.html` | 自我介绍引用的 slogan |
| 页脚署名 | `index.html` | `© 刘聿宸 · 梦想即力量` |
| 数字孪生欢迎语 | `scripts/main.js` | 关键词 `slogan/梦想` 的回答 |
| 数字孪生知识库 | `scripts/main.js` | slogan 条目回答与匹配关键词 |

### 说明
- 打字机效果读取的是 DOM 文本，替换后自动适配，无需改动动画逻辑。
- 本文件更早版本中的「梦想及力量」为当时的历史快照，按变更日志惯例保留不改。

### 验证方式
- 全站检索确认 `index.html` 与 `scripts/main.js` 已无「梦想及力量」残留。
- HTML 标签配对、JS 大括号配对检查通过；页面资源返回 HTTP 200。

---

## [v1.5] 页面底部彩蛋

- **日期**：2026-09-07
- **作者**：katzegott

### 新增
- 页面最底部新增**隐藏彩蛋**：在暗号输入框中输入 **「梦想即力量」**，页面点亮并跳转至
  `https://anime.bang-dream.com/yumemita/`。
- 交互反馈：
  - **命中暗号**：容器 `// 隐藏暗号` 标题与输入框发光，提示「✦ 咒语生效，梦想即力量 · 正在进入…」，约 0.7s 后跳转。
  - **暗号错误**：输入框轻微抖动，提示「咒语不对哦，再想想…」。
  - 输入框聚焦时高亮边框与霓虹光晕。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 底部隐藏暗号输入框 + `aria-live` 反馈提示元素 |
| `scripts/main.js` | 修改 | 精确匹配（去首尾空格）后发光提示并跳转；错误抖动；跳转地址使用 HTTPS |
| `styles/style.css` | 修改 | 彩蛋低调神秘样式：切角输入框、✨ 按钮、命中点亮、抖动动画 |

### 验证方式
- 本地服务器 `index.html` / `styles/style.css` / `scripts/main.js` 均返回 HTTP 200。
- HTML 标签配对、CSS 与 JS 大括号配对检查通过。
- 说明：暗号需**精确匹配**（去除首尾空格后等于「梦想即力量」），区分汉字内容。

---

## [v1.4] 可交互按钮液态玻璃效果

- **日期**：2026-09-07
- **作者**：katzegott

### 修改
- 为主页**可交互按钮**统一加入**液态玻璃（Liquid Glass）**质感：
  - Hero 区主按钮「联系我 / 了解我」（`.btn-primary` / `.btn-ghost`）
  - 数字孪生快捷提问按钮（`.twin-suggests button`）与发送按钮（`.twin-input button`）
  - 返回顶部按钮（`.back-top`）
  - 移动端导航按钮（`.nav-toggle`）
- 效果构成：`backdrop-filter` 毛玻璃模糊 + 顶部镜面高光渐变 + 玻璃厚度内阴影（`inset`）+ 边框高光；
  悬停时叠加**光泽扫过**动画与外部霓虹发光（`filter: drop-shadow`，因切角 `clip-path` 会裁剪普通外阴影）。
- 保持原有黑黄赛博风格与切角造型，主按钮改为「黄色玻璃」以延续品牌色。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `styles/style.css` | 修改 | 按钮样式整体升级为液态玻璃（含 `.nav-toggle` 尺寸 34→38px 与汉堡线位置同步调整） |

### 说明
- 液态玻璃依赖 `backdrop-filter`，在支持的现代浏览器（Chrome/Edge/Safari）中效果最佳；
  不支持时会回退为半透明背景，仍可正常使用。
- 出于可读性，发送按钮与返回顶部按钮保留较高的黄色不透明度，避免玻璃过淡影响操作识别。

### 验证方式
- 本地服务器 `index.html`、`styles/style.css` 均返回 HTTP 200。
- CSS 大括号配对检查通过；浏览器刷新后按钮呈现玻璃通透质感。

---

## [v1.3] 替换官方校徽为图片

- **日期**：2026-09-07
- **作者**：katzegott

### 修改
- 将 Hero 背景中天津大学 / 香港理工大学的**文字占位校徽**（TJU / PolyU）替换为**官方校徽图片**。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `assets/logo-tju.jpg` | 新增 | 天津大学校徽（115KB 原始 → 440×440 缩放） |
| `assets/logo-polyu.jpg` | 新增 | 香港理工大学校徽（34KB 原始 → 440×440 缩放） |
| `index.html` | 修改 | 校徽占位由 `.school-badge` 文字改为 `<img class="school-badge-img">` |
| `styles/style.css` | 修改 | 新增 `.school-badge-img` 圆形 `object-fit:contain` 样式，移除旧的文字样式 |

### 说明
- 原始文件位于 `uploads/ses_f992d3cf9ffemeP24yq3orELqt/`：
  - `6c52a7306aa4c0f038568366a4f52eda.jpeg`（34KB）= 香港理工大学校徽
  - `82523358d924fc61bc8dd7c110ba4bd4.jpeg`（116KB）= 天津大学校徽
- 校徽以半透明（`opacity: 0.55`）+ 悬浮动画作为 Hero 背景装饰，不影响主体内容可读性。

### 验证方式
- 本地服务器 `http://127.0.0.1:8123/assets/logo-tju.jpg` 与 `logo-polyu.jpg` 均返回 HTTP 200。
- HTML 标签配对、资源引用检查通过；旧文字占位已无残留。

---

## [v1.2] 使用动漫头像

- **日期**：2026-09-07
- **作者**：katzegott

### 修改
- 将默认文字头像（“刘”字）替换为动漫头像图片 `assets/avatar.jpg`。
- 同时应用于 **Hero 区主头像** 与 **数字孪生区块** 头像，保持视觉统一。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `assets/avatar.jpg` | 新增 | 头像图片（512×512 方形，聚焦脸部，居中裁剪） |
| `index.html` | 修改 | 两处头像改用 `<img src="assets/avatar.jpg">` |
| `styles/style.css` | 修改 | 头像框加 `overflow:hidden` + `object-fit:cover`，去除文字样式 |

### 验证方式
- 本地服务器 `http://127.0.0.1:8123` 中 `avatar.jpg` 返回 HTTP 200。
- HTML 标签配对、CSS 括号配对检查均通过；页面浏览器刷新后可正常显示圆形头像。

---

## [v1.1] 数字孪生区块

- **日期**：2026-09-07
- **作者**：katzegott

### 新增
- **数字孪生交互区块**：位于页面最底部（`联系我` 之后、页脚之前）。
  - 纯前端对话式“虚拟的我”，根据**个人简介**回答关于姓名、年龄、学校、专业、slogan、爱好、技能、课程与联系方式的问题；知识库内容均取自页面简介，未虚构信息。
  - 赛博风格界面：身份条（头像 + 在线状态点 + BETA 徽标）、可滚动对话区、快捷提问按钮、输入框与外发光发送按钮、AI “正在输入”打字动画。
- 顶部导航新增「数字孪生」链接（`#twin`），随移动端菜单一起生效。

### 涉及文件
| 文件 | 类型 | 说明 |
| --- | --- | --- |
| `index.html` | 修改 | 新增 `#twin` 区块、导航链接 |
| `styles/style.css` | 修改 | 新增数字孪生样式（约 237 行） |
| `scripts/main.js` | 修改 | 新增数字孪生对话逻辑（知识库 + 匹配 + UI） |

### 修复
- `styles/style.css`：原有笔误 `z-index: 来个0;`（无效值）修正为 `z-index: 0;`。

### 验证方式
- 本地 `python3 -m http.server 8123` 启动，`index.html / style.css / main.js` 均返回 HTTP 200。
- HTML 标签配对、CSS 大括号配对、JS 括号配平检查均通过。
- 浏览器打开后滚动至底部，可正常对话（含快捷提问与手动输入）。

### 说明
- 数字孪生为**规则匹配**的轻量实现（无后端），后续若需更智能应答可替换为真实 AI 接口。
- 相关代码均以 `AI-generated` 注释标注，核心应答文案已人工审阅并仅取自个人简介。

---

## [v1.0] 个人主页 MVP（初始建立）

- **日期**：2026-09-03（据文件时间与 MVP 提示词记录）

### 内容
- 单页个人主页，包含：Hero（姓名 / 18 岁 / slogan「梦想及力量」）、关于我、技能、项目（3 个占位）、联系我、页脚。
- 纯 HTML/CSS/JS 实现，无后端；黑黄赛博朋克视觉风格。
- 选用提示词见 `../outputs/个人主页_MVP_vibe编码提示词_v1.md`（含英文版 Prompt 与检查清单）。

### 涉及文件
| 文件 | 说明 |
| --- | --- |
| `index.html` | 页面结构 |
| `styles/style.css` | 样式（黑黄霓虹 / 故障 / 扫描线 / 响应式） |
| `scripts/main.js` | 交互（年份、导航、滚动进度、打字机、进场动画、技能进度条） |

---

### 版本管理（已执行）
- 2026-09-07：在 `personal-homepage/` 下初始化 Git 仓库（`git init -b main`），
  并使用本地身份配置（刘聿宸 / 319008328@qq.com，仅仓库级）。
- 提交节点：
  - `ca55989` `feat: 建立个人主页 MVP，含数字孪生区块`
  - `0661a66` `docs: 添加开发修改历史 CHANGELOG.md`
- 说明：由于 MVP 与数字孪生改动同时存在于当前源文件，二者合并为同一初始提交，
  历史中暂不能按[原有]功能点进一步拆分；后续新增功能建议每次一个 `feat:` 提交。
