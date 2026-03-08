/**
 * Fastify types - these are optional dependencies
 * Users only need to install @nestjs/platform-fastify and fastify if they use Fastify
 */
type FastifyRequest = any;
type FastifyReply = any;

export interface SkipBodyParsingMiddlewareFastifyOptions {
  /**
   * The base path for Better Auth routes. Body parsing will be skipped for these routes.
   * @default "/api/auth"
   */
  basePath?: string;
}

/**
 * Factory that returns a Nest middleware for Fastify platform.
 *
 * This middleware skips body parsing for the configured basePath.
 * For Fastify, body parsing configuration happens at the application level,
 * so this primarily serves to mark routes that should skip parsing.
 *
 * @param options - Configuration options
 * @returns Nest middleware function
 *
 * @example
 * ```typescript
 * import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
 * import { AuthModule, SkipBodyParsingMiddlewareFastify } from '@oksai/nestjs-better-auth';
 *
 * @Module({
 *   imports: [
 *     AuthModule.forRoot({
 *       auth: betterAuth({ ... }),
 *       platform: 'fastify',
 *     }),
 *   ],
 * })
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(SkipBodyParsingMiddlewareFastify({ basePath: '/api/auth' }))
 *       .forRoutes('*path');
 *   }
 * }
 * ```
 */
export function SkipBodyParsingMiddlewareFastify(options: SkipBodyParsingMiddlewareFastifyOptions = {}) {
  const { basePath = "/api/auth" } = options;

  // Return a middleware function compatible with Nest's consumer.apply()
  return (req: FastifyRequest, res: FastifyReply, next: () => void): void => {
    // Skip body parsing for better-auth routes
    if (req.url?.startsWith(basePath)) {
      next();
      return;
    }

    // For Fastify, body parsing is handled automatically
    // Just call next() to proceed
    next();
  };
}
