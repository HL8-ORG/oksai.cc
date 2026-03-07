# 领域层测试示例

完整的 **DDD + 六边形架构 + Event Sourcing** 领域层测试示例，包括聚合根、实体、值对象、业务规则和领域事件测试。

---

## 📚 完整示例

```typescript
/**
 * 领域层测试完整示例
 *
 * 展示：
 * - 聚合根测试（Event Sourcing）
 * - 值对象测试
 * - 业务规则验证
 * - 领域事件测试
 * - 多租户场景测试
 * - AAA 模式（Arrange-Act-Assert）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Job } from './job.aggregate';
import { JobId } from './job-id.vo';
import { JobTitle } from './job-title.vo';
import { JobStatus, JobStatusEnum } from './job-status.vo';
import { JobCreatedEvent } from './events/job-created.event';
import { JobStartedEvent } from './events/job-started.event';

// ==================== 聚合根测试（Event Sourcing）====================

describe('Job Aggregate', () => {
  describe('create', () => {
    it('should create job with valid data', () => {
      // Arrange
      const props = {
        id: JobId.create(),
        title: JobTitle.create('测试任务').value,
        tenantId: 'tenant-123',
        createdBy: 'user-456',
      };

      // Act
      const job = Job.create(props);

      // Assert
      expect(job.id).toBeDefined();
      expect(job.title.value).toBe('测试任务');
      expect(job.tenantId).toBe('tenant-123');
      expect(job.createdBy).toBe('user-456');
      expect(job.status.value).toBe(JobStatusEnum.PENDING);
    });

    it('should trigger JobCreatedEvent when created', () => {
      // Arrange
      const props = {
        id: JobId.create(),
        title: JobTitle.create('测试任务').value,
        tenantId: 'tenant-123',
        createdBy: 'user-456',
      };

      // Act
      const job = Job.create(props);

      // Assert
      expect(job.domainEvents).toHaveLength(1);
      const event = job.domainEvents[0] as JobCreatedEvent;
      expect(event.eventType).toBe('job.created');
      expect(event.jobId).toBe(job.id);
      expect(event.title.value).toBe('测试任务');
    });
  });

  describe('start', () => {
    let job: Job;

    beforeEach(() => {
      job = Job.create({
        id: JobId.create(),
        title: JobTitle.create('测试任务').value,
        tenantId: 'tenant-123',
        createdBy: 'user-456',
      });
    });

    it('should start pending job', () => {
      // Act
      job.start();

      // Assert
      expect(job.status.value).toBe(JobStatusEnum.RUNNING);
      expect(job.startedAt).toBeDefined();
    });

    it('should trigger JobStartedEvent', () => {
      // Arrange
      job.clearDomainEvents();

      // Act
      job.start();

      // Assert
      expect(job.domainEvents).toHaveLength(1);
      const event = job.domainEvents[0] as JobStartedEvent;
      expect(event.eventType).toBe('job.started');
      expect(event.jobId).toBe(job.id);
    });

    it('should fail when job is already running', () => {
      // Arrange
      job.start();

      // Act & Assert
      expect(() => job.start()).toThrow('任务已在运行中');
    });

    it('should fail when job is completed', () => {
      // Arrange
      job.start();
      job.complete();

      // Act & Assert
      expect(() => job.start()).toThrow('已完成的任务不能重新启动');
    });
  });

  describe('complete', () => {
    let job: Job;

    beforeEach(() => {
      job = Job.create({
        id: JobId.create(),
        title: JobTitle.create('测试任务').value,
        tenantId: 'tenant-123',
        createdBy: 'user-456',
      });
      job.start();
      job.clearDomainEvents();
    });

    it('should complete running job', () => {
      // Act
      job.complete();

      // Assert
      expect(job.status.value).toBe(JobStatusEnum.COMPLETED);
      expect(job.completedAt).toBeDefined();
    });

    it('should trigger JobCompletedEvent', () => {
      // Act
      job.complete();

      // Assert
      expect(job.domainEvents).toHaveLength(1);
      const event = job.domainEvents[0] as JobCompletedEvent;
      expect(event.eventType).toBe('job.completed');
    });
  });

  describe('fail', () => {
    let job: Job;

    beforeEach(() => {
      job = Job.create({
        id: JobId.create(),
        title: JobTitle.create('测试任务').value,
        tenantId: 'tenant-123',
        createdBy: 'user-456',
      });
      job.start();
      job.clearDomainEvents();
    });

    it('should fail running job with error message', () => {
      // Act
      job.fail('执行失败：内存不足');

      // Assert
      expect(job.status.value).toBe(JobStatusEnum.FAILED);
      expect(job.errorMessage).toBe('执行失败：内存不足');
    });

    it('should trigger JobFailedEvent', () => {
      // Act
      job.fail('执行失败');

      // Assert
      expect(job.domainEvents).toHaveLength(1);
      const event = job.domainEvents[0] as JobFailedEvent;
      expect(event.eventType).toBe('job.failed');
      expect(event.errorMessage).toBe('执行失败');
    });
  });
});

// ==================== 值对象测试 ====================

describe('JobTitle Value Object', () => {
  describe('create', () => {
    it('should create title with valid format', () => {
      // Arrange
      const title = '测试任务';

      // Act
      const result = JobTitle.create(title);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe('测试任务');
    });

    it('should trim whitespace', () => {
      // Arrange
      const title = '  测试任务  ';

      // Act
      const result = JobTitle.create(title);

      // Assert
      expect(result.value.value).toBe('测试任务');
    });

    it('should fail when title is empty', () => {
      // Arrange
      const title = '';

      // Act
      const result = JobTitle.create(title);

      // Assert
      expect(result.isFail()).toBe(true);
      expect(result.value.field).toBe('title');
    });

    it('should fail when title is too short', () => {
      // Arrange
      const title = '测';

      // Act
      const result = JobTitle.create(title);

      // Assert
      expect(result.isFail()).toBe(true);
      expect(result.value.message).toContain('2-100');
    });

    it('should fail when title is too long', () => {
      // Arrange
      const title = '测'.repeat(101);

      // Act
      const result = JobTitle.create(title);

      // Assert
      expect(result.isFail()).toBe(true);
      expect(result.value.message).toContain('2-100');
    });
  });

  describe('equality', () => {
    it('should be equal when titles are same', () => {
      // Arrange
      const title1 = JobTitle.create('测试任务').value;
      const title2 = JobTitle.create('测试任务').value;

      // Act & Assert
      expect(title1.equals(title2)).toBe(true);
    });

    it('should not be equal when titles are different', () => {
      // Arrange
      const title1 = JobTitle.create('任务1').value;
      const title2 = JobTitle.create('任务2').value;

      // Act & Assert
      expect(title1.equals(title2)).toBe(false);
    });
  });
});

describe('JobStatus Value Object', () => {
  describe('create', () => {
    it('should create status with valid value', () => {
      // Arrange & Act
      const status = JobStatus.create(JobStatusEnum.PENDING);

      // Assert
      expect(status.value).toBe(JobStatusEnum.PENDING);
    });

    it('should check if can transition to new status', () => {
      // Arrange
      const pending = JobStatus.create(JobStatusEnum.PENDING);
      const running = JobStatus.create(JobStatusEnum.RUNNING);

      // Act & Assert
      expect(pending.canTransitionTo(running)).toBe(true);
    });

    it('should fail invalid transition', () => {
      // Arrange
      const completed = JobStatus.create(JobStatusEnum.COMPLETED);
      const running = JobStatus.create(JobStatusEnum.RUNNING);

      // Act & Assert
      expect(completed.canTransitionTo(running)).toBe(false);
    });
  });
});

// ==================== 多租户场景测试 ====================

describe('Multi-Tenant Scenarios', () => {
  it('should associate job with tenant', () => {
    // Arrange
    const tenantId = 'tenant-123';

    // Act
    const job = Job.create({
      id: JobId.create(),
      title: JobTitle.create('测试任务').value,
      tenantId,
      createdBy: 'user-456',
    });

    // Assert
    expect(job.tenantId).toBe(tenantId);
  });

  it('should include tenantId in domain events', () => {
    // Arrange
    const tenantId = 'tenant-123';

    // Act
    const job = Job.create({
      id: JobId.create(),
      title: JobTitle.create('测试任务').value,
      tenantId,
      createdBy: 'user-456',
    });

    // Assert
    const event = job.domainEvents[0] as JobCreatedEvent;
    expect(event.tenantId).toBe(tenantId);
  });
});

// ==================== 领域事件测试 ====================

describe('Job Domain Events', () => {
  it('should collect multiple events', () => {
    // Arrange
    const job = Job.create({
      id: JobId.create(),
      title: JobTitle.create('测试任务').value,
      tenantId: 'tenant-123',
      createdBy: 'user-456',
    });

    // Act
    job.start();
    job.complete();

    // Assert
    expect(job.domainEvents).toHaveLength(3); // Created + Started + Completed
  });

  it('should clear events', () => {
    // Arrange
    const job = Job.create({
      id: JobId.create(),
      title: JobTitle.create('测试任务').value,
      tenantId: 'tenant-123',
      createdBy: 'user-456',
    });
    expect(job.domainEvents).toHaveLength(1);

    // Act
    job.clearDomainEvents();

    // Assert
    expect(job.domainEvents).toHaveLength(0);
  });

  it('should preserve event order', () => {
    // Arrange
    const job = Job.create({
      id: JobId.create(),
      title: JobTitle.create('测试任务').value,
      tenantId: 'tenant-123',
      createdBy: 'user-456',
    });

    // Act
    job.start();
    job.complete();

    // Assert
    expect(job.domainEvents[0].eventType).toBe('job.created');
    expect(job.domainEvents[1].eventType).toBe('job.started');
    expect(job.domainEvents[2].eventType).toBe('job.completed');
  });
});
```

