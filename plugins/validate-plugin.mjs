#!/usr/bin/env node
// make-my-app 插件结构校验（开发用，不属于插件本体）
// 用法：node validate-plugin.mjs
import { readFileSync, existsSync, readdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'make-my-app');
const problems = [];
const oks = [];
const ok = (m) => oks.push(m);
const bad = (m) => problems.push(m);

// 1. 清单与必需文件
const requiredFiles = [
  '.zcode-plugin/plugin.json',
  'README.md',
  'LICENSE',
  'hooks/hooks.json',
  'hooks/session-start.sh',
  'references/state-machine.md',
  'references/golden-path.md',
  'references/pitfalls.md',
  'references/glossary.md',
  'references/experience-log.md',
  'references/addons-registry.md',
  'references/templates/requirement.md',
  'references/templates/experience-log.md',
  'references/templates/solution-card.md',
  'references/templates/acceptance-report.md',
  'references/templates/project-README.md',
  'references/templates/aliyun-settings.xml',
  'references/templates/start-bat.txt',
  'references/templates/dev-bat.txt',
  'references/templates/server-ctl-mjs.txt',
  'references/templates/tests-lib-mjs.txt',
  'references/templates/run-tests-mjs.txt',
  'references/templates/mvnw-cmd.txt',
  'references/templates/mvnw-sh.txt',
  'references/templates/maven-wrapper-properties.txt',
];
for (const f of requiredFiles) {
  existsSync(join(root, f)) ? ok(`文件存在: ${f}`) : bad(`缺文件: ${f}`);
}

// 2. JSON 合法性 + 关键字段
let manifest = null;
for (const jf of ['.zcode-plugin/plugin.json', 'hooks/hooks.json']) {
  try { JSON.parse(readFileSync(join(root, jf), 'utf8')); ok(`JSON 合法: ${jf}`); }
  catch (e) { bad(`JSON 解析失败: ${jf} → ${e.message}`); }
}
try {
  manifest = JSON.parse(readFileSync(join(root, '.zcode-plugin/plugin.json'), 'utf8'));
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/.test(manifest.name || '')) bad(`name 不合规: ${manifest.name}`);
  else ok(`name 合规: ${manifest.name}`);
  const dirOk = root.endsWith(manifest.name);
  dirOk ? ok('目录名 = manifest.name') : bad(`目录名(${root})与 name(${manifest.name})不一致`);
  for (const comp of ['skills', 'commands', 'agents']) {
    if (manifest[comp] && !existsSync(join(root, manifest[comp]))) bad(`清单声明的 ${comp} 目录不存在`);
  }
  if (manifest.hooks && !existsSync(join(root, manifest.hooks))) bad(`清单声明的 hooks 文件不存在: ${manifest.hooks}`);
} catch { /* 已在上面报过 */ }

// 3. marketplace.json 与插件版本一致
try {
  const mp = JSON.parse(readFileSync(join(dirname(root), 'marketplace.json'), 'utf8'));
  const entry = (mp.plugins || []).find(p => p.name === 'make-my-app');
  if (!entry) bad('marketplace.json 缺 make-my-app 条目');
  else if (manifest && entry.version !== manifest.version) bad(`版本不一致: marketplace=${entry.version} manifest=${manifest.version}`);
  else ok(`marketplace 条目与版本一致 (${entry?.version})`);
  if (entry && !existsSync(join(dirname(root), entry.source, '.zcode-plugin', 'plugin.json'))) bad('marketplace source 路径指错');
  else ok('marketplace source 路径正确');
} catch (e) { bad(`marketplace.json 解析失败: ${e.message}`); }

