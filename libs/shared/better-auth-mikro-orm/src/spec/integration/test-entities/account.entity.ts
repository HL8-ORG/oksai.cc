import { randomUUID } from "node:crypto";
import { Entity, Index, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class TestAccount {
  @PrimaryKey()
  id: string = randomUUID();

  @Property({ type: "string" })
  @Index()
  userId: string;

  @Property({ type: "string" })
  accountId: string;

  @Property({ type: "string" })
  providerId: string;

  @Property({ type: "string", nullable: true })
  accessToken?: string;

  @Property({ type: "string", nullable: true })
  refreshToken?: string;

  @Property({ type: "Date", nullable: true })
  expiresAt?: Date;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(userId: string, accountId: string, providerId: string) {
    this.userId = userId;
    this.accountId = accountId;
    this.providerId = providerId;
  }
}
