/**
 * API Key 管理服务
 *
 * @deprecated
 * 此服务已废弃，API Key 管理由 Better Auth API Key 插件处理（见 api-key.controller.ts）
 * 保留此文件仅供参考，后续将删除
 */

import { Injectable, Logger } from "@nestjs/common";

/**
 * API Key 管理服务
 *
 * @deprecated
 * 当前 API Key 管理由 Better Auth 处理，此服务不再使用
 */
@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor() {
    this.logger.warn("ApiKeyService 已废弃，请使用 Better Auth API Key 插件。见 api-key.controller.ts");
  }
}
