#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[sync] 当前目录: $SCRIPT_DIR"

if [ ! -d .git ]; then
  echo "[sync] 错误：当前目录不是 Git 仓库（缺少 .git 目录）"
  exit 1
fi

# 优先同步 main，不存在时回退到 master
TARGET_BRANCH="main"
if ! git show-ref --verify --quiet refs/heads/main; then
  if git show-ref --verify --quiet refs/heads/master; then
    TARGET_BRANCH="master"
  fi
fi

echo "[sync] 拉取远程更新..."
git fetch origin

echo "[sync] 切换到 $TARGET_BRANCH 分支..."
git checkout "$TARGET_BRANCH"

echo "[sync] 强制同步到 origin/$TARGET_BRANCH ..."
git reset --hard "origin/$TARGET_BRANCH"
git clean -fd

echo "[sync] ✅ 同步完成，当前版本："
git log --oneline -n 1
