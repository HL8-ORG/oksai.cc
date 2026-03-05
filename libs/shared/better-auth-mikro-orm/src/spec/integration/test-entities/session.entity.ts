import { randomUUID } from "node:crypto";
import { Entity, Index, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity()
@Unique({ properties: ["token"] })
export class TestSession {
  @PrimaryKey()
  id: string = randomUUID();

  @Property({ type: "string" })
  @Index()
  userId: string;

  @Property({ type: "Date" })
  expiresAt: Date;

  @Property({ type: "string" })
  token: string;

  @Property({ type: "string", nullable: true })
  ipAddress?: string;

  @Property({ type: "string", nullable: true })
  userAgent?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(userId: string, token: string, expiresAt: Date) {
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
  }
}
