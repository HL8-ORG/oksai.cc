import { randomUUID } from "node:crypto";
import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity()
@Unique({ properties: ["email"] })
export class TestUser {
  @PrimaryKey()
  id: string = randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "string", nullable: true })
  image?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string) {
    this.email = email;
  }
}
