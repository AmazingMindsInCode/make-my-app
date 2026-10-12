# 黄金路径 · 已替用户选好的全部技术决策

新手不该做选择题。以下决策**全部默认，不问用户**；只有用户主动要求更换时才换，且换之前用一句话说明代价。mma-build / mma-ship 严格按本文执行。

## 一、版本与获取（国内直链优先）

| 组件 | 选定版本 | 从哪装（给用户的下载指引） | 装好的验证命令 |
|---|---|---|---|
| JDK | 17（Temurin） | 清华 Adoptium 镜像：`https://mirrors.tuna.tsinghua.edu.cn/Adoptium/17/jdk/x64/windows/` 选 `.msi` | `java -version` 显示 17.x |
| MySQL | 8.0.x Community Server | 官网 MySQL Installer（mysql-installer-community），安装类型选 **Server only** | `services.msc` 里有 MySQL80 且"正在运行" |
| Node.js | 22 LTS | 华为镜像：`https://mirrors.huaweicloud.com/nodejs/` 选 v22 最新 `.msi` | `node -v`（**搭骨架前必须装好**：页面构建和自动验收考卷都要用） |
| Git | 2.x 最新 | 官网 Windows 安装器，一路下一步 | `git --version` |
| Maven | **不安装** | 项目自带 mvnw 包装器（模板原样复制，Maven 本体从阿里云下载）+ 项目内阿里云镜像配置 | `backend` 目录下 `.\mvnw.cmd -v` |

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
│   ├── bin/server-ctl.mjs   # 测试实例开关（模板 server-ctl-mjs.txt）
│   └── tests/               # 考卷：_lib.mjs + run-tests.mjs（模板）+ 测试员出的 T#.mjs
├── backend/                 # 后端（服务端，管数据和业务）
│   ├── mvnw  mvnw.cmd  .mvn/        # 自带 Maven，用户不用装（三件套从模板原样复制）
│   │   ├── wrapper/maven-wrapper.properties  # Maven 本体从阿里云下载
│   │   └── aliyun-settings.xml      # 国内下载源配置
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/myapp/…         # 代码（按功能分包：controller/service/mapper/entity）+ HealthController + config/FlywayConfig
│       └── resources/
│           ├── application.yml      # 通用配置（不含密码）
│           ├── application-local.yml # 本机密码（.gitignore 排除，绝不进存档）
│           ├── application-test.yml # 测试实例：8081 端口 + 独立 test 库
│           ├── db/migration/        # 表结构迁移文件（V时间__说明.sql），随存档走
│           └── static/              # 前端成品自动放这里（打包后整个软件一个文件就能跑）
└── frontend/                # 前端（用户看到的页面），只在改页面时才需要动
    ├── package.json  vite.config.js  index.html
    └── src/…
```

## 三、关键配置（verbatim 模板）

### Maven 包装器（从模板原样复制，绝不凭记忆手写）

| 模板（`references/templates/`） | 复制到 |
|---|---|
| `mvnw-cmd.txt` | `backend/mvnw.cmd`（必须保持 Windows 换行，用 `cp` 复制文件，不要读出来再重写） |
| `mvnw-sh.txt` | `backend/mvnw`（Linux 服务器用） |
| `maven-wrapper-properties.txt` | `backend/.mvn/wrapper/maven-wrapper.properties`（Maven 本体从阿里云下载） |
| `aliyun-settings.xml` | `backend/.mvn/aliyun-settings.xml`（依赖从阿里云下载） |

前两个是 Apache Maven Wrapper 3.3.4 only-script 官方原件（纯文本，不需要 jar），2026-10-12 从阿里云镜像取得，SHA1 与 Maven 中央仓库一致。第一次运行会自动下载 Maven 3.9.9（约 9MB）到 `%USERPROFILE%\.m2\wrapper\`，以后就不用再下了。

### backend/pom.xml 要点
- parent：`spring-boot-starter-parent` 3.3.x
- `<java.version>17</java.version>`
- 依赖：`spring-boot-starter-web`、`spring-boot-starter-validation`、`mybatis-plus-spring-boot3-starter` 3.5.7、`mysql-connector-j`（runtime）、`flyway-core` + `flyway-mysql`（表结构迁移，版本跟随 Spring Boot）
- `<build><finalName>app</finalName></build>`（保证打包产物固定叫 `app.jar`）

### application.yml（不含任何密码）
```yaml
spring:
  profiles:
    active: local
  datasource:
    url: jdbc:mysql://localhost:3306/<库名>?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 在这里填你的MySQL密码
  flyway:
    locations: classpath:db/migration
    ignore-migration-patterns: "*:missing,*:future"   # 读档回旧版时，库里比代码"新"的迁移不报错
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

### application-test.yml（测试实例专用，进存档；不含密码，密码沿用 local）
```yaml
# 自动验收考卷用：8081 端口 + 独立 test 库，绝不碰你的真实数据
server:
  port: 8081
spring:
  datasource:
    url: "jdbc:mysql://localhost:3306/<库名>_test?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"
```
测试实例由 `.make-my-app/bin/server-ctl.mjs` 以 `-Dspring-boot.run.profiles=local,test` 启动，用户自己开的软件（8080）不受影响。

