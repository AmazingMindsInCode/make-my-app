#!/usr/bin/env bash
# 「我要做软件」会话启动提醒：检测当前项目是否有未完成的软件项目，
# 有则向会话注入一句中文提醒（additionalContext），提醒用户可以 /continue。
# 任何情况下静默退出（exit 0），绝不阻塞会话启动。

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || cd . 2>/dev/null

F=".make-my-app/progress.json"
[ -f "$F" ] || exit 0

# 提取字段（容错：没有该字段就置空）
get_field() {
  grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$F" 2>/dev/null | head -1 | sed 's/.*:[[:space:]]*"\(.*\)"/\1/'
}

NAME=$(get_field appName)
STAGE=$(get_field stage)
[ -n "$STAGE" ] || STAGE="unknown"

# 阶段 -> 大白话
case "$STAGE" in
  env-check)    STAGE_ZH="给电脑做体检" ;;
  requirement)  STAGE_ZH="聊清楚你想做什么" ;;
  solution)     STAGE_ZH="挑一个做法" ;;
  env-setup)    STAGE_ZH="给电脑装齐工具" ;;
  scaffold)     STAGE_ZH="搭软件骨架" ;;
  build)        STAGE_ZH="一个功能一个功能做" ;;
  verify)       STAGE_ZH="请独立考官验收" ;;
  ship)         STAGE_ZH="开门营业（上线）" ;;
  done)         STAGE_ZH="已交付" ;;
  *)            STAGE_ZH="$STAGE" ;;
esac

# 清理 JSON 不安全字符
NAME=${NAME//\\/／}; NAME=${NAME//\"/｝}
STAGE_ZH=${STAGE_ZH//\\/／}; STAGE_ZH=${STAGE_ZH//\"/｝}

if [ "$STAGE" = "done" ]; then
  MSG="【我要做软件】项目「${NAME}」已完成交付。想继续改进它，直接说需求即可；想做新软件用 /start。"
else
  MSG="【我要做软件】检测到未完成的项目「${NAME}」，当前阶段：${STAGE_ZH}。输入 /continue 继续，/status 看进度，/ask 问教练下一步做什么。"
fi

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}' "$MSG"
exit 0
