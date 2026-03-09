/**
 * 租户创建事件处理器
 *
 * 投影器专用的事件处理器
 */

import type { TenantCreatedEvent } from "../../../domain/events/tenant-created.event.js";
import type { TenantProjector } from "../tenant.projector.js";

export class TenantCreatedProjectionHandler {
  constructor(private readonly projector: TenantProjector) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    await this.projector.handleTenantCreated(event);
  }
}
