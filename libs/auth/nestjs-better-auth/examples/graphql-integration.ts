/**
 * GraphQL 集成示例
 * 展示如何在 GraphQL 解析器中使用认证
 */

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Session, Roles } from '@oksai/nestjs-better-auth';

@Resolver()
export class UsersResolver {
  // 获取当前用户信息 - 需要认证
  @Query(() => User)
  async currentUser(@Session() session: any) {
    return session.user;
  }

  // 管理员查询 - 需要 admin 角色
  @Query(() => [User])
  @Roles(['admin'])
  async allUsers() {
    // 返回所有用户
    return [];
  }

  // 可选认证 - 有会话则提供用户信息
  @Query(() => User, { nullable: true })
  @OptionalAuth()
  async optionalUser(@Session() session: any) {
    return session?.user || null;
  }
}

/**
 * GraphQL Schema 定义示例
 */

const gql = `
  type User {
    id: ID!
    email: String!
    name: String!
    role: String
  }

  type Query {
    currentUser: User
    allUsers: [User!]!
    optionalUser: User
  }

  type Mutation {
    updateProfile(name: String!): User
  }
`;

/**
 * 模块配置 - 同时启用 GraphQL 和认证
 */

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from '@oksai/nestjs-better-auth';

@Module({
  imports: [
    GraphQLModule.forRoot({
      // GraphQL 配置
    }),
    AuthModule.forRoot({
      auth: betterAuth({
        database: {
          /* ... */
        },
      }),
    }),
  ],
  providers: [UsersResolver],
})
export class AppModule {}
