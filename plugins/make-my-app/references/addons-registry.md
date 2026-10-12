# 组件注册表 · 既有子命令能力的执行引擎（内部基础设施）

本表登记的**成熟外部组件**不构成独立命令——它们被**编排为既有子命令对应能力的执行引擎**：

| 组件包 | 编排给谁（作为什么能力） |
|---|---|
| design-pack 页面颜值包 | `/start`→开发环节（mma-build）：页面设计能力 |
| browser-test 真机验证包 | 验收环节（mma-verify/mma-spec-tester/mma-build"跑给你看"）：浏览器验证能力 |
| eng-pack 工程方法论包 | 开发与验收（mma-build 的 tdd 模式、mma-verify 的诊断与审查） |
| plain-copy 说人话文案包 | 开发环节（mma-build）：软件文案能力 |

插件本体自包含开箱即用——组件**一个不装也能走完全程**（回落内置基线）。安装/更新/卸载由内部组件管理器（mma-addons 技能）执行：环节内即需即装、用户说"更新组件"时更新、**一切动作先亮牌征得用户同意**。本表对用户不可见（用户看到的是能力，不是组件）。

> 对话层的"说人话"是插件内置规范（glossary + 沟通规范），不依赖本表；本表的 plain-copy 管的是**软件产物里给真人看的文字**。

## 组件包总览

| id | 大白话名 | 类型 | 装了有什么用 | 建议 |
|---|---|---|---|---|
| design-pack | 页面颜值包 | skill 集 | 页面做得好看不土，设计决策有依据 | ⭐强烈推荐（做到页面前装） |
| browser-test | 真机验证包 | 插件 | AI 能亲手开浏览器点页面做验证 | ⭐推荐（开发开始前确认） |
| eng-pack | 工程方法论包 | skill 集 | 测试先行纪律、独立代码审查、疑难 bug 系统诊断 | 可选（复杂项目/想进阶时） |
| plain-copy | 说人话文案包 | skill | 软件里和说明书里的文字去 AI 味 | 可选 |

## 逐包明细（安装/更新命令为 Git Bash，Windows 通用）

### 1. design-pack 页面颜值包

包含 3 个 skill（全部开源）：

| skill | 来源仓库 | 仓库内路径 | 干什么 |
|---|---|---|---|
| design-taste-frontend | https://github.com/Leonxlnx/taste-skill.git | `skills/taste-skill/` | 前端审美的主方法论（反 AI 味落地页设计） |
| ui-ux-pro-max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git | `.claude/skills/ui-ux-pro-max/` | 50+ 风格/161 配色/57 字体对/99 UX 准则知识库 |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills.git | `skills/web-design-guidelines/` | 按 Web 界面规范逐条审查页面代码 |

安装（幂等，更新=重复执行）：

```bash
tmp=$(mktemp -d)
git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git "$tmp/taste" \
  && cp -r "$tmp/taste/skills/taste-skill" ~/.agents/skills/design-taste-frontend
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git "$tmp/uiux" \
  && cp -r "$tmp/uiux/.claude/skills/ui-ux-pro-max" ~/.agents/skills/ui-ux-pro-max
git clone --depth 1 https://github.com/vercel-labs/agent-skills.git "$tmp/vercel" \
  && cp -r "$tmp/vercel/skills/web-design-guidelines" ~/.agents/skills/web-design-guidelines
rm -rf "$tmp"
```

集成点：mma-build 前端页面任务（在位则按其方法论做页面）；mma-verify 页面审查。
状态检测：`~/.agents/skills/design-taste-frontend/SKILL.md` 等 3 处存在。

### 2. browser-test 真机验证包（插件类）

| 组件 | 来源 | 说明 |
|---|---|---|
| browser-use（首选） | ZCode 官方插件市场 `zcode-plugins-official` | 通常已内置；驱动内置浏览器导航/点击/截图 |
| playwright（备选） | claude 插件市场 `claude-plugins-official` | Playwright MCP 全套浏览器自动化 |

**插件类组件的安装/更新走 ZCode 插件市场 UI**（AI 给步骤、不代装）：设置 → 插件管理 → 在官方市场找到组件 → 安装/更新。更新另需在市场源刷新。
状态检测：`~/.zcode/cli/plugins/installed_plugins.json` 中出现 `browser-use`（或 `playwright`）。

集成点：mma-build"跑给你看"（截图证据）；mma-verify 修复后自动复现；mma-ship L2 局域网验证。**在位不改变规则：最终确认永远请用户亲手点一遍。**

### 3. eng-pack 工程方法论包（mattpocock/skills）

包含 4 个 skill，全部来自 https://github.com/mattpocock/skills.git ：

| skill | 仓库内路径 | 干什么 |
|---|---|---|
| tdd | `skills/engineering/tdd/` | 测试先行：先写考题再写答案的纪律 |
| code-review | `skills/engineering/code-review/` | 按 spec 双轴审查自己的变更 |
| diagnosing-bugs | `skills/engineering/diagnosing-bugs/` | 疑难 bug 的系统化诊断循环 |
| teach | `skills/productivity/teach/` | 把一个概念真正讲明白（进阶教学） |

安装（幂等，更新=重复执行）：

```bash
tmp=$(mktemp -d)
git clone --depth 1 https://github.com/mattpocock/skills.git "$tmp/mp" || { rm -rf "$tmp"; exit 1; }
cp -r "$tmp/mp/skills/engineering/tdd" ~/.agents/skills/tdd
cp -r "$tmp/mp/skills/engineering/code-review" ~/.agents/skills/code-review
cp -r "$tmp/mp/skills/engineering/diagnosing-bugs" ~/.agents/skills/diagnosing-bugs
cp -r "$tmp/mp/skills/productivity/teach" ~/.agents/skills/teach
rm -rf "$tmp"
```

集成点：mma-build 复杂后端任务可切 tdd 模式；mma-verify 验收前 code-review 视角自查；mma-next 深度教学用 teach。
状态检测：`~/.agents/skills/tdd/SKILL.md` 等 4 处存在。

### 4. plain-copy 说人话文案包

| skill | 来源仓库 | 仓库内路径 |
|---|---|---|
| humanizer-zh | https://github.com/op7418/Humanizer-zh.git | 仓库根 |

```bash
tmp=$(mktemp -d)
git clone --depth 1 https://github.com/op7418/Humanizer-zh.git ~/.agents/skills/humanizer-zh
rm -rf "$tmp"
```

集成点：mma-build 写软件内用户可见文案、项目 README 定稿时过一遍去 AI 味。
状态检测：`~/.agents/skills/humanizer-zh/SKILL.md` 存在。

## 安装记录

mma-addons 的每次装/更/删写入 `~/.agents/.mma-addons.json`：

```json
{ "design-pack": { "installedAt": "…", "lastUpdate": "…", "skills": ["design-taste-frontend", "ui-ux-pro-max", "web-design-guidelines"] } }
```

## 登记新组件（插件自我进化）

用户/团队想推荐新组件：在本文新增一个包条目（id、来源、路径、装法、集成点、检测法），即自动纳入 `/addons` 管理。来源必须是可验证的开源仓库或官方市场，禁止登记闭源收费或来路不明的组件。
