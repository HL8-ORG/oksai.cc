#!/bin/bash

# 批量迁移所有项目到 @oksai/tsconfig

set -e

echo "开始批量迁移 TypeScript 配置..."

# 定义项目类型和对应的配置
declare -A PROJECT_CONFIGS=(
  ["libs/shared/kernel"]="node-library"
  ["libs/shared/context"]="node-library"
  ["libs/shared/config"]="node-library"
  ["libs/shared/constants"]="node-library"
  ["libs/shared/types"]="node-library"
  ["libs/shared/utils"]="node-library"
  ["libs/shared/exceptions"]="node-library"
  ["libs/shared/event-store"]="node-library"
  ["libs/shared/repository"]="node-library"
  ["libs/shared/better-auth-mikro-orm"]="node-library"
  ["libs/shared/nestjs-better-auth"]="node-library"
  ["libs/shared/nestjs-utils"]="node-library"
  ["libs/testing"]="node-library"
  ["libs/shared/database"]="node-library"
  ["libs/shared/cache"]="node-library"
  ["libs/notification/email"]="node-library"
  ["libs/oauth"]="node-library"
  ["apps/web-admin"]="tanstack-start"
)

# 更新 package.json 添加 @oksai/tsconfig 依赖
update_package_json() {
  local project_dir="$1"
  local package_file="$project_dir/package.json"
  
  if [ ! -f "$package_file" ]; then
    echo "    ⚠️  package.json 不存在，跳过"
    return
  fi
  
  # 使用 Node.js 更新 JSON
  node -e "
    const fs = require('fs');
    const path = '$package_file';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    if (!pkg.devDependencies) {
      pkg.devDependencies = {};
    }
    
    if (!pkg.devDependencies['@oksai/tsconfig']) {
      pkg.devDependencies['@oksai/tsconfig'] = 'workspace:*';
      
      // 排序 devDependencies
      const sorted = {};
      Object.keys(pkg.devDependencies).sort().forEach(key => {
        sorted[key] = pkg.devDependencies[key];
      });
      pkg.devDependencies = sorted;
      
      fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
      console.log('    ✅ 已添加 @oksai/tsconfig 到 package.json');
    } else {
      console.log('    ⏭️  @oksai/tsconfig 已存在');
    }
  "
}

# 更新 tsconfig.json
update_tsconfig_json() {
  local project_dir="$1"
  local config_type="$2"
  local tsconfig_file="$project_dir/tsconfig.json"
  
  if [ ! -f "$tsconfig_file" ]; then
    echo "    ⚠️  tsconfig.json 不存在，跳过"
    return
  fi
  
  # 备份原文件
  cp "$tsconfig_file" "$tsconfig_file.bak"
  
  # 使用 Node.js 更新 JSON
  node -e "
    const fs = require('fs');
    const path = '$tsconfig_file';
    const configType = '$config_type';
    const tsconfig = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    // 更新 extends
    tsconfig.extends = '@oksai/tsconfig/' + configType + '.json';
    
    // 移除已经被预设包含的配置项（保留项目特定的配置）
    const removeKeys = [
      'composite', 'declaration', 'declarationMap', 'sourceMap',
      'module', 'moduleResolution', 'target', 'lib', 'types',
      'jsx', 'emitDecoratorMetadata', 'experimentalDecorators',
      'allowSyntheticDefaultImports', 'esModuleInterop', 'skipLibCheck',
      'strict', 'strictNullChecks', 'noImplicitAny', 'strictBindCallApply',
      'forceConsistentCasingInFileNames', 'noFallthroughCasesInSwitch',
      'resolveJsonModule', 'isolatedModules', 'noEmit', 'importHelpers'
    ];
    
    if (tsconfig.compilerOptions) {
      removeKeys.forEach(key => {
        if (tsconfig.compilerOptions.hasOwnProperty(key)) {
          delete tsconfig.compilerOptions[key];
        }
      });
    }
    
    fs.writeFileSync(path, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log('    ✅ 已更新 tsconfig.json');
  "
}

# 更新 tsconfig.build.json
update_tsconfig_build_json() {
  local project_dir="$1"
  local config_type="$2"
  local tsconfig_build_file="$project_dir/tsconfig.build.json"
  
  if [ ! -f "$tsconfig_build_file" ]; then
    echo "    ⏭️  tsconfig.build.json 不存在，跳过"
    return
  fi
  
  # 备份原文件
  cp "$tsconfig_build_file" "$tsconfig_build_file.bak"
  
  # 使用 Node.js 更新 JSON
  node -e "
    const fs = require('fs');
    const path = '$tsconfig_build_file';
    const configType = '$config_type';
    const tsconfig = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    // 更新 extends 为数组
    tsconfig.extends = [
      '@oksai/tsconfig/' + configType + '.json',
      '@oksai/tsconfig/build.json'
    ];
    
    // 移除已经被预设包含的配置项
    const removeKeys = [
      'declaration', 'declarationMap', 'sourceMap', 'removeComments',
      'composite', 'module', 'moduleResolution', 'target', 'lib'
    ];
    
    if (tsconfig.compilerOptions) {
      removeKeys.forEach(key => {
        if (tsconfig.compilerOptions.hasOwnProperty(key)) {
          delete tsconfig.compilerOptions[key];
        }
      });
      
      // 确保有 composite: false
      tsconfig.compilerOptions.composite = false;
    }
    
    fs.writeFileSync(path, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log('    ✅ 已更新 tsconfig.build.json');
  "
}

# 迁移所有项目
for project_dir in "${!PROJECT_CONFIGS[@]}"; do
  config_type="${PROJECT_CONFIGS[$project_dir]}"
  
  echo ""
  echo "处理: $project_dir (配置: $config_type)"
  
  if [ -d "$project_dir" ]; then
    # 更新 package.json
    update_package_json "$project_dir"
    
    # 更新 tsconfig.json
    update_tsconfig_json "$project_dir" "$config_type"
    
    # 更新 tsconfig.build.json（如果存在）
    update_tsconfig_build_json "$project_dir" "$config_type"
    
    echo "  ✅ 完成"
  else
    echo "  ⚠️  目录不存在"
  fi
done

echo ""
echo "======================================"
echo "迁移完成！"
echo ""
echo "后续步骤："
echo "1. 检查修改的文件: git diff"
echo "2. 运行 pnpm install"
echo "3. 验证类型检查: pnpm nx run-many -t typecheck --all"
echo "4. 验证构建: pnpm build"
echo "5. 如有问题，可以从 .bak 文件恢复"
echo "======================================"
