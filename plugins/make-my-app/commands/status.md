---
description: 看看我的软件做到哪一步了（大白话进度看板）
skills: mma-guide
---

使用 mma-guide（我要做软件·全程领航员）技能，读 `.make-my-app/progress.json` 并核对实际工件后，按 state-machine.md 的 /status 看板格式输出进度看板：

- 第几步/共几步 + 大白话阶段名
- 已完成 / 进行中（任务 X/Y）/ 最近存档点
- 待办任务列表（大白话任务名）
- 遗留与暂缓项（如有）
- 下一步一句话（不展开执行，用户想继续就说"继续"或 /continue）

只读不写：本命令不推进任何状态，只报告。
