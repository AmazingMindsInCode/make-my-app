# 状态机与进度真相源（mma-guide 的路由依据）

核心原则：**工件优先于记录**。progress.json 说在 build 阶段，但需求单文件不存在 → 以工件为准，回到 requirement 阶段，并用一句话向用户说明后修正记录。绝不凭会话记忆判断进度——每次都重新读盘。

## 一、状态表

| # | stage | 大白话名 | 进入条件 | 完成工件（必须落盘） | 负责技能 |
|---|-------|---------|---------|---------------------|---------|
| 0 | env-check | 给电脑做体检 | 新项目开始 | `.make-my-app/progress.json` 初始化 + env 体检结果 | mma-env |
| 1 | requirement | 聊清楚你想做什么 | 体检完成 | `.make-my-app/requirement.md`（场景剧本齐全 + 边界约定无悬案 + **最终确认记录：用户原话+日期在案**） | mma-requirement |
| 2 | solution | 挑一个做法 | 需求单存在 | 方案卡选定写入 decisions + tasks[] 生成 | mma-solution |
| 3 | env-setup | 给电脑装齐工具 | 方案已定且体检有缺失项 | progress.env 全部 ok（或明确标注延后项及触发条件） | mma-env |
| 4 | scaffold | 搭软件骨架 | 环境齐备 | 项目目录 + 编译通过 + 空白版能在浏览器打开 + 考卷工具就位且测试实例能起 + 首个存档点 | mma-build |
| 5 | build | 一个功能一个功能做 | tasks 存在且未全 done | tasks 全部 done（每完成一个立即写盘；每个 done 都以考卷执行器退出码 0 为凭） | mma-build |
| 6 | verify | 请独立考官验收 | tasks 全 done（或用户报了问题） | `.make-my-app/acceptance-report.md` 全 pass，或用户签字认账的遗留清单 | mma-verify |
| 7 | ship | 开门营业（三级渐进） | 验收 pass | shipLevel = 1 / 2 / 3（每级独立可停） | mma-ship |
| 8 | done | 交付完成 | 用户在任一 ship 级别满意停下 | 项目 README.md（新手版使用说明）更新完毕 | mma-build |

## 二、转换规则

1. 只能相邻推进。例外两条：
   - `build ⇄ verify` 可来回：验收发现不合格 → 回 build 修复 → 修完重新验收（fresh-eyes 重验）。
   - 任何阶段用户报 bug → 进入 mma-verify 的"修复闭环"，处理完回到原 stage。
2. `ship` 内部 L1 本机 → L2 局域网 → L3 公网，逐级推进，**每级都可停**且停在任一级软件都能用。
3. 非法跳转（如没有需求单就想 build）→ mma-guide 必须拦下，用一句话解释为什么不能跳（"还没聊清楚要做什么，写出来容易白做"），并把用户带回正确阶段。
4. 任意阶段都允许存档点（mma-savepoint）；阶段推进前必须先存一个档。

## 三、progress.json 格式（`.make-my-app/progress.json`）