// 4. SKILL.md frontmatter：name 与目录一致、description ≤1024、无外部 skill 依赖
const skillsDir = join(root, 'skills');
for (const d of readdirSync(skillsDir, { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name)) {
  const p = join(skillsDir, d, 'SKILL.md');
  if (!existsSync(p)) { bad(`skill 目录缺 SKILL.md: ${d}`); continue; }
  const text = readFileSync(p, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { bad(`无 frontmatter: ${d}`); continue; }
  const fm = m[1];
  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  const desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim() ?? '';
  name === d ? ok(`skill name=目录: ${d}`) : bad(`skill name(${name}) ≠ 目录(${d})`);
  const len = [...desc].length;
  len <= 1024 ? ok(`description ${len} 字 ≤1024: ${d}`) : bad(`description ${len} 字超限: ${d}`);
  len >= 30 ? ok(`description 足够具体(${len}字): ${d}`) : bad(`description 太短(${len}字): ${d}`);
  // 自包含性：引用的 references 相对路径必须存在
  for (const ref of text.matchAll(/\.\.\/\.\.\/references\/([A-Za-z0-9\-\/\.]+)/g)) {
    const rel = `references/${ref[1]}`;
    existsSync(join(root, rel)) ? ok(`引用存在: ${d} → ${rel}`) : bad(`${d} 引用不存在的文件: ${rel}`);
  }
}

// 5. commands frontmatter
for (const c of readdirSync(join(root, 'commands'))) {
  const text = readFileSync(join(root, 'commands', c), 'utf8');
  /^---/.test(text) ? ok(`command 有 frontmatter: ${c}`) : bad(`command 缺 frontmatter: ${c}`);
  for (const sk of text.matchAll(/^skills:\s*(\S+)/gm)) {
    const target = join(skillsDir, sk[1], 'SKILL.md');
    existsSync(target) ? ok(`command ${c} 预载的 skill 存在: ${sk[1]}`) : bad(`command ${c} 预载的 skill 不存在: ${sk[1]}`);
  }
}

// 6. agents frontmatter
for (const a of readdirSync(join(root, 'agents'))) {
  const text = readFileSync(join(root, 'agents', a), 'utf8');
  const has = /^---[\s\S]*?^name:/m.test(text);
  has ? ok(`agent 有 frontmatter: ${a}`) : bad(`agent 缺 frontmatter/name: ${a}`);
}

// 7. 钩子脚本语法
const r = spawnSync('bash', ['-n', join(root, 'hooks', 'session-start.sh')], { encoding: 'utf8' });
r.status === 0 ? ok('session-start.sh 语法通过 (bash -n)') : bad(`session-start.sh 语法错误: ${r.stderr}`);

// 7b. 考卷工具模板语法（.txt 存放，复制成 .mjs 后 node --check）
const tmp = mkdtempSync(join(tmpdir(), 'mma-validate-'));
for (const t of ['server-ctl-mjs.txt', 'tests-lib-mjs.txt', 'run-tests-mjs.txt']) {
  const src = join(root, 'references', 'templates', t);
  if (!existsSync(src)) continue;
  const dst = join(tmp, t.replace(/-mjs\.txt$/, '.mjs'));
  copyFileSync(src, dst);
  const c = spawnSync(process.execPath, ['--check', dst], { encoding: 'utf8' });
  c.status === 0 ? ok(`模板语法通过 (node --check): ${t}`) : bad(`模板语法错误: ${t} → ${c.stderr}`);
}
rmSync(tmp, { recursive: true, force: true });

// 7b2. 钩子脚本必须是 Unix 换行（Git Bash 遇到 \r 会报错，钩子静默失效）
const hookSh = join(root, 'hooks', 'session-start.sh');
if (existsSync(hookSh)) {
  readFileSync(hookSh, 'utf8').includes('\r') ? bad('session-start.sh 含 Windows 换行（\\r），钩子会失效') : ok('session-start.sh 为 LF 换行');
}

// 7c. Maven 包装器模板：mvnw.cmd 必须是 CRLF（LF 会让 cmd 解析批处理出错），properties 必须指向阿里云
const mvnwCmd = join(root, 'references', 'templates', 'mvnw-cmd.txt');
if (existsSync(mvnwCmd)) {
  const text = readFileSync(mvnwCmd, 'utf8');
  /\r\n/.test(text) && !/[^\r]\n/.test(text) ? ok('mvnw-cmd.txt 为 CRLF 换行') : bad('mvnw-cmd.txt 换行不是纯 CRLF');
}
const wrapperProps = join(root, 'references', 'templates', 'maven-wrapper-properties.txt');
if (existsSync(wrapperProps)) {
  /^distributionUrl=https:\/\/maven\.aliyun\.com\/.+-bin\.zip\s*$/m.test(readFileSync(wrapperProps, 'utf8'))
    ? ok('maven-wrapper-properties 指向阿里云 -bin.zip')
    : bad('maven-wrapper-properties 的 distributionUrl 不是阿里云 -bin.zip');
}

// 8. 自包含性粗查：不得依赖本机私有的具名 skill（mma-find-skill 提及安装目标目录 ~/.agents/skills/ 属合法，不算依赖）
const banned = [/\.claude\/skills\//, /\b(grilling|team-orchestrator|superpowers|need-explorer|plugin-creator|dynamic-workflows)\b/];
for (const d of readdirSync(skillsDir, { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name)) {
  const text = readFileSync(join(skillsDir, d, 'SKILL.md'), 'utf8');
  for (const b of banned) if (b.test(text)) bad(`自包含违规: ${d} 依赖了外部具名 skill`);
}

console.log(`\n=== 校验结果：${oks.length} 项通过，${problems.length} 项问题 ===`);
for (const p of problems) console.log('❌ ' + p);
if (!problems.length) console.log('✅ 全部通过');
process.exit(problems.length ? 1 : 0);
