/**
 * 钩子系统示例
 * 展示如何在认证流程中添加自定义逻辑
 */

import { Injectable } from '@nestjs/common';
import {
  Hook,
  BeforeHook,
  AfterHook,
  AuthHookContext,
} from '@oksai/nestjs-better-auth';

@Injectable()
@Hook()
export class AuthHooks {
  // 在用户注册前执行
  @BeforeHook('/sign-up/email')
  async beforeSignUp(ctx: AuthHookContext) {
    console.log('用户正在注册:', ctx.body.email);

    // 示例：检查邮箱是否在黑名单中
    const blacklistedEmails = ['spam@example.com'];
    if (blacklistedEmails.includes(ctx.body.email)) {
      throw new Error('该邮箱不允许注册');
    }

    // 可以修改请求体
    // ctx.body.name = ctx.body.name.trim();
  }

  // 在用户注册后执行
  @AfterHook('/sign-up/email')
  async afterSignUp(ctx: AuthHookContext) {
    console.log('新用户注册成功:', ctx.body.email);

    // 示例：发送欢迎邮件
    // await this.emailService.sendWelcomeEmail(ctx.body.email);

    // 示例：记录到分析系统
    // await this.analytics.track('user_signed_up', { email: ctx.body.email });
  }

  // 在用户登录前执行
  @BeforeHook('/sign-in/email')
  async beforeSignIn(ctx: AuthHookContext) {
    console.log('用户尝试登录:', ctx.body.email);

    // 示例：检查是否需要验证码
    // const attempts = await this.getLoginAttempts(ctx.body.email);
    // if (attempts > 3) {
    //   throw new Error('需要验证码');
    // }
  }

  // 在用户登录后执行
  @AfterHook('/sign-in/email')
  async afterSignIn(ctx: AuthHookContext) {
    console.log('用户登录成功');

    // 示例：记录登录日志
    // await this.auditLog.record({
    //   action: 'login',
    //   userId: ctx.user?.id,
    //   timestamp: new Date(),
    // });
  }

  // 通用的后置钩子 - 适用于所有认证路由
  @AfterHook()
  async logAllAuthActions(ctx: AuthHookContext) {
    console.log(`认证路由被调用: ${ctx.path}`);
  }
}

/**
 * 在模块中提供钩子
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '@oksai/nestjs-better-auth';

@Module({
  imports: [
    AuthModule.forRoot({
      auth: betterAuth({
        database: {
          /* ... */
        },
        hooks: {}, // 必须配置空的 hooks 对象
      }),
    }),
  ],
  providers: [AuthHooks], // 注册钩子提供者
})
export class AppModule {}
