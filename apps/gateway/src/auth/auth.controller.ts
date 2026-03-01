import { All, Controller, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  private auth: ReturnType<typeof betterAuth>;

  constructor(private configService: ConfigService) {
    const connectionString =
      this.configService.get<string>('DATABASE_URL') ||
      'postgresql://oksai:oksai_dev_password@localhost:5432/oksai';

    const client = postgres(connectionString);
    const db = drizzle(client);

    this.auth = betterAuth({
      secret: this.configService.get<string>(
        'BETTER_AUTH_SECRET',
        'oksai_better_auth_secret_key_for_development_minimum_32_chars'
      ),
      baseURL: this.configService.get<string>(
        'BETTER_AUTH_URL',
        'http://localhost:3000'
      ),
      trustedOrigins: [
        this.configService.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
      ],
      database: drizzleAdapter(db, {
        provider: 'pg',
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5,
        },
      },
    });
  }

  @All('*')
  handleAuth(@Req() req: Request, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.auth.handler as any)(req, res);
  }
}
