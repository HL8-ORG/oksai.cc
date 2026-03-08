/**
 * 配额超限异常
 *
 * @description
 * 当租户超过配额限制时抛出此异常
 */

import { HttpException, HttpStatus } from "@nestjs/common";
import type { QuotaResource } from "../decorators/check-quota.decorator.js";

/**
 * 配额超限异常
 *
 * @example
 * ```typescript
 * throw new QuotaExceededException('organizations', 10, 10);
 * // 返回 403 Forbidden: "已达到组织配额限制（10/10），请升级套餐"
 * ```
 */
export class QuotaExceededException extends HttpException {
  constructor(resource: QuotaResource, current: number, limit: number) {
    const resourceNames: Record<QuotaResource, string> = {
      organizations: "组织",
      members: "成员",
      storage: "存储空间",
    };

    const message = `已达到${resourceNames[resource]}配额限制（${current}/${limit}），请升级套餐`;

    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: "Quota Exceeded",
        resource,
        current,
        limit,
      },
      HttpStatus.FORBIDDEN
    );
  }
}
