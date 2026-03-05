import type { EntityManager, MikroORM } from "@mikro-orm/core";

/**
 * 事务配置选项
 */
export interface TransactionConfig {
  /**
   * 事务超时时间（毫秒）
   *
   * 超过此时间后，事务将自动回滚并抛出 TransactionTimeoutError
   *
   * @default 30000 (30 秒)
   */
  timeout?: number;
}

/**
 * 事务执行选项
 */
export interface TransactionOptions {
  /**
   * 本次事务的超时时间（毫秒）
   *
   * 优先级高于 TransactionConfig.timeout
   */
  timeout?: number;
}

/**
 * 事务超时错误
 */
export class TransactionTimeoutError extends Error {
  constructor(
    public readonly timeout: number,
    message?: string
  ) {
    super(message ?? `事务执行超时 (${timeout}ms)`);
    this.name = "TransactionTimeoutError";
  }
}

/**
 * 事务管理器
 *
 * 包装 MikroORM 的 transactional 方法，提供：
 * - 真实的数据库事务边界
 * - 事务超时控制
 * - 统一的错误处理
 *
 * @example
 * ```typescript
 * const transactionManager = new TransactionManager(orm, {
 *   timeout: 30000,
 * });
 *
 * const result = await transactionManager.execute(async (em) => {
 *   const user = em.create(User, userData);
 *   const org = em.create(Organization, orgData);
 *   await em.flush();
 *   return { user, org };
 * });
 * ```
 */
export class TransactionManager {
  private readonly defaultTimeout: number;

  constructor(
    private readonly orm: MikroORM,
    config?: TransactionConfig
  ) {
    this.defaultTimeout = config?.timeout ?? 30000;
  }

  /**
   * 在事务内执行操作
   *
   * 如果操作成功完成，事务将自动提交。
   * 如果操作抛出异常或超时，事务将自动回滚。
   *
   * @param cb - 要在事务内执行的操作，接收 EntityManager 参数
   * @param options - 事务执行选项
   * @returns 操作的返回值
   * @throws {TransactionTimeoutError} 事务执行超时
   * @throws {Error} 操作执行过程中的其他错误
   *
   * @example
   * ```typescript
   * // 创建用户和组织（原子操作）
   * await transactionManager.execute(async (em) => {
   *   const user = em.create(User, { email: 'test@example.com' });
   *   const org = em.create(Organization, { name: 'Test Org' });
   *   await em.flush();
   * });
   *
   * // 带超时配置的事务
   * await transactionManager.execute(
   *   async (em) => {
   *     // 长时间操作
   *   },
   *   { timeout: 60000 } // 60 秒超时
   * );
   * ```
   */
  async execute<T>(cb: (em: EntityManager) => Promise<T>, options?: TransactionOptions): Promise<T> {
    const timeout = options?.timeout ?? this.defaultTimeout;
    const em = this.orm.em.fork();

    // 创建超时 Promise
    const timeoutPromise = this.createTimeoutPromise<T>(timeout);

    // 创建事务 Promise
    const transactionPromise = em.transactional(cb);

    // 使用 Promise.race 实现超时控制
    try {
      const result = await Promise.race([transactionPromise, timeoutPromise]);
      return result;
    } catch (error) {
      // 如果是超时错误，确保清理 EntityManager
      if (error instanceof TransactionTimeoutError) {
        em.clear();
      }
      throw error;
    }
  }

  /**
   * 创建超时 Promise
   *
   * @param timeout - 超时时间（毫秒）
   * @returns 永远不会 resolve，只在超时后 reject 的 Promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TransactionTimeoutError(timeout));
      }, timeout);
    });
  }
}