```json
{
  "schemaVersion": 2,
  "appName": "家庭记账本",
  "dbName": "family_ledger",
  "createdAt": "2026-09-30T10:00:00",
  "updatedAt": "2026-09-30T12:30:00",
  "stage": "build",
  "stageHistory": [
    { "stage": "env-check", "at": "2026-09-30T10:05:00", "note": "体检完成，缺 MySQL 已装好" },
    { "stage": "requirement", "at": "2026-09-30T10:40:00", "note": "需求单 8 条功能已确认" }
  ],
  "env": {
    "pathCheck": "ok",
    "jdk17": "ok",
    "node": "ok",
    "mysql": "ok",
    "git": "ok",
    "port8080": "ok"
  },
  "tasks": [
    { "id": "T1", "reqId": "R1", "title": "记账页面：能添加一笔账",
      "spec": [
        { "id": "T1-S1", "text": "点『记一笔』能填金额、日期、类别、备注并保存" },
        { "id": "T1-S2", "text": "金额不是数字时给出提示且不保存" },
        { "id": "T1-S3", "text": "保存后列表里立刻能看到这笔账" },
        { "id": "T1-S4", "text": "关掉软件重新打开，这笔账还在" }
      ],
      "status": "done", "at": "2026-09-30T11:20:00" },
    { "id": "T2", "reqId": "R2", "title": "账单列表：能看到所有账", "spec": [{ "id": "T2-S1", "text": "…（同上粒度，用户视角可验证）" }], "status": "doing" },
    { "id": "T3", "reqId": "R3", "title": "统计：本月花了多少", "spec": [{ "id": "T3-S1", "text": "…" }], "status": "todo" }
  ],
  "decisions": [
    { "at": "2026-09-30T10:45:00", "q": "选哪个方案", "a": "方案A：三页面精简版" }
  ],
  "shipLevel": 0,
  "saves": [
    { "msg": "完成了记账页面", "time": "2026-09-30T11:20:00", "tests": "4/4" }
  ],
  "secretsNote": "数据库密码只存在 backend/src/main/resources/application-local.yml（已在 .gitignore，不会进存档）"
}
```

写盘规则：
- 每次阶段变化、任务状态变化、存档点、决策落定，**立即**写盘，不攒批。
- 时间一律 ISO 8601 本地时间。
- **密码永不写入本文件**（也不写入任何会进 git 的文件）。
- task.status 只有三值：todo / doing / done。
- **每个 task 必须带 spec**（3-6 条用户视角验收标准，生成于 solution 阶段，每条 `{ "id": "T#-S#", "text": "…" }`）。spec 是出题依据：mma-spec-tester 把每条写成考题落在 `.make-my-app/tests/T#.mjs`，由 `.make-my-app/tests/run-tests.mjs` 执行；执行器退出码 0 才准标 done。考题随存档走，是整个软件的回归测试。
- 读到 schemaVersion 1 的旧格式（spec 是字符串数组）：按顺序补编号 T#-S1、T#-S2…，写回为 schemaVersion 2。
- `dbName` 在 scaffold 时写入（规则见 golden-path"库名"）。
- spec 变更即需求变更：走 mma-guide 的变更流程，受影响任务重写 spec 并经用户确认。
- 经验日志 `.make-my-app/experience-log.md` 与 progress.json 并行生长（见 `experience-log.md` 规范）：failure/lesson/pitfall/correction/install/suggestion 六类事件触发即追加；它不是任何阶段的完成工件，但导出（/export）时是唯一数据源。

## 四、mma-guide 启动协议（每次激活必须执行）

1. **找项目根**：从当前工作目录向上最多 3 层，找 `.make-my-app/` 目录。
2. 找不到 → 判定"新项目"，从 env-check 开始。
3. 找到 → 读 progress.json，按状态表逐项核对工件（需求单在不在、项目目录在不在、tasks 完成情况和文件对不对得上）。
4. 工件与记录一致 → 从记录的 stage 续作。**绝不重做已 done 的任务**；对"记录说 doing 但工件不存在"的任务，先问用户是没做完还是被删了，确认后重做。
5. 不一致 → 以工件为准，一句话说明差异并修正 progress.json，再续作。
6. **汇报现状**（大白话，参照 /status 看板格式）→ **阻塞式确认**下一步（一次一问，给推荐答案）→ 用户点头才动工。

## 五、/status 看板输出格式

```
📊 你的软件《家庭记账本》
进度：第 5 步 / 共 8 步 —— 一个功能一个功能做
✅ 已完成：电脑体检 · 聊需求 · 挑方案（三页面精简版）· 搭骨架
🔨 进行中：T2 账单列表（第 2 / 7 个功能）
💾 最近存档：09-30 11:20 完成了记账页面
👉 下一步：把账单列表做出来给你看
```

- 步骤序号 = 状态表 #，名称用"大白话名"列。
- 进行中任务永远只显示一个（doing 的那个）。
- 若有延后项或遗留缺陷，看板末尾加一行"⏸ 暂缓：xxx（原因）"。