---

## 🎯 测试模式总结

### 1. AAA 模式（Arrange-Act-Assert）

```typescript
it('should start pending job', () => {
  // Arrange - 准备测试数据
  const job = Job.create({
    id: JobId.create(),
    title: JobTitle.create('测试任务').value,
    tenantId: 'tenant-123',
    createdBy: 'user-456',
  });

  // Act - 执行操作
  job.start();

  // Assert - 验证结果
  expect(job.status.value).toBe(JobStatusEnum.RUNNING);
  expect(job.startedAt).toBeDefined();
});
```

### 2. 测试命名

```typescript
// ✅ 好的命名：描述行为和期望
it('should start pending job', () => { ... });
it('should fail when job is already running', () => { ... });
it('should trigger JobStartedEvent', () => { ... });

// ❌ 避免的命名：描述实现细节
it('test start method', () => { ... });
it('test job status', () => { ... });
```

### 3. 测试分组

```typescript
describe('Job Aggregate', () => {
  describe('create', () => {
    // 创建相关测试
  });

  describe('start', () => {
    // 启动相关测试
  });

  describe('complete', () => {
    // 完成相关测试
  });

  describe('fail', () => {
    // 失败相关测试
  });
});
```

### 4. beforeEach 模式

```typescript
describe('start', () => {
  let job: Job;

  beforeEach(() => {
    // 每个测试前创建一个新的 Job
    job = Job.create({
      id: JobId.create(),
      title: JobTitle.create('测试任务').value,
      tenantId: 'tenant-123',
      createdBy: 'user-456',
    });
  });

  it('should start pending job', () => {
    job.start();
    expect(job.status.value).toBe(JobStatusEnum.RUNNING);
  });
});
```

