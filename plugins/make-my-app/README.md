# 我要做软件（make-my-app）

> 让**没有任何软件开发经验的人**，从"我想做个东西"一路走到"软件跑起来给别人用"。

**Make My App** — an out-of-the-box ZCode plugin that walks absolute beginners from an idea to a running, deployed app — entirely in plain language, with spec-driven testing and auto save-points. (English summary; 详见下文中文说明。)

## 这是给谁用的

- 完全零基础：不懂代码、不懂数据库、没装过开发工具
- 想做一个真正能用的软件：记账本、库存表、报名页、小团队工具……
- 有一台 Windows 电脑和一个 ZCode（AI 编程助手）

不需要懂任何技术名词——插件会用比喻解释一切（"接口就是页面和后台之间递单子的窗口"）。

## 六个口令

| 口令 | 用途 |
|---|---|
| `/start 我想做一个家庭记账本` | 从零开始做新软件 |
| `/continue` | 从上次断点精确恢复（隔几天回来也不丢） |
| `/status` | 大白话进度看板：第几步、剩几个功能、存过哪些档 |
| `/ask 下一步干嘛？` | 问教练：下一步做什么、怎么做、术语什么意思 |
| `/export` | 把踩过的坑和建议打包成脱敏报告，发给开发团队 |
| `/help` | 新手指南 |

也可以直接说人话："我想做个东西记录我养的猫"、"存个档"、"回到上个存档点"。

## 它带你走完整的路

```
💬聊需求（挑刺+看得见的确认：流程图/剧本故事流/画面草图，改到你说"就是它"）
   → 🃏挑方案（可出并排画面草图对比） → 🔧装环境 → 🧱搭骨架 → 🔨逐功能开发
                                                │  每个功能：实现 → 测试员按验收标准逐条测 → 跑给你看 → 自动存档
                                                ▼
🚀三级渐进上线（本机 → 局域网 → 公网，每级可停） ← ✅独立考官按需求单全量验收
```

## 四道安全闸（为什么可以放心交给它）

1. **验证闭环**：每个任务自带大白话验收标准（spec），实现后由独立测试子代理（mma-spec-tester）把每条写成能反复跑的考题并考一遍，全过才算完；考题留在项目里，以后每次改动都全量重考，做好的功能被改坏会被当场抓住。AI 说"修好了"必须复现原问题并请你亲手再试。
2. **进度真相源**：进度只认项目里的 `.make-my-app/progress.json` 和实际文件，不靠 AI 记忆；换会话、关机重启都不丢。
3. **存档点**：全程自动快照（对用户隐藏 git），随时"回到上个存档点"，回滚前还自动备份当下状态。
4. **人说了算**：花钱、输密码、开放端口永远由用户亲手完成；装软件经用户**逐项同意**后可由插件代劳（优先 winget 静默安装，亮出确切命令再执行，装完验证），密码类步骤绝不代办。

## 技术黄金路径（已替用户选好，无需决策）

JDK 17（Temurin）· Spring Boot 3 · MySQL 8 · MyBatis-Plus · Flyway（表结构随存档走，库和表自动建）· Vue 3 + Vite + Element Plus · 项目自带 Maven 包装器（mvnw）与国内镜像配置，**用户无需安装 Maven** · 前端成品打进后端 → 最终交付物是"双击 start.bat 就能用"的单个应用。详见 `references/golden-path.md`。

## 成熟组件如何编入既有能力（无独立命令）

插件把成熟开源组件**编排为既有子命令对应环节的执行引擎**，用户感知到的始终是能力本身：

| 环节（既有命令） | 编排进去的组件引擎 |
|---|---|
| 开发（/start 流程内 mma-build） | design-taste-frontend + ui-ux-pro-max + web-design-guidelines（页面设计三件套：定调→选风格→完工审查）；tdd（复杂后端任务切测试先行）；humanizer-zh（软件文案去 AI 味） |
| 验收（mma-verify / mma-spec-tester） | browser-use / playwright 浏览器自动化（复现、取证、页面级验证）；diagnosing-bugs（疑难 bug 系统诊断）；code-review（回归自查） |
| 教练（/ask） | teach（深入教学时按其方法展开） |

组件**一个不装也能走完全程**（回落内置基线）；环节需要而不在位时，就地向用户建议安装（亮牌+同意），说"更新组件"即可全部更新。来源与装法见 `references/addons-registry.md`。注册表之外的缺口由 mma-find-skill 现场检索（含"不装、改需求"保底项，经用户同意才装）。

## 安装

### 方式一：本地市场（开发者自测）

1. 打开 ZCode → 设置 → 插件管理（Plugin Marketplace）
2. 添加市场 → 选择"添加插件市场" → 粘贴本仓库的 `plugins/` 目录的**绝对路径**（即含 `marketplace.json` 的目录）
3. 在个人（Personal）里找到「我要做软件」→ 安装 → 启用
4. 新开会话，输入 `/help` 试用

### 方式二：git 仓库（分发给他人）

把本目录推到 git 仓库后，用户在插件市场添加该仓库地址即可。升级：改代码 → 递增 `.zcode-plugin/plugin.json` 的 version → 用户在市场源刷新后更新。

## 插件结构

```
make-my-app/
├── .zcode-plugin/plugin.json     # 清单
├── skills/                       # 13 个技能（mma- 前缀防冲突）
│   ├── mma-guide        全程领航员（唯一入口·状态机·断点恢复）
│   ├── mma-env          环境体检与装配（支持授权代办安装）
│   ├── mma-requirement  需求深挖+挑刺+确认环（场景剧本式需求单）
│   ├── mma-show         确认材料呈现引擎（流程图/草图/一页确认卡）
│   ├── mma-solution     方案选牌 + 任务清单/验收标准(spec)生成
│   ├── mma-build        脚手架 + 小步开发循环（每任务派测试）
│   ├── mma-verify       修复闭环 + 独立考官验收
│   ├── mma-ship         三级渐进上线向导
│   ├── mma-savepoint    存档点（隐藏式 git）
│   ├── mma-next         下一步教练（/ask）
│   ├── mma-find-skill   能力缺口雷达（检索建议安装）
│   ├── mma-export       经验导出（/export 反哺开发团队）
│   └── mma-addons       内部组件管理器（成熟组件的装/更引擎，无独立命令）
├── commands/                     # /start /continue /status /ask /help
├── agents/
│   ├── mma-spec-tester   规格测试子代理（逐任务按 spec 验证）
│   └── rookie-reviewer   独立验收考官（fresh-eyes）
├── hooks/session-start.sh        # 开新会话提醒未完成项目
└── references/                   # 状态机/黄金路径/防坑清单/术语表/经验日志规范/组件注册表/模板
```

## 设计来源（诚实声明）

本插件的经验并非凭空设计：状态机与断点恢复、验证闭环、环境防呆（16 条防坑清单）、机读进度真相源等机制，提炼自 508 个真实开发会话中反复出现的失败与成功模式。

插件也会在使用中自我进化：失败、教训、新坑、用户纠正全程记入项目经验日志（`.make-my-app/experience-log.md`，含隐私红线），用户可随时 `/export` 导出脱敏报告反馈给开发团队——下一个新手少踩的每个坑，都来自上一个用户的如实记录。

## License

MIT（见 LICENSE 文件）。例外：`references/templates/mvnw-cmd.txt`、`mvnw-sh.txt` 是 Apache Maven Wrapper 3.3.4 官方原件，按 Apache License 2.0 分发（文件头保留了许可声明）。
