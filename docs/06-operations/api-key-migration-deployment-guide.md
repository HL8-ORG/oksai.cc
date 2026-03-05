# API Key 迁移 - Week 4 灰度发布指南

> **目标**: 安全地将 API Key 迁移到生产环境  
> **策略**: 灰度发布（10% → 50% → 100%）  
> **时间**: 2026-03-11

---

## 📋 发布前检查清单

### 1. 代码审查

- [ ] 所有代码已通过 Code Review
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试全部通过
- [ ] Lint 检查无错误
- [ ] TypeScript 类型检查通过

### 2. 数据库准备

- [ ] 生产数据库已备份
- [ ] 迁移脚本已在测试环境验证
- [ ] 回滚方案已准备就绪

### 3. 监控准备

- [ ] 错误监控已配置（Sentry/Datadog）
- [ ] 性能监控已配置
- [ ] 日志聚合已配置
- [ ] 告警规则已设置

### 4. 团队准备

- [ ] 团队成员已知晓发布计划
- [ ] 值班人员已安排
- [ ] 回滚流程已培训

---

## 🚀 灰度发布流程

### Phase 1: 10% 流量（Day 1-2）

**目标**: 小范围验证功能正常

#### Step 1: 数据库迁移

```bash
# 1. 备份数据库
./scripts/verify-api-key-migration.sh

# 2. 运行迁移
pnpm db:migrate

# 3. 验证迁移成功
psql $DATABASE_URL -c "\d apikey"
```

#### Step 2: 部署代码（灰度 10%）

```bash
# 1. 部署到生产环境（灰度 10%）
# 根据你的部署工具（Kubernetes/Docker/PM2）进行配置

# 示例：Kubernetes 灰度发布
kubectl set image deployment/gateway \
  gateway=oksai/gateway:v1.5.0-better-auth \
  --record

# 2. 配置灰度规则（10% 流量）
# 使用 Ingress/Service Mesh 配置流量分割

# 3. 验证部署状态
kubectl get pods -l app=gateway
kubectl logs -f deployment/gateway
```

#### Step 3: 监控指标（2 小时）

**关键指标：**

| 指标 | 阈值 | 告警 |
|------|------|------|
| 错误率 | < 0.1% | 🔴 > 0.1% |
| 响应时间 P95 | < 50ms | 🔴 > 100ms |
| 响应时间 P99 | < 100ms | 🔴 > 200ms |
| API Key 验证失败率 | < 0.5% | 🔴 > 1% |
| 数据库查询时间 | < 10ms | 🔴 > 20ms |

**监控命令：**

```bash
# 1. 查看实时日志
kubectl logs -f deployment/gateway | grep "api-key"

# 2. 查看错误日志
kubectl logs deployment/gateway | grep -i error

# 3. 查看性能指标
# 使用你的监控工具（Grafana/Datadog）
```

#### Step 4: 验证功能

```bash
# 1. 创建测试 API Key
curl -X POST https://api.oksai.cc/api/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key"}'

# 2. 验证 API Key
curl -X GET https://api.oksai.cc/api/protected \
  -H "X-API-Key: $API_KEY"

# 3. 列出 API Keys
curl -X GET https://api.oksai.cc/api/api-keys \
  -H "Authorization: Bearer $TOKEN"
```

#### Step 5: 用户反馈收集

- [ ] 监控用户支持工单
- [ ] 监控社交媒体反馈
- [ ] 监控应用评分

---

### Phase 2: 50% 流量（Day 3）

**目标**: 扩大验证范围

#### Step 1: 扩大流量到 50%

```bash
# 配置灰度规则（50% 流量）
# 更新 Ingress/Service Mesh 配置
```

#### Step 2: 监控指标（4 小时）

**检查项目：**

- [ ] 错误率是否稳定
- [ ] 响应时间是否正常
- [ ] 数据库负载是否正常
- [ ] 用户反馈是否正常

#### Step 3: 性能测试

```bash
# 1. 负载测试（可选）
# 使用 Apache Bench 或 k6

# 2. 压力测试（可选）
# 模拟高并发场景
```

---

### Phase 3: 100% 流量（Day 4）

**目标**: 全量发布

#### Step 1: 全量发布

```bash
# 配置灰度规则（100% 流量）
# 所有流量切换到新版本
```