---

## 📖 最佳实践

### ✅ 推荐做法

1. **测试业务规则**：而非实现细节（状态转换、业务约束）
2. **使用 AAA 模式**：Arrange-Act-Assert 清晰分离
3. **测试领域事件**：确保事件正确触发和顺序
4. **测试边界条件**：空值、最小值、最大值、无效转换
5. **使用 beforeEach**：共享测试数据，保持测试独立
6. **测试多租户场景**：确保租户隔离正确
7. **测试 Event Sourcing**：聚合创建、状态变更、事件流

### ❌ 避免做法

1. **测试私有方法**：测试公共接口和行为
2. **测试实现细节**：测试业务规则和状态
3. **忽略边界条件**：必须测试边界（空值、长度、状态转换）
4. **过度 Mock**：领域层通常不需要 Mock
5. **重复测试**：使用 describe 分组相关测试
6. **忽略领域事件**：必须测试事件触发和内容
7. **忽略多租户**：必须测试租户隔离

---

## 🔗 参考资源

- [测试策略](../testing.md) - 测试金字塔和覆盖率
- [workflow.md](../workflow.md) - TDD 开发流程
- [examples/domain-layer.md](./domain-layer.md) - 领域层实现
- [examples/application-layer.md](./application-layer.md) - 应用层实现（CQRS）
- [examples/README.md](./README.md) - 示例库索引
- [架构指南](../../../guidelines/archi/archi-02-domain.md) - 领域层架构
