export type WebhookEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.email_verified"
  | "user.password_changed"
  | "session.created"
  | "session.destroyed"
  | "session.extended"
  | "organization.created"
  | "organization.updated"
  | "organization.deleted"
  | "organization.member_invited"
  | "organization.member_joined"
  | "organization.member_removed"
  | "organization.member_role_changed"
  | "oauth.client_created"
  | "oauth.client_updated"
  | "oauth.client_deleted"
  | "oauth.token_issued"
  | "oauth.token_revoked"
  | "oauth.authorization_granted"
  | "api_key.created"
  | "api_key.revoked"
  | "api_key.used";

export type WebhookStatus = "active" | "disabled" | "failed";

export type WebhookDeliveryStatus = "pending" | "success" | "failed" | "retrying";
