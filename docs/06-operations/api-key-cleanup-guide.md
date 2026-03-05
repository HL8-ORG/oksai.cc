# API Key 迁移 - 旧代码清理指南

> **目标**: 安全地删除旧的 API Key 实现代码  
> **时机**: Week 4 Day 5 - 确认新功能稳定后  
> **原则**: 谨慎操作，保留回滚能力

---

## ⚠️ 重要提醒

**在删除旧代码前，必须确认：**

1. ✅ 新功能已全量发布（100% 流量）
2. ✅ 运行稳定至少 7 天
3. ✅ 无用户严重投诉
4. ✅ 错误率 < 0.1%
5. ✅ 性能符合预期
6. ✅ 数据迁移完成

---

## 📋 清理前检查清单

### 功能验证

- [ ] Better Auth API Key 创建功能正常
- [ ] Better Auth API Key 验证功能正常
- [ ] Better Auth API Key 列出功能正常
- [ ] Better Auth API Key 更新功能正常
- [ ] Better Auth API Key 删除功能正常
- [ ] Guard 验证正常
- [ ] 权限系统正常
- [ ] 速率限制正常

### 性能验证

- [ ] 响应时间 P95 < 50ms
- [ ] 错误率 < 0.1%
- [ ] 数据库查询正常
- [ ] 并发性能正常

### 用户反馈

- [ ] 无严重用户投诉
- [ ] 用户迁移完成
- [ ] 过渡期已结束

---

## 🗂️ 待清理的文件清单

### 1. 核心代码文件

| 文件 | 行数 | 状态 | 操作 |
|------|------|------|------|
| `api-key.service.ts` | 128 | ⚠️ 已废弃 | 🗑️ 删除或归档 |
| `api-key.integration.spec.ts` | 230 | ⚠️ 测试旧实现 | 🗑️ 删除或归档 |

### 2. 数据库相关

| 项目 | 状态 | 操作 |
|------|------|------|
| `api_keys` 表（旧） | ⚠️ 已废弃 | 📦 备份后删除（可选） |
| `apikey` 表（新） | ✅ 正在使用 | 保留 |

### 3. 文档文件

| 文件 | 状态 | 操作 |
|------|------|------|
| 旧的 API 文档 | ⚠️ 已过期 | 🗑️ 删除 |
| 旧的使用指南 | ⚠️ 已过期 | 🗑️ 删除 |

---

## 📦 清理步骤

### Step 1: 备份旧代码（重要！）

```bash
# 1. 创建备份分支
git checkout -b backup/old-api-key-implementation

# 2. 提交当前状态
git add .
git commit -m "backup: 旧 API Key 实现备份"

# 3. 推送到远程
git push origin backup/old-api-key-implementation

# 4. 切回主分支
git checkout main

# 5. 创建清理分支
git checkout -b chore/cleanup-old-api-key-code
```

### Step 2: 归档旧代码（推荐）

```bash
# 1. 创建归档目录
mkdir -p archive/deprecated/api-key

# 2. 移动旧文件到归档目录
git mv apps/gateway/src/auth/api-key.service.ts \
  archive/deprecated/api-key/api-key.service.deprecated.ts

git mv apps/gateway/src/auth/api-key.integration.spec.ts \
  archive/deprecated/api-key/api-key.integration.deprecated.spec.ts

# 3. 添加归档说明
cat > archive/deprecated/api-key/README.md << 'EOF'
# 已废弃的 API Key 实现

**状态**: 已废弃  
**迁移时间**: 2026-03-11  
**新实现**: Better Auth API Key 插件  
**原因**: 使用官方插件，减少维护成本

## 文件说明

- `api-key.service.deprecated.ts`: 旧的自定义实现（128 行）
- `api-key.integration.deprecated.spec.ts`: 旧的集成测试（230 行）

## 回滚说明

如果需要回滚，请：
1. 恢复这些文件到原位置
2. 更新 `auth.module.ts` 重新引入 ApiKeyService
3. 回滚数据库迁移

## 参考文档

- [迁移计划](../../docs/api-key-migration-plan.md)
- [最终报告](../../docs/api-key-migration-final-report.md)
EOF

# 4. 提交归档
git add archive/deprecated/api-key/
git commit -m "chore: 归档旧的 API Key 实现"
```

### Step 3: 删除旧代码（谨慎！）

**⚠️ 仅在确认新功能稳定后执行！**

```bash
# 1. 删除旧的 Service 文件
git rm apps/gateway/src/auth/api-key.service.ts

# 2. 删除旧的集成测试
git rm apps/gateway/src/auth/api-key.integration.spec.ts

# 3. 提交删除
git commit -m "chore: 删除已废弃的 API Key 实现"
```

