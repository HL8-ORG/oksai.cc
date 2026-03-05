import { MikroORM } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Test } from "@nestjs/testing";

export abstract class RepositoryTestBase {
  protected orm!: MikroORM;

  async setup(entities: any[] = []) {
    const module = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          driver: PostgreSqlDriver,
          dbName: "test_db",
          host: "localhost",
          port: 5432,
          user: "oksai",
          password: "oksai_dev_password",
          entities,
          debug: false,
        }),
      ],
    }).compile();

    this.orm = module.get(MikroORM);

    const generator = this.orm.getSchemaGenerator();
    await generator.createSchema();
  }

  async teardown() {
    const generator = this.orm.getSchemaGenerator();
    await generator.dropSchema();

    await this.orm.close();
  }

  protected get em() {
    return this.orm.em;
  }

  protected async clearDatabase() {
    const generator = this.orm.getSchemaGenerator();
    await generator.clearDatabase();
  }
}
