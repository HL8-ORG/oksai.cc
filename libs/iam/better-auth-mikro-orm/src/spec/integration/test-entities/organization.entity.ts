import { randomUUID } from "node:crypto";
import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class TestOrganization {
  @PrimaryKey()
  id: string = randomUUID();

  @Property({ type: "string" })
  name: string;

  @Property({ type: "string", nullable: true })
  slug?: string;

  @Property({ type: "string", nullable: true })
  ownerId?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(name: string) {
    this.name = name;
  }
}