### Step 4: 清理数据库（可选）

**⚠️ 仅在过渡期结束后执行（2 周后）！**

```sql
-- 1. 备份旧表（重要！）
CREATE TABLE api_keys_backup AS SELECT * FROM api_keys;

-- 2. 重命名旧表（而不是立即删除）
ALTER TABLE api_keys RENAME TO api_keys_deprecated;

-- 3. 等待 1 个月确认无问题后，再删除
-- DROP TABLE api_keys_deprecated;
```

### Step 5: 更新文档

```bash
# 1. 删除旧的 API 文档
git rm docs/old-api-key-guide.md

# 2. 更新 README
# 移除对旧实现的引用

# 3. 更新 CHANGELOG
echo "
## v1.5.0 - 2026-03-11

### Breaking Changes
- 移除自定义 API Key 实现
- 使用 Better Auth API Key 插件
- 所有用户需要重新生成 API Key

### Migration
- 参考: docs/api-key-migration-plan.md
- 邮件通知已发送
- 过渡期: 2 周
" >> CHANGELOG.md

# 4. 提交文档更新
git add .
git commit -m "docs: 更新 API Key 迁移文档"
```

---

## 🔄 回滚方案

### 如果需要回滚

```bash
# 1. 恢复归档的代码
git checkout backup/old-api-key-implementation -- \
  apps/gateway/src/auth/api-key.service.ts \
  apps/gateway/src/auth/api-key.integration.spec.ts

# 2. 恢复数据库表
psql $DATABASE_URL << 'EOF'
DROP TABLE IF EXISTS apikey;
ALTER TABLE api_keys_deprecated RENAME TO api_keys;
EOF

# 3. 更新 auth.module.ts
# 重新引入 ApiKeyService

# 4. 重新部署
kubectl set image deployment/gateway \
  gateway=oksai/gateway:v1.4.0 \
  --record
```

---

## 📊 清理后的效果

### 代码量减少

| 项目 | 之前 | 之后 | 减少 |
|------|------|------|------|
| Service 代码 | 128 行 | 0 行 | -128 行 |
| 集成测试 | 230 行 | 0 行 | -230 行 |
| **总计** | **358 行** | **0 行** | **-358 行** |

### 维护成本降低

| 项目 | 之前 | 之后 | 改进 |
|------|------|------|------|
| 自行维护 | 是 | 否 | -100% |
| 安全更新 | 手动 | 自动 | +∞ |
| Bug 修复 | 手动 | 官方 | +∞ |

---

## ✅ 清理后验证

### 功能验证

```bash
# 1. 运行所有测试
pnpm test

# 2. 运行集成测试
pnpm vitest run apps/gateway/src/auth/api-key-better-auth.spec.ts

# 3. 手动测试
curl -X POST https://api.oksai.cc/api/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key"}'
```

### 代码质量验证

```bash
# 1. TypeScript 类型检查
pnpm tsc --noEmit

# 2. Lint 检查
pnpm lint

# 3. 代码格式化
pnpm format
```

### 部署验证

```bash
# 1. 构建应用
pnpm build

# 2. 部署到生产环境
kubectl set image deployment/gateway \
  gateway=oksai/gateway:v1.5.1 \
  --record

# 3. 验证部署
kubectl get pods -l app=gateway
kubectl logs -f deployment/gateway
```

---

## 📝 清理日志模板

```markdown
# API Key 旧代码清理日志

## 清理时间
- 日期: 2026-03-18
- 操作人: [姓名]

## 清理内容
- [ ] 归档 api-key.service.ts
- [ ] 归档 api-key.integration.spec.ts
- [ ] 更新文档
- [ ] 更新 CHANGELOG

## 验证结果
- [ ] 所有测试通过
- [ ] TypeScript 编译成功
- [ ] Lint 检查通过
- [ ] 功能验证通过

## 备注
- 备份分支: backup/old-api-key-implementation
- 清理分支: chore/cleanup-old-api-key-code
```

---

## 🎯 清理后的维护

### 定期检查

- [ ] 每周检查 Better Auth 更新
- [ ] 每月检查安全公告
- [ ] 每季度评估性能

### 监控指标

- [ ] 错误率 < 0.1%
- [ ] 响应时间 P95 < 50ms
- [ ] API Key 验证成功率 > 99.9%

### 文档维护

- [ ] 更新 API 文档
- [ ] 更新用户指南
- [ ] 更新故障排查手册

---

**清理完成时间**: 2026-03-18  
**清理负责人**: [姓名]  
**验证人**: [姓名]
