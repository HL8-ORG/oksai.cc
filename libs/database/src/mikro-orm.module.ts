import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    MikroOrmModule.forRoot({
      autoLoadEntities: true,
      registerRequestContext: true,
    }),
  ],
  exports: [MikroOrmModule],
})
export class MikroOrmDatabaseModule {}
