/**
 * 租户命令适配器（NestJS）
 *
 * 将 HTTP 请求转换为命令
 */

import { Injectable } from "@nestjs/common";
import { CommandBus } from "@oksai/cqrs";

@Injectable()
export class TenantCommandAdapter {
  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: any): Promise<any> {
    return this.commandBus.execute(command);
  }
}
