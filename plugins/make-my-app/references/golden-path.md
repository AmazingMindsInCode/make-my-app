# 黄金路径 · 已替用户选好的全部技术决策

新手不该做选择题。以下决策**全部默认，不问用户**；只有用户主动要求更换时才换，且换之前用一句话说明代价。mma-build / mma-ship 严格按本文执行。

## 一、版本与获取（国内直链优先）

| 组件 | 选定版本 | 从哪装（给用户的下载指引） | 装好的验证命令 |
|---|---|---|---|
| JDK | 17（Temurin） | 清华 Adoptium 镜像：`https://mirrors.tuna.tsinghua.edu.cn/Adoptium/17/jdk/x64/windows/` 选 `.msi` | `java -version` 显示 17.x |
| MySQL | 8.0.x Community Server | 官网 MySQL Installer（mysql-installer-community），安装类型选 **Server only** | `services.msc` 里有 MySQL80 且"正在运行" |
| Node.js | 22 LTS | 华为镜像：`https://mirrors.huaweicloud.com/nodejs/` 选 v22 最新 `.msi` | `node -v`（只在要改页面时才必须装） |
| Git | 2.x 最新 | 官网 Windows 安装器，一路下一步 | `git --version` |
| Maven | **不安装** | 项目自带 mvnw 包装器 + 项目内阿里云镜像配置 | `backend` 目录下 `mvnw.cmd -v` |

npm 换国内源（装 Node 后第一件事）：
```
npm config set registry https://registry.npmmirror.com
```

## 二、项目骨架（标准布局，scaffold 按此生成）

```
<项目名-纯英文小写>/
├── start.bat                # 双击启动（打包好的成品）
├── dev.bat                  # 开发期启动（改代码时用）
├── README.md                # 项目使用说明（新手版，模板见 templates/project-README.md）
├── .gitignore
├── .make-my-app/            # 进度与文档（progress.json / requirement.md / acceptance-report.md）
├── backend/                 # 后端（服务端，管数据和业务）
│   ├── mvnw  mvnw.cmd  .mvn/        # 自带 Maven，用户不用装
│   │   └── aliyun-settings.xml      # 国内下载源配置
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/myapp/…         # 代码（按功能分包：controller/service/mapper/entity）
│       └── resources/
│           ├── application.yml      # 通用配置（不含密码）
│           ├── application-local.yml # 本机密码（.gitignore 排除，绝不进存档）
│           └── static/              # 前端成品自动放这里（打包后整个软件一个文件就能跑）
└── frontend/                # 前端（用户看到的页面），只在改页面时才需要动
    ├── package.json  vite.config.js  index.html
    └── src/…
```

## 三、关键配置（verbatim 模板）

### backend/pom.xml 要点
- parent：`spring-boot-starter-parent` 3.3.x
- `<java.version>17</java.version>`
- 依赖：`spring-boot-starter-web`、`spring-boot-starter-validation`、`mybatis-plus-spring-boot3-starter` 3.5.7、`mysql-connector-j`（runtime）
- `<build><finalName>app</finalName></build>`（保证打包产物固定叫 `app.jar`）

### application.yml（不含任何密码）
```yaml
spring:
  profiles:
    active: local
  datasource:
    url: jdbc:mysql://localhost:3306/myapp?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 在这里填你的MySQL密码
  servlet:
    multipart:
      max-file-size: 20MB
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
server:
  port: 8080
```

### application-local.yml（真密码只在这里；.gitignore 已排除）
```yaml
spring:
  datasource:
    password: 用户装MySQL时设置的密码
```

### frontend/vite.config.js
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: { outDir: '../backend/src/main/resources/static', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } }
})
```
（约定：后端所有接口一律 `/api/` 前缀，Controller 写 `@RequestMapping("/api/xxx")`）

### start.bat（成品双击即用）
```bat
@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if not exist "target\app.jar" (
  echo 第一次运行，先组装软件，需要几分钟，以后就不用了...
  call mvnw.cmd -s .mvn\aliyun-settings.xml package -DskipTests
)
echo 软件启动中，完成后会自动打开浏览器...
start "" http://localhost:8080
java -jar target\app.jar
pause
```

### dev.bat（开发期，前后端一起跑）
```bat
@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "backend" cmd /k "cd backend && mvnw.cmd -s .mvn\aliyun-settings.xml spring-boot:run"
cd frontend
if not exist node_modules ( call npm install )
call npm run dev
pause
```

### .gitignore（项目根）
```
node_modules/
target/
*.log
backend/src/main/resources/application-local.yml
.DS_Store
```

### MySQL 建库（mma-env 装好后执行一次）
```sql
CREATE DATABASE myapp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

## 四、命名与代码约定（保持极简）

- Java 包名固定 `com.myapp`，按功能分 controller / service / mapper / entity 四层。
- 数据库表名蛇形前缀 `t_`（如 `t_bill`）；字段蛇形；实体用 MyBatis-Plus 注解。
- 接口路径 `/api/资源名`（小写复数，如 `/api/bills`）。
- 前端组件 PascalCase.vue；页面放 `src/views/`，公共件放 `src/components/`。
- **v1 天条：不引入** Redis、ES、消息队列、微服务、Docker、ORM 之外的一切。用户提出时先评估并如实告知复杂度，确需引入时记入 decisions。

## 五、构建与运行命令速查（mma-build / mma-verify / mma-ship 使用）

| 场景 | 命令（在 backend/ 目录） |
|---|---|
| 首次组装 | `mvnw.cmd -s .mvn\aliyun-settings.xml package -DskipTests` |
| 日常跑后端 | `mvnw.cmd -s .mvn\aliyun-settings.xml spring-boot:run` |
| 改了前端要出成品 | 先 `cd frontend && npm run build`（产物自动进 static），再打包 |
| 健康检查 | 浏览器打开 `http://localhost:8080`，或 `curl -s http://localhost:8080/api/health` |

注意：Maven 命令**永远带** `-s .mvn\aliyun-settings.xml`，绝不裸跑 mvnw / mvn（用户机器上可能存在指向失效私服的全局配置，裸跑必失败）。