### 表结构（Flyway 迁移文件，放 `backend/src/main/resources/db/migration/`）

- 库和表都**不用手建**：软件启动时自动建库（`createDatabaseIfNotExist`），再按顺序执行迁移文件建表改表。正式库、test 库、L3 服务器上的库，走的是同一套文件。
- 每次建表或改表 = **新加一个文件**，文件名 `V{年月日时分}__{英文说明}.sql`，如 `V202610121430__create_bill.sql`。**一个文件只做一件事**（建一张表，或加一个字段），出错好收拾。
- 建表一律写 `CREATE TABLE IF NOT EXISTS`：读档后重做同一个功能、或者上次只跑了一半，再跑也不报错。
- **跑成功过的迁移文件绝不修改**：改了，下次启动会报 `Migrations have failed validation`。要改就再加一个新文件；已经误改了，就把文件恢复原样（从存档里取回）。
- **跑失败的迁移文件**（启动时报 SQL 错误）可以直接改好再启动，上次留下的失败记录由 FlywayConfig 自动清掉。报 `Duplicate column` 说明这个字段库里已经有了（读档不删字段，或上次跑了一半），删掉这句加字段的语句再启动。
- 新加的字段必须允许为空或带默认值（这样读档回旧版时，旧代码照样能存数据）。

```sql
-- V202610121430__create_bill.sql
CREATE TABLE IF NOT EXISTS t_bill (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  amount DECIMAL(12, 2) NOT NULL,
  bill_date DATE NOT NULL,
  category VARCHAR(20) NOT NULL,
  note VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### FlywayConfig（scaffold 必须生成：迁移失败后能自愈）
MySQL 的建表改表不能回滚，迁移文件写错导致启动失败时，库里会留下一条"失败"记录；不清掉的话，文件改对了也起不来，而新手电脑上通常没有 mysql 命令行可以手动清。
```java
package com.myapp.config;

import java.util.Arrays;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {
    // 上次迁移失败留下的记录先清掉，再按迁移文件建表改表
    @Bean
    public FlywayMigrationStrategy repairFailedThenMigrate() {
        return flyway -> {
            if (Arrays.stream(flyway.info().all()).anyMatch(m -> m.getState().isFailed())) {
                flyway.repair();
            }
            flyway.migrate();
        };
    }
}
```

### 健康检查接口（scaffold 必须生成，测试实例开关靠它判断"起来没有"）
```java
package com.myapp.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }
}
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
  call .\mvnw.cmd -s .mvn\aliyun-settings.xml package -DskipTests
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
start "backend" cmd /k "cd backend && .\mvnw.cmd -s .mvn\aliyun-settings.xml spring-boot:run"
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
.make-my-app/run/
.make-my-app/tests/last-run.json
.DS_Store
```

### 库名
- 库名 = 项目根目录名，把 `-` 换成 `_`（如 `family-ledger` → `family_ledger`）；test 库是它加 `_test`。同一台电脑做第二个软件也不会撞库。
- 搭骨架时把库名写进 progress.json 的 `dbName`。库不用手建，见上面"表结构"。

## 四、命名与代码约定（保持极简）

- Java 包名固定 `com.myapp`，按功能分 controller / service / mapper / entity 四层。
- 数据库表名蛇形前缀 `t_`（如 `t_bill`）；字段蛇形；实体用 MyBatis-Plus 注解。
- 接口路径 `/api/资源名`（小写复数，如 `/api/bills`）。
- 前端组件 PascalCase.vue；页面放 `src/views/`，公共件放 `src/components/`。
- **v1 天条：不引入** Redis、ES、消息队列、微服务、Docker、ORM 之外的一切。用户提出时先评估并如实告知复杂度，确需引入时记入 decisions。

## 五、构建与运行命令速查（mma-build / mma-verify / mma-ship 使用）

| 场景 | 命令（在 backend/ 目录） |
|---|---|
| 首次组装 | `.\mvnw.cmd -s .mvn\aliyun-settings.xml package -DskipTests` |
| 日常跑后端 | `.\mvnw.cmd -s .mvn\aliyun-settings.xml spring-boot:run` |
| 改了前端要出成品 | 先 `cd frontend && npm run build`（产物自动进 static），再打包 |
| 健康检查 | 浏览器打开 `http://localhost:8080`，或 `curl -s http://localhost:8080/api/health` |
| 起/停测试实例（在项目根） | `node .make-my-app/bin/server-ctl.mjs ensure` / `restart` / `stop` / `status` |
| 跑考卷（在项目根） | `node .make-my-app/tests/run-tests.mjs [T#…] [--restart]`（不带任务号 = 全量回归；改过后端代码必带 `--restart`） |

注意：Maven 命令**永远带** `-s .mvn\aliyun-settings.xml`，绝不裸跑 mvnw / mvn（用户机器上可能存在指向失效私服的全局配置，裸跑必失败）。
注意：mvnw **永远带路径调用**（cmd / PowerShell 里写 `.\mvnw.cmd`，Git Bash 里写 `./mvnw.cmd`），不要只写 `mvnw.cmd`：有的 AI 工具环境设置了 `NoDefaultCurrentDirectoryInExePath`，命令行不会在当前目录找程序，会报"不是内部或外部命令"。
