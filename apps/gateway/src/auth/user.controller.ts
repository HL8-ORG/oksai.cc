import { Controller, Get } from '@nestjs/common';
import { Session, UserSession, AllowAnonymous, OptionalAuth } from '@oksai/nestjs-better-auth';

/**
 * 用户控制器
 *
 * @description
 * 提供用户相关的 API 端点，演示如何使用 Better Auth 装饰器。
 * - @Session() - 获取用户会话信息
 * - @AllowAnonymous() - 允许匿名访问
 * - @OptionalAuth() - 可选认证
 */
@Controller('users')
export class UserController {
	/**
	 * 获取当前用户信息
	 *
	 * @description
	 * 返回当前已认证用户的会话信息。此路由需要认证。
	 *
	 * @param session - 用户会话对象
	 * @returns 包含用户信息的对象
	 *
	 * @example
	 * GET /api/users/me
	 * Response: { user: { id: "xxx", email: "user@example.com", ... } }
	 */
	@Get('me')
	async getProfile(@Session() session: UserSession) {
		return { user: session.user };
	}

	/**
	 * 公开路由示例
	 *
	 * @description
	 * 演示 @AllowAnonymous() 装饰器的使用，允许未认证用户访问。
	 *
	 * @example
	 * GET /api/users/public
	 * Response: { message: 'Public route' }
	 */
	@Get('public')
	@AllowAnonymous()
	async getPublic() {
		return { message: 'Public route' };
	}

	/**
	 * 可选认证路由示例
	 *
	 * @description
	 * 演示 @OptionalAuth() 装饰器的使用，认证是可选的。
	 * 如果用户已认证，则返回 true；否则返回 false。
	 *
	 * @param session - 用户会话对象（可能为空）
	 *
	 * @example
	 * GET /api/users/optional
	 * Response: { authenticated: true/false }
	 */
	@Get('optional')
	@OptionalAuth()
	async getOptional(@Session() session: UserSession) {
		return { authenticated: !!session };
	}
}
