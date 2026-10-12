# 防坑清单 · 来自 508 个真实开发会话的教训

每一条都在真实项目中反复发生过。执行任何阶段前先扫一眼本文；遇到对应症状直接按"怎么救"处理，不要重新发明解法。

| # | 症状（用户看到什么） | 真实原因 | 怎么防（插件规则） | 怎么救（当下解法） |
|---|---|---|---|---|
| P1 | 项目一建就编译报错、文件名变 `????` | 项目路径含中文（Windows shell 转码毁掉 POM） | env-check 强制"纯英文路径"检查，不通过不开工 | 把项目挪到纯英文路径（如 `D:\myapps\jizhang`），路径里也不要有 `#` `!` 等特殊字符 |
| P2 | 下载依赖报 401 / 依赖解析失败 | 用户机器的全局 Maven 配置指向失效私服 | 永远用项目内配置：`mvnw.cmd -s .mvn\aliyun-settings.xml`，**禁止裸跑** mvn/mvnw | 删掉报错缓存重试：确认命令带了 `-s`；仍失败则检查 `C:\Users\<用户>\.m2\settings.xml` 是否有私服配置，提醒用户这是全局配置在捣乱 |
| P3 | 编译报 `cannot find symbol` 但代码看着没问题 | JDK 版本错位（PATH 里的 java 不是 17） | 每次构建前先 `java -version` 确认 17 | 重装/修正 JDK17 后**重开一个终端**再试（旧终端记着旧 PATH） |
| P4 | AI 改文件报"文件已被修改" | 用户同时用别的编辑器开着同一文件 | **每次 Edit 前必须重新 Read** 目标文件 | 重新 Read 后以磁盘最新内容为准继续；提醒用户同一时间只用一个工具改代码 |
| P5 | AI 说"修好了"，用户一试还是坏的 | 没有复现验证就宣布完成 | **修复后必须重跑原始故障场景**（浏览器/命令行）并展示证据，禁止"应该修好了" | 回到 mma-verify 修复闭环：复现→修→再复现验证→给用户看 |
| P6 | 页面样式/位置问题反复改不对 | AI 视觉判断在像素级不可靠（把矩形判成椭圆的真事） | 布局/尺寸类问题用**脚本测量**（读元素坐标尺寸），不信截图目测 | 写一小段 node/python 脚本输出元素 getBoundingClientRect 数值对比 |
| P7 | 命令行发中文内容的请求，服务端收到 `??` | Git Bash 编码问题 | 带中文的请求体先写入临时 json 文件，用 `curl -d @file.json` 发 | 同左；或改用 node_repl / 浏览器控制台发请求 |
| P8 | 启动报端口被占（8080/3306） | 上次启动的进程没退干净 | 启动前 `netstat -ano \| findstr :8080` 检查 | `taskkill /PID <pid> /F`（注意：可能只杀了外层 shell，确认进程真没了再重启） |
| P9 | 数据库连不上 | MySQL 服务没启动 / 密码错 / 库没建 | env-setup 完成时必须做连接测试并落盘结果 | 服务：`net start MySQL80`（或 services.msc 手动启）；密码：重置或改 application-local.yml；建库见 golden-path |
| P10 | 长时间命令输出刷屏，看不到关键信息 | 构建日志淹没输出 | 长命令输出重定向到文件再 grep 关键行 | `命令 > build.log 2>&1` 然后 `grep -E "ERROR\|BUILD" build.log` |
| P11 | npm install 卡住或失败 | 直连国外源慢/超时 | 装 Node 后立即换 npmmirror 源；install 显式带 `--registry` | `npm config set registry https://registry.npmmirror.com` 后重装 |
| P12 | 前端改了但页面没变 | 浏览器缓存 / vite dev server 没在跑 / 忘了 build | 改前端必须确认 dev server 在跑；出成品必须 `npm run build` | 浏览器 Ctrl+F5 硬刷新；检查 5173 端口进程 |
| P13 | "当前页面接口一直报错" | 后端没启动 / 接口路径前缀不一致 / 代理没配 | 后端接口一律 `/api/` 前缀；vite 代理配好 `/api`；启动顺序：先后端再前端 | 按序检查：8080 活着吗 → 浏览器直接开 `http://localhost:8080/api/health` 通吗 → 5173 页面里请求路径对吗 |
| P14 | 存档点里混进了密码/垃圾文件 | .gitignore 不全就 commit | mma-savepoint 每次存档前检查敏感与冗余文件清单 | 已提交的密码文件：从 git 历史移除 + 立即改密码，并补 .gitignore |
| P15 | 会话中断后 AI 忘了进度 | 依赖会话记忆 | 进度只认 `.make-my-app/progress.json` + 工件，每次激活重新读盘 | `/continue` 走启动协议恢复 |
| P16 | 代办安装"成功"但命令还是找不到 | winget 装的 PATH 只对新终端生效；部分机器 winget 被组策略禁用或缺失 | 代办安装后必须提示"重开终端/重启 ZCode"再验证；winget 先 `winget --version` 探测 | 重开终端仍不行→手动加 PATH 或改装包方式；winget 不可用→直接走官方安装包静默安装或手把手模式 |

## 使用方式

- mma-env / mma-build / mma-verify / mma-ship 在各自流程的关键节点（开工前、构建前、修复后、上线前）对照本文相应条目执行。
- 遇到本文没有覆盖的新坑：先解决，解决后**把新坑追加到本表**（这也是插件自我进化的入口），并在 progress.json 的 decisions 里记一条。
