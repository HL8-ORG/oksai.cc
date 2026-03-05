# Admin 插件部署指南

> **版本**: v1.0  
> **日期**: 2026-03-25  
> **状态**: 准备就生产环境  
> **优先级**: P0（Critical）

---

## 📋 目录

1. [部署前检查清单](#1-部署前检查清单)
2. [灰度发布方案](#2-灰度发布方案)
3. [监控与告警](#3-监控与告警)
4. [回滚方案](#4-回滚方案)
5. [常见问题排查](#5-常见问题排查)

---

## 1. 部署前检查清单

### 1.1 数据库检查

#### 1.1.1 数据备份

```bash
# 备份数据库
pg_dump -h localhost -U oksai oksai > backup_before_admin_migration_$(date +%Y%m%d).sql

# 验证备份文件
ls -lh backup_before_admin_migration_*.sql
```

**预计备份文件大小**: ~50-100MB（取决于数据库大小）

#### 1.1.2 数据库迁移

```bash
# 运行数据库迁移
pnpm db:migrate

# 验证迁移结果
# 检查新字段是否添加
psql -h localhost -U oksai oksai -c "\d user"
```

**预期结果**:
- ✅ 添加 4 个新字段：`banned`, `ban_reason`, `banned_at`, `ban_expires`
- ✅ 所有现有数据保留完整
- ✅ 迁移时间：< 1 秒

### 1.2 代码检查

#### 1.2.1 安装依赖

```bash
# 检查 Better Auth 版本
pnpm list better-auth @better-auth/api-key

# 预期版本：better-auth@1.5.2, @better-auth/api-key@1.5.2
```

#### 1.2.2 构建项目

```bash
# 构建 Gateway
pnpm nx build @oksai/gateway

# 检查构建输出
# 预期：构建成功，无错误
```

#### 1.2.3 运行测试

```bash
# 运行单元测试
pnpm vitest run apps/gateway/src/auth/admin*spec.ts

# 预期：44/44 测试通过（100%）
```

### 1.3 环境检查

#### 1.3.1 环境变量

必需的环境变量：

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/oksai
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000

# OAuth (可选)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

#### 1.3.2 端口检查

```bash
# 检查数据库端口
netstat -tuln | grep 5432

# 检查应用端口
netstat -tuln | grep 3000
```

---

## 2. 灰度发布方案

### 2.1 灰度策略

采用 3 阶段灰度发布：

| 阶段 | 流量比例 | 持续时间 | 目标用户 |
|------|---------|---------|---------|
| **阶段 1** | 10% | 2 小时 | 内部测试用户 |
| **阶段 2** | 50% | 4 小时 | Beta 测试用户 |
| **阶段 3** | 100% | 持续监控 | 所有用户 |

### 2.2 阶段 1： 10% 流量（内部测试）

**时间**: 2 小时

**步骤**:

1. **切换流量**
   ```bash
   # 使用特性标志或路由到新代码
   # 方案 A: 使用请求头
   # 在 API Gateway 中间件中添加：
   if (Math.random() < 0.1) {
     req.headers['x-admin-migration'] = 'v2';
   }
   
   # 方案 B: 使用用户白名单（推荐）
   # 创建白名单文件
   echo "admin-test@example.com" > /tmp/admin-whitelist.txt
   
   # 在 Guard 中检查
   const whitelist = fs.readFileSync('/tmp/admin-whitelist.txt', 'utf-8').split('\n');
   const useNewCode = whitelist.includes(req.user.email);
   ```

2. **监控指标**
   - 错误率：< 1%
   - 响应时间：< 200ms
   - 数据库查询时间：< 50ms

3. **验证项目**
   - [ ] 登录功能正常
   - [ ] 用户管理功能正常
   - [ ] 角色设置功能正常
   - [ ] 用户模拟功能正常

### 2.3 阶段 2: 50% 流量（Beta 测试）

**时间**: 4 小时

**步骤**:

1. **切换流量**
   ```bash
   # 调整流量比例为 50%
   if (Math.random() < 0.5) {
     req.headers['x-admin-migration'] = 'v2';
   }
   ```

2. **监控指标**
   - 错误率：< 0.5%
   - 响应时间：< 200ms
   - 用户反馈：无重大投诉

   - [ ] 完整的用户生命周期测试
   - [ ] 权限验证测试
   - [ ] 性能测试

### 2.4 阶段 3: 100% 流量（全量发布）

**时间**: 持续监控

**步骤**:

1. **全量发布**
   ```bash
   # 移除流量切换逻辑
   # 所有用户使用新代码
   ```

2. **持续监控**
   - 错误率：< 0.1%
   - 响应时间：< 100ms
   - 用户满意度：> 90%
   - 系统稳定性：> 99.9%

3. **最终验证**
   - [ ] 所有管理功能正常
   - [ ] 权限系统稳定
   - [ ] 无用户投诉
   - [ ] 性能符合预期

---

## 3. 监控与告警

### 3.1 监控指标

#### 应用层指标

| 指标 | 告警阈值 | 描述 |
|------|---------|------|
| **错误率** | > 1% | 5 分钟内错误率超过 1% |
| **响应时间** | > 500ms | P95 响应时间超过 500ms |
| **吞吐量** | < 100 req/s | 每秒请求数低于 100 |
| **CPU 使用率** | > 80% | CPU 使用率超过 80% |
| **内存使用率** | > 80% | 内存使用率超过 80% |

#### 数据库指标

| 指标 | 告警阈值 | 描述 |
|------|---------|------|
| **查询时间** | > 100ms | 平均查询时间超过 100ms |
| **慢查询** | > 1s | 查询时间超过 1 秒 |
| **连接数** | > 90% | 数据库连接数超过限制的 90% |
| **锁等待** | > 10 | 等待锁的查询超过 10 个 |

#### 业务指标

| 指标 | 告警阈值 | 描述 |
|------|---------|------|
| **登录成功率** | < 95% | 登录成功率低于 95% |
| **用户管理操作** | > 100/min | 用户管理操作频率过高 |
| **模拟操作** | > 10/min | 用户模拟操作频率过高 |

### 3.2 监控工具

推荐使用：

1. **应用监控**: New Relic / Datadog
2. **日志监控**: ELK Stack / Loki
3. **数据库监控**: pgAdmin / Prometheus + Grafana
4. **告警系统**: PagerDuty / Opsgenie

### 3.3 告警配置

```yaml
# 示例 Prometheus 告警规则
groups:
  - name: admin_high_error_rate
    rules:
      - alert: HighErrorRate
        expr: rate(admin_http_errors[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          description: "Admin 功能错误率过高"
          
  - name: admin_slow_response
    rules:
      - alert: SlowResponse
        expr: histogram_quantile(admin_http_duration_seconds[5m]) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          description: "Admin 功能响应时间过慢"
```

---

## 4. 回滚方案

### 4.1 数据库回滚

```bash
# 1. 恢复数据库备份
psql -h localhost -U oksai oksai < backup_before_admin_migration_20260325.sql

# 2. 遇到问题立即停止应用
pm2 stop @oksai/gateway

# 3. 切换回旧代码
git checkout previous-version
git reset --hard HEAD~1

# 4. 重启应用
pnpm nx serve @oksai/gateway
```

### 4.2 代码回滚

```bash
# 1. 停止应用
pm2 stop @oksai/gateway

# 2. 回滚 Git 提交
git revert HEAD~1

# 3. 重启应用
pnpm nx serve @oksai/gateway
```

### 4.3 回滚时间表

| 问题严重程度 | 回滚时间 | 操作 |
|-------------|---------|------|
| **Critical** | < 5 分钟 | 立即回滚 |
| **High** | < 15 分钟 | 评估后回滚 |
| **Medium** | < 30 分钟 | 修复或回滚 |

---

## 5. 常见问题排查

### 5.1 数据库迁移失败

**症状**: 迁移脚本报错，字段不存在

**原因**:
- 数据库权限不足
- SQL 语法错误
- 表已存在

**解决方案**:
```bash
# 1. 检查数据库权限
psql -h localhost -U oksai oksai -c "\du user"

# 2. 手动执行迁移
psql -h localhost -U oksai oksai < libs/database/drizzle/0005_strong_fixer.sql

# 3. 验证迁移
psql -h localhost -U oksai oksai -c "\d user"
```

### 5.2 权限验证失败

**症状**: 管理员无法访问管理功能

**原因**:
- 用户角色未正确迁移
- 权限检查逻辑错误
- Session 中缺少角色信息

**解决方案**:
```bash
# 1. 检查用户角色
psql -h localhost -U oksai oksai -c "SELECT id, email, role FROM \"user\" WHERE role = 'admin';"

# 2. 检查 Session
SELECT id, user_id, user->role FROM session;

# 3. 手动设置角色
UPDATE "user" SET role = 'admin' WHERE email = 'admin@example.com';
```

### 5.3 性能下降

**症状**: API 响应时间明显增加

**原因**:
- 数据库查询未优化
- 缺少索引
- N+1 查询问题

**解决方案**:
```bash
# 1. 检查慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

# 2. 添加索引
CREATE INDEX idx_user_role ON "user"(role);
CREATE INDEX idx_user_banned ON "user"(banned);

# 3. 优化查询
# 使用 EXPLAIN ANALYZE 分析慢查询
EXPLAIN ANALYZE SELECT * FROM "user" WHERE role = 'admin';
```

### 5.4 用户模拟失败

**症状**: 模拟用户时报错

**原因**:
- 目标用户不存在
- 权限不足
- Better Auth API 错误

**解决方案**:
```bash
# 1. 检查目标用户
SELECT * FROM "user" WHERE id = 'target-user-id';

# 2. 检查管理员权限
SELECT role FROM "user" WHERE id = 'admin-user-id';

# 3. 检查 Better Auth 日志
# 查看应用日志中的 Better Auth 错误信息
```

---

## 6. 部署后任务

### 6.1 文档更新

- [ ] 更新 API 文档
- [ ] 更新用户指南
- [ ] 更新运维文档
- [ ] 更新开发文档

### 6.2 清理工作

- [ ] 移除旧的 `impersonation.service.ts`
- [ ] 清理测试数据
- [ ] 归档旧代码分支

### 6.3 用户通知

- [ ] 发送邮件通知管理员
- [ ] 更新系统公告
- [ ] 提供新功能培训

### 6.4 持续监控

- [ ] 监控 7 天
- [ ] 收集用户反馈
- [ ] 性能报告
- [ ] 最终验收

---

## 7. 联系人

| 角色 | 姓名 | 联系方式 |
|------|------|---------|
| **技术负责人** | [姓名] | [邮箱] |
| **后端开发** | [姓名] | [邮箱] |
| **运维** | [姓名] | [邮箱] |
| **QA** | [姓名] | [邮箱] |

---

## 8. 附录

### 8.1 相关文档

- [Better Auth Admin Plugin](https://better-auth.com/docs/plugins/admin)
- [迁移计划](./admin-plugin-migration-plan.md)
- [Week 1 报告](./admin-plugin-migration-week1-report.md)
- [Week 2 报告](./admin-plugin-migration-week2-report.md)

### 8.2 更新历史

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2026-03-25 | v1.0 | 初始版本 | AI Assistant |

---

**文档状态**: 📋 准备部署  
**下一步**: 完成部署前检查清单
