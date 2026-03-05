import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "../src/types";

describe("Event Store Types", () => {
  describe("DomainEvent", () => {
    it("应该定义正确的事件结构", () => {
      const event: DomainEvent = {
        eventId: "test-123",
        eventType: "TenantCreated",
        aggregateId: "tenant-456",
        aggregateType: "Tenant",
        version: 1,
        payload: { name: "Test" },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      expect(event.eventId).toBe("test-123");
      expect(event.eventType).toBe("TenantCreated");
      expect(event.aggregateId).toBe("tenant-456");
      expect(event.version).toBe(1);
    });

    it("应该支持可选的 metadata 字段", () => {
      const event: DomainEvent = {
        eventId: "test-123",
        eventType: "UserCreated",
        aggregateId: "user-789",
        aggregateType: "User",
        version: 1,
        payload: { email: "test@example.com" },
        metadata: {
          tenantId: "tenant-123",
          userId: "user-456",
          correlationId: "corr-789",
          timestamp: new Date().toISOString(),
        },
      };

      expect(event.metadata.tenantId).toBe("tenant-123");
      expect(event.metadata.userId).toBe("user-456");
      expect(event.metadata.correlationId).toBe("corr-789");
    });
  });
});
