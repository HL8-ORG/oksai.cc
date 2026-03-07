#!/bin/bash

# 为所有库和应用添加 @oksai/tsconfig 依赖

echo "Adding @oksai/tsconfig dependency to all projects..."

# Node.js 库（使用 tsup）
libs_tsup=(
  "libs/shared/logger"
  "libs/shared/config"
  "libs/shared/constants"
  "libs/database"
  "libs/notification/email"
  "libs/shared/better-auth-mikro-orm"
  "libs/shared/nestjs-better-auth"
  "libs/shared/nestjs-utils"
  "libs/cache"
)

# Node.js 库（使用 tsc）
libs_tsc=(
  "libs/shared/kernel"
  "libs/shared/context"
  "libs/shared/exceptions"
  "libs/shared/event-store"
  "libs/shared/repository"
  "libs/shared/types"
  "libs/shared/utils"
  "libs/testing"
  "libs/oauth"
)

# 应用
apps=(
  "apps/gateway"
  "apps/web-admin"
)

# 处理库
for dir in "${libs_tsup[@]}" "${libs_tsc[@]}"; do
  if [ -f "$dir/package.json" ]; then
    echo "Processing $dir"
    # 检查是否已有依赖
    if ! jq -e '.devDependencies["@oksai/tsconfig"]' "$dir/package.json" > /dev/null 2>&1; then
      # 检查是否有 devDependencies
      if jq -e '.devDependencies' "$dir/package.json" > /dev/null 2>&1; then
        # 添加到现有的 devDependencies
        jq '.devDependencies["@oksai/tsconfig"] = "workspace:*"' "$dir/package.json" > tmp.json && mv tmp.json "$dir/package.json"
        echo "  ✅ Added @oksai/tsconfig dependency"
      else
        # 创建 devDependencies
        jq '.devDependencies = {"@oksai/tsconfig": "workspace:*"}' "$dir/package.json" > tmp.json && mv tmp.json "$dir/package.json"
        echo "  ✅ Created devDependencies and added @oksai/tsconfig"
      fi
    else
      echo "  ⏭️  Already has @oksai/tsconfig dependency"
    fi
  fi
done

# 处理应用
for dir in "${apps[@]}"; do
  if [ -f "$dir/package.json" ]; then
    echo "Processing $dir"
    if ! jq -e '.devDependencies["@oksai/tsconfig"]' "$dir/package.json" > /dev/null 2>&1; then
      if jq -e '.devDependencies' "$dir/package.json" > /dev/null 2>&1; then
        jq '.devDependencies["@oksai/tsconfig"] = "workspace:*"' "$dir/package.json" > tmp.json && mv tmp.json "$dir/package.json"
        echo "  ✅ Added @oksai/tsconfig dependency"
      else
        jq '.devDependencies = {"@oksai/tsconfig": "workspace:*"}' "$dir/package.json" > tmp.json && mv tmp.json "$dir/package.json"
        echo "  ✅ Created devDependencies and added @oksai/tsconfig"
      fi
    else
      echo "  ⏭️  Already has @oksai/tsconfig dependency"
    fi
  fi
done

echo ""
echo "Done! Next steps:"
echo "1. Run 'pnpm install' to link the packages"
echo "2. Update tsconfig.json files to use @oksai/tsconfig (located at libs/tsconfig/)"
echo "3. Verify with 'pnpm typecheck' and 'pnpm build'"
