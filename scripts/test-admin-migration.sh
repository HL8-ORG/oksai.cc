#!/bin/bash

###############################################################################
# Admin 插件迁移运行脚本（本地测试版）
#
# 用途：在本地测试环境中运行 Admin 插件迁移
# 作者：AI Assistant
# 日期：2026-03-25
###############################################################################

set -e  # 遇到错误立即退出

echo "================================"
echo "Admin 插件迁移测试"
echo "================================"
echo ""

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 环境变量未设置"
    exit 1
fi
echo "✓ DATABASE_URL 已设置"

# 运行数据库迁移
echo ""
echo "运行数据库迁移..."
pnpm db:migrate

if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移失败"
    exit 1
fi

echo "✓ 数据库迁移成功"

# 运行用户角色迁移
echo ""
echo "运行用户角色迁移脚本..."
pnpm tsx scripts/migrate-admin-data.ts

if [ $? -ne 0 ]; then
    echo "❌ 用户角色迁移失败"
    exit 1
fi

echo "✓ 用户角色迁移成功"

# 运行测试
echo ""
echo "运行 Admin Controller 测试..."
pnpm vitest run apps/gateway/src/auth/admin*spec.ts

if [ $? -ne 0 ]; then
    echo "❌ 测试失败"
    exit 1
fi

echo "✓ 测试全部通过"

# 检查数据库字段
echo ""
echo "检查数据库字段..."
pnpm db:studio & --port 5432

# 验证字段
pnpx drizzle-kit check

echo ""
echo "================================"
echo "迁移完成 ✅"
echo "================================"
echo ""
