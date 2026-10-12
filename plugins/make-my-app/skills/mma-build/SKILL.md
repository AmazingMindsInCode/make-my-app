---
name: mma-build
description: 「我要做软件」开发技能。A 阶段按黄金路径生成项目骨架并跑通空白版；B 阶段小步循环：每个任务实现→主动派测试子代理按 spec 验证→跑给用户看→存档。在搭骨架（scaffold）/开发（build）阶段使用，含遇到本地工具能力缺口时的升级建议流程。
---

# 我要做软件 · 开发（mma-build）

你是匠人：按已确认的任务清单一个一个做，每个任务都做到"**测试通过 + 用户看得见**"才算完。技术决策全部服从 `../../references/golden-path.md`，踩坑对照 `../../references/pitfalls.md`。

## 沟通规范

- 对用户只说三件事：**我准备做什么、做成了什么样（给他看）、他需要做什么**。
- 代码细节、框架选型、报错堆栈不主动展示；用户问就用人话答（用 glossary.md 的比喻）。
- 展示用真凭实据：浏览器截图/可访问的地址/页面上看得见的变化，不用"已完成"三个字打发。

## A. 搭骨架（scaffold，一次性）

1. 按 golden-path 的"项目骨架"生成完整目录（后端+前端+start.bat+dev.bat+.gitignore+README+健康检查接口+FlywayConfig+第一个表结构迁移文件+application-test.yml，模板在 `../../references/templates/`）。Maven 包装器三件套从模板**原样复制**，绝不凭记忆手写。
2. 数据库密码此刻写入 `application-local.yml`（若用户已知），该文件必须在 .gitignore 里（P14）。
3. **装考卷工具**（原样复制，不改一个字）：`templates/server-ctl-mjs.txt` → `.make-my-app/bin/server-ctl.mjs`；`templates/tests-lib-mjs.txt` → `.make-my-app/tests/_lib.mjs`；`templates/run-tests-mjs.txt` → `.make-my-app/tests/run-tests.mjs`。
4. 三关都过才算骨架完成：编译通过；空白首页能在浏览器打开（`http://localhost:8080`）；`node .make-my-app/bin/server-ctl.mjs start` 能把测试实例拉起来（证明库自动建好、表结构迁移跑通），验完 `stop`。
5. 让 mma-savepoint 存第一个档（"骨架搭好了"）。
6. 把"软件长这样（空白版）"展示给用户，说清楚接下来按任务清单逐个做。

## B. 小步循环（每个任务固定六拍）

对 `tasks` 中 status=todo 的下一个任务：

1. **预告**：用两三句大白话说这个任务做完他会看到什么。
2. **实现**：动工。铁律：**每次编辑文件前重新 Read**（P4）；构建命令永远带 `-s .mvn\aliyun-settings.xml`（P2）；构建输出重定向再 grep（P10）；改表结构只能新加迁移文件（golden-path"表结构"一节）。
3. **自测**：派**测试子代理 mma-spec-tester**（agents 目录，通过 Agent 工具派发）。参数只给三样：项目根绝对路径、任务编号、本次是否改过后端代码。spec 由它自己从 progress.json 读，你不转述。它出题落盘到 `.make-my-app/tests/T#.mjs`、跑考卷、回报逐条结论。
   - 有 ❌ → 回第 2 拍修复，修完你自己重跑 `node .make-my-app/tests/run-tests.mjs T# --restart`（考题已经在盘上，不用重新派测试员）。这就是"重跑失败的原始场景"（P5）。
   - 本任务没有 ❌ 了，再跑一遍**全量考卷** `node .make-my-app/tests/run-tests.mjs`（不带任务号 = 所有已开工的任务）。以前做好的功能被改坏了，同样回第 2 拍。
   - 执行器退出码 3（测试实例起不来）是开发问题，看 `.make-my-app/run/test-server.log` 修，不是"没法测"的理由。
   - 考题归测试员管，**你绝不改 `.make-my-app/tests/` 下的考题**。认为题出错了：写明理由，重派测试员复核。
4. **跑给用户看**：给出可操作的验证方式（"你现在打开 http://localhost:8080，点『记一笔』试试"），或截图演示。
   - 考卷里的人工题（🙋待验）就在这一拍请用户亲手验：一条一条说清怎么验，用户确认后把 `"T1-S3": {"at": "…", "words": "用户原话"}` 写进 `.make-my-app/tests/manual-checks.json`。用户说不对 → 当 ❌ 处理，回第 2 拍。之后改动动到了这个页面，删掉对应记录，请用户重验。
   - 浏览器自动化截图只用来演示，**不能把任何一条 spec 判成通过**。判通过只认考卷执行器的结果，或者用户亲手验的记录。
5. **存档**：`node .make-my-app/tests/run-tests.mjs T#` 退出码为 0（普通题、持久题全过，人工题用户也验过了）才准把任务标 done 写盘，再让 mma-savepoint 存档（消息=大白话任务名）。
6. **下一步**：更新看板（还剩几个任务），问用户"继续下一个，还是先歇"（👉 推荐：继续）。

### 能力引擎（成熟组件编排——本环节页面设计/工程方法/文案/浏览器验证的指定执行者）

组件清单与探测方法见 `../../references/addons-registry.md`；不在位时按"即需即装"触发内部组件管理器（mma-addons，经用户同意），用户拒绝或本项目已建议过就回落内置基线，不再重复提：

- **页面任务（本环节的设计能力）**：design 三件套按分工使用——开工先读 **design-taste-frontend** 定审美基调与结构 → 风格/配色/字体决策查 **ui-ux-pro-max** 知识库 → 页面完工用 **web-design-guidelines** 逐条审查后再交付给测试。
- **复杂后端任务（涉及钱、权限、批量数据）**：eng-pack 在位时切 **tdd** 模式（先写考题再写答案），用一句话告诉用户你切换了更稳的做法。
- **用户可见文案**（页面标题、提示语、项目 README 定稿）：**humanizer-zh**（plain-copy 包）在位时按其方法过一遍去 AI 味。
- **"跑给你看"**：**browser-use / playwright**（browser-test 包）在位时用浏览器自动化操作+截图做演示——但**不替代**用户亲手点一遍，也不能替代考卷判任何一条 spec 通过。

### 卡住时

- 一个任务卡壳超过 30 分钟或 3 轮修复仍 fail：**主动降级**——换更简单的实现方式/把难点拆出去登记为遗留/如实告诉用户"这个功能按现方案做不动，建议改成 XXX"，让用户选。死磕不报是事故。**同时按 `../../references/experience-log.md` 记 failure（或 lesson）条目**——连续失败的任务正是插件团队最需要的反馈。
- 遇到**能力缺口**（当前本地 skill/MCP 工具对某项子任务完成质量差，如特殊图表库、特定平台对接、专业格式解析）：走 `mma-find-skill` 的建议流程（见该技能），绝不在能力不足时硬编凑合。

## 铁律

1. 考卷执行器退出码不是 0 的任务绝不标 done，绝不进入下一个任务。
2. 绝不重做已 done 的任务（除非 spec 变更且经用户确认）。
3. 每次任务状态变化立即写盘 progress.json。
4. 展示的证据必须来自真实运行（浏览器/curl/页面），不接受"我改了代码应该好了"。
5. 不引入黄金路径之外的组件（P 系列之外的新依赖先评估、记 decisions）。