#### Step 2: 监控指标（24 小时）

**持续监控：**

- [ ] 错误率
- [ ] 响应时间
- [ ] 数据库性能
- [ ] 用户反馈

#### Step 3: 用户通知

```bash
# 1. 发送邮件通知
# 运行邮件发送脚本（需要配置邮件服务）

# 2. 发布迁移公告
# 发布到官网、博客、社交媒体

# 3. 更新文档
# 更新 API 文档和用户指南
```

---

## 🔄 回滚方案

### 自动回滚条件

**立即回滚，如果：**

- 🔴 错误率 > 1%
- 🔴 响应时间 P95 > 200ms
- 🔴 API Key 验证失败率 > 5%
- 🔴 数据库连接失败
- 🔴 用户严重投诉

### 回滚步骤

```bash
# 1. 切换流量到旧版本
kubectl set image deployment/gateway \
  gateway=oksai/gateway:v1.4.0 \
  --record

# 2. 验证回滚成功
kubectl rollout status deployment/gateway

# 3. 恢复数据库（如果需要）
psql $DATABASE_URL < backup_YYYYMMDD.sql

# 4. 通知团队
# 发送告警通知
```

---

## 📊 监控仪表板

### Grafana 仪表板配置

**关键图表：**

1. **请求量**（QPS）
   - 总请求量
   - API Key 验证请求量
   - 错误请求量

2. **响应时间**
   - P50 / P95 / P99
   - API Key 创建时间
   - API Key 验证时间

3. **错误率**
   - 总错误率
   - 4xx 错误
   - 5xx 错误

4. **数据库性能**
   - 查询时间
   - 连接池状态
   - 慢查询

### 告警规则

**PagerDuty/OpsGenie 配置：**

```yaml
# 示例告警规则
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 2m
  annotations:
    summary: "High error rate detected"
    
- alert: SlowResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.1
  for: 5m
  annotations:
    summary: "Slow response time detected"
```

---

## ✅ 发布后验证

### 功能验证清单

- [ ] 可以创建 API Key
- [ ] 可以列出 API Keys
- [ ] 可以获取单个 API Key
- [ ] 可以更新 API Key
- [ ] 可以删除 API Key
- [ ] Guard 验证正常
- [ ] 权限系统正常
- [ ] 速率限制正常

### 性能验证

- [ ] 响应时间 P95 < 50ms
- [ ] 数据库查询 < 10ms
- [ ] 并发 1000 req/s 无错误
- [ ] 内存使用正常
- [ ] CPU 使用正常

### 数据验证

- [ ] 旧 API Keys 仍然可用（过渡期）
- [ ] 新 API Keys 正常工作
- [ ] 数据迁移无丢失
- [ ] 权限映射正确

---

## 📝 发布日志模板

```markdown
# API Key 迁移发布日志

## 发布时间
- 开始: 2026-03-11 10:00 UTC
- 完成: 2026-03-11 14:00 UTC

## 发布版本
- 旧版本: v1.4.0 (自定义实现)
- 新版本: v1.5.0 (Better Auth)

## 发布范围
- Phase 1: 10% 流量 (10:00-12:00)
- Phase 2: 50% 流量 (12:00-13:00)
- Phase 3: 100% 流量 (13:00-14:00)

## 关键指标
- 错误率: 0.02% ✅
- 响应时间 P95: 35ms ✅
- API Key 验证成功率: 99.8% ✅

## 问题记录
- 无

## 团队
- 发布负责人: XXX
- 值班人员: XXX
- 技术支持: XXX
```

---

## 📞 应急联系方式

**技术团队：**
- 发布负责人: [姓名] - [电话/Slack]
- 数据库 DBA: [姓名] - [电话/Slack]
- 运维团队: [姓名] - [电话/Slack]

**业务团队：**
- 产品经理: [姓名] - [电话/Slack]
- 客服团队: [姓名] - [电话/Slack]

---

## 🎯 成功标准

**发布成功的标准：**

1. ✅ 所有功能正常工作
2. ✅ 错误率 < 0.1%
3. ✅ 响应时间 P95 < 50ms
4. ✅ 无用户严重投诉
5. ✅ 数据迁移无丢失
6. ✅ 性能符合预期

**完成时间**: 2026-03-11
