/**
 * @description 用户事件契约
 *
 * 定义用户相关的事件规范
 *
 * @module @oksai/constants/contracts/events/user
 */

// ============ 事件名称常量 ============

/**
 * @description 用户事件名称
 */
export const USER_EVENTS = {
  /** 用户创建 */
  USER_CREATED: "user.created",
  /** 用户更新 */
  USER_UPDATED: "user.updated",
  /** 用户删除 */
  USER_DELETED: "user.deleted",
  /** 用户激活 */
  USER_ACTIVATED: "user.activated",
  /** 用户停用 */
  USER_DEACTIVATED: "user.deactivated",
  /** 邮箱验证 */
  EMAIL_VERIFIED: "user.email.verified",
  /** 密码修改 */
  PASSWORD_CHANGED: "user.password.changed",
  /** 角色变更 */
  ROLE_CHANGED: "user.role.changed",
  /** 个人资料更新 */
  PROFILE_UPDATED: "user.profile.updated",
} as const;

export type UserEventName = (typeof USER_EVENTS)[keyof typeof USER_EVENTS];

// ============ 事件 Payload ============

/**
 * @description 用户创建事件 Payload
 */
export interface UserCreatedPayload {
  /** 事件 ID */
  eventId: string;
  /** 事件时间 */
  timestamp: string;
  /** 事件版本 */
  version: "1.0";
  /** 事件数据 */
  data: {
    /** 用户 ID */
    userId: string;
    /** 邮箱地址 */
    email: string;
    /** 用户名 */
    username: string;
    /** 显示名称 */
    displayName: string | null;
    /** 租户 ID */
    tenantId: string;
    /** 创建者 ID */
    createdBy: string | null;
  };
}

/**
 * @description 用户更新事件 Payload
 */
export interface UserUpdatedPayload {
  /** 事件 ID */
  eventId: string;
  /** 事件时间 */
  timestamp: string;
  /** 事件版本 */
  version: "1.0";
  /** 事件数据 */
  data: {
    /** 用户 ID */
    userId: string;
    /** 更新的字段 */
    changes: Record<string, { oldValue: unknown; newValue: unknown }>;
    /** 更新者 ID */
    updatedBy: string;
  };
}

/**
 * @description 用户删除事件 Payload
 */
export interface UserDeletedPayload {
  /** 事件 ID */
  eventId: string;
  /** 事件时间 */
  timestamp: string;
  /** 事件版本 */
  version: "1.0";
  /** 事件数据 */
  data: {
    /** 用户 ID */
    userId: string;
    /** 邮箱地址 */
    email: string;
    /** 删除原因 */
    reason?: string;
    /** 删除者 ID */
    deletedBy: string;
  };
}

/**
 * @description 用户角色变更事件 Payload
 */
export interface UserRoleChangedPayload {
  /** 事件 ID */
  eventId: string;
  /** 事件时间 */
  timestamp: string;
  /** 事件版本 */
  version: "1.0";
  /** 事件数据 */
  data: {
    /** 用户 ID */
    userId: string;
    /** 旧角色 */
    oldRole: string;
    /** 新角色 */
    newRole: string;
    /** 变更者 ID */
    changedBy: string;
  };
}

// ============ 事件类型映射 ============

export interface UserEventMap {
  [USER_EVENTS.USER_CREATED]: UserCreatedPayload;
  [USER_EVENTS.USER_UPDATED]: UserUpdatedPayload;
  [USER_EVENTS.USER_DELETED]: UserDeletedPayload;
  [USER_EVENTS.ROLE_CHANGED]: UserRoleChangedPayload;
}
