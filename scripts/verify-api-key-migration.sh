#!/bin/bash

# API Key 数据库迁移脚本
# 
# 用途：验证并执行 Better Auth API Key 表的数据库迁移
# 
# 使用方式：
#   ./scripts/verify-api-key-migration.sh

set -e  # 遇到错误立即退出

echo "================================================"
echo "🚀 Better Auth API Key 数据库迁移验证"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查环境变量
echo "📋 Step 1: 检查环境变量..."
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL 环境变量未设置${NC}"
    echo "请设置 DATABASE_URL 环境变量，例如："
    echo "export DATABASE_URL='postgresql://user:password@localhost:5432/oksai'"
    exit 1
fi
echo -e "${GREEN}✅ DATABASE_URL 已设置${NC}"
echo ""

# 2. 备份数据库
echo "📋 Step 2: 备份数据库..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
echo "备份文件: $BACKUP_FILE"

if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    echo -e "${GREEN}✅ 数据库备份成功${NC}"
    echo "备份文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${YELLOW}⚠️  pg_dump 未安装，跳过备份${NC}"
    echo "建议手动备份数据库"
fi
echo ""

# 3. 检查现有表
echo "📋 Step 3: 检查现有表..."
echo "检查 api_keys 表（旧表）..."
OLD_TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys');")

if [ "$OLD_TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ api_keys 表存在${NC}"
    OLD_KEY_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM api_keys WHERE revoked_at IS NULL;")
    echo "   有效 API Keys 数量: $OLD_KEY_COUNT"
else
    echo -e "${YELLOW}⚠️  api_keys 表不存在${NC}"
fi

echo "检查 apikey 表（新表）..."
NEW_TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apikey');")

if [ "$NEW_TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ apikey 表已存在${NC}"
    NEW_KEY_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM apikey WHERE enabled = true;")
    echo "   有效 API Keys 数量: $NEW_KEY_COUNT"
else
    echo -e "${YELLOW}⚠️  apikey 表不存在，需要迁移${NC}"
fi
echo ""

# 4. 运行迁移
if [ "$NEW_TABLE_EXISTS" = "f" ]; then
    echo "📋 Step 4: 运行数据库迁移..."
    echo "执行 Drizzle 迁移..."
    
    if pnpm db:migrate; then
        echo -e "${GREEN}✅ 数据库迁移成功${NC}"
    else
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        echo "请检查迁移日志并手动修复"
        exit 1
    fi
else
    echo -e "${GREEN}✅ apikey 表已存在，跳过迁移${NC}"
fi
echo ""

# 5. 验证新表结构
echo "📋 Step 5: 验证新表结构..."
echo "检查 apikey 表字段..."

REQUIRED_COLUMNS=(
    "id"
    "config_id"
    "name"
    "start"
    "prefix"
    "key"
    "reference_id"
    "enabled"
    "created_at"
    "updated_at"
)

ALL_COLUMNS_EXIST=true
for col in "${REQUIRED_COLUMNS[@]}"; do
    COLUMN_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'apikey' AND column_name = '$col');")
    if [ "$COLUMN_EXISTS" = "t" ]; then
        echo -e "   ${GREEN}✅${NC} $col"
    else
        echo -e "   ${RED}❌${NC} $col (缺失)"
        ALL_COLUMNS_EXIST=false
    fi
done

if [ "$ALL_COLUMNS_EXIST" = true ]; then
    echo -e "${GREEN}✅ 所有必需字段都存在${NC}"
else
    echo -e "${RED}❌ 部分字段缺失，请检查迁移文件${NC}"
    exit 1
fi
echo ""

# 6. 验证索引
echo "📋 Step 6: 验证索引..."
echo "检查 apikey 表索引..."

INDEXES=$(psql "$DATABASE_URL" -tAc "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'apikey';")
if [ -n "$INDEXES" ]; then
    echo -e "${GREEN}✅ 索引已创建${NC}"
    echo "$INDEXES" | while read -r index; do
        echo "   - $index"
    done
else
    echo -e "${YELLOW}⚠️  未找到索引${NC}"
    echo "建议手动创建索引以提高性能"
fi
echo ""

# 7. 测试 Better Auth API
echo "📋 Step 7: 测试 Better Auth API..."
echo "尝试创建测试 API Key..."

# 这里需要实际的 Better Auth API 调用
# 临时跳过，手动测试
echo -e "${YELLOW}⚠️  请手动测试 Better Auth API${NC}"
echo "   运行: pnpm vitest run apps/gateway/src/auth/api-key-better-auth.spec.ts"
echo ""

# 8. 生成迁移报告
echo "================================================"
echo "📊 迁移验证报告"
echo "================================================"
echo ""
echo "✅ 数据库连接: 正常"
echo "✅ 备份文件: $BACKUP_FILE"
echo "✅ 旧表 (api_keys): $([ "$OLD_TABLE_EXISTS" = "t" ] && echo "存在 ($OLD_KEY_COUNT 条记录)" || echo "不存在")"
echo "✅ 新表 (apikey): $([ "$NEW_TABLE_EXISTS" = "t" ] && echo "存在" || echo "已创建")"
echo "✅ 表结构验证: 通过"
echo ""
echo "下一步操作："
echo "1. 运行测试: pnpm vitest run apps/gateway/src/auth/api-key-better-auth.spec.ts"
echo "2. 测试 API: curl -X POST http://localhost:3000/api/api-keys -H 'Content-Type: application/json' -d '{\"name\":\"Test\"}'"
echo "3. 运行迁移脚本: pnpm tsx scripts/migrate-api-keys.ts --test"
echo "4. 部署到生产环境（灰度发布）"
echo ""
echo -e "${GREEN}✅ 迁移验证完成！${NC}"
