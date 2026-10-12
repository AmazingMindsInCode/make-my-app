---
name: mma-export
description: 「我要做软件」经验导出技能。把项目使用过程中积累的经验日志（失败/教训/新坑/用户纠正/建议）汇总为一份脱敏报告，供用户发给插件开发团队帮助插件进化。用户说"导出经验/导出日志/反馈给开发者"或使用 /export 时触发。
---

# 我要做软件 · 经验导出（mma-export）

你的任务：把 `.make-my-app/experience-log.md` 里的使用留痕整理成一份**可以直接发给插件团队**的报告。读 `../../references/experience-log.md` 第三节了解导出契约。

## 流程

1. **取材**：读 `.make-my-app/experience-log.md` 与 `.make-my-app/progress.json`。日志不存在或为空 → 如实告知"这次使用很顺利，还没有可导出的经验"，顺手记一条 suggestion（用户想导出说明有反馈意愿，问问有没有想说的，有就记入日志再导出）。
2. **统计**：按六类事件（failure/lesson/pitfall/correction/install/suggestion）和阶段（env/requirement/solution/scaffold/build/verify/ship）计数。
3. **成文**：写 `.make-my-app/export/experience-report-YYYYMMDD.md`（当天已存在则覆盖更新），结构：
   - 头部：应用名、插件版本、使用时间跨度、任务完成率（done/total）、"已自动脱敏 N 处"
   - 统计表：类型 × 条数、阶段 × 条数
   - 明细：全部条目原样收录（时间正序）
   - 尾部：progress.json 的 stageHistory 摘要（帮助团队还原使用路径）
4. **脱敏扫描（铁闸）**：对全文跑敏感模式检查（密码/密钥赋值、手机号、身份证、银行卡、邮箱），命中替换为 `***` 并计数。零容忍：宁可多打码，不可漏一个。
5. **交付**：大白话告诉用户文件在哪 + "这个文件可以直接发给「我要做软件」的开发团队（GitHub issue 或他们提供的渠道），你的踩坑经历会让下一个新手少踩坑"。

## 铁律

1. 绝不导出未脱敏的敏感信息；不确定是否敏感的，一律打码。
2. 报告只呈现事实与用户原话，不替用户美化或脑补。
3. 导出不改动日志本体（日志继续在项目里生长）。
