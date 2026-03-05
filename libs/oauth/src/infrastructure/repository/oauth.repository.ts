import type { EntityManager } from "@mikro-orm/core";
import { OAuthAccessToken, OAuthAuthorizationCode, OAuthClient, OAuthRefreshToken } from "@oksai/database";
import type { EventStore } from "@oksai/event-store";

// TODO: OAuthClient 需要实现 AggregateRoot 接口才能使用 EventSourcedRepository
// 暂时使用普通的 Repository 模式
export class OAuthClientRepository {
  constructor(private em: EntityManager) {}

  async findByClientId(clientId: string): Promise<OAuthClient | null> {
    return this.em.findOne(OAuthClient as any, { clientId });
  }

  async findActiveClients(): Promise<OAuthClient[]> {
    return this.em.find(OAuthClient as any, { isActive: true });
  }

  async findClientsByUserId(userId: string): Promise<OAuthClient[]> {
    return this.em.find(OAuthClient as any, { createdBy: userId });
  }
}

export class OAuthAuthorizationCodeRepository {
  constructor(private em: EntityManager) {}

  async findByCode(code: string): Promise<OAuthAuthorizationCode | null> {
    return this.em.findOne(OAuthAuthorizationCode as any, { code });
  }

  async findActiveByCode(code: string): Promise<OAuthAuthorizationCode | null> {
    const authCode = await this.findByCode(code);
    if (!authCode || authCode.isUsed() || authCode.isExpired()) {
      return null;
    }
    return authCode;
  }

  async markAsUsed(code: string): Promise<void> {
    const authCode = await this.findByCode(code);
    if (authCode) {
      authCode.markAsUsed();
      await this.em.flush();
    }
  }
}

export class OAuthAccessTokenRepository {
  constructor(private em: EntityManager) {}

  async findByAccessToken(accessToken: string): Promise<OAuthAccessToken | null> {
    return this.em.findOne(OAuthAccessToken as any, { accessToken });
  }

  async findValidToken(accessToken: string): Promise<OAuthAccessToken | null> {
    const token = await this.findByAccessToken(accessToken);
    if (!token || !token.isValid()) {
      return null;
    }
    return token;
  }

  async revokeToken(accessToken: string): Promise<void> {
    const token = await this.findByAccessToken(accessToken);
    if (token) {
      token.revoke();
      await this.em.flush();
    }
  }

  async revokeAllTokensForUser(userId: string): Promise<void> {
    const tokens = await this.em.find(OAuthAccessToken as any, {
      userId,
      revokedAt: null,
    });
    for (const token of tokens) {
      if ("revoke" in token && typeof token.revoke === "function") {
        token.revoke();
      }
    }
    await this.em.flush();
  }
}

export class OAuthRefreshTokenRepository {
  constructor(private em: EntityManager) {}

  async findByRefreshToken(refreshToken: string): Promise<OAuthRefreshToken | null> {
    return this.em.findOne(OAuthRefreshToken as any, { refreshToken });
  }

  async findValidToken(refreshToken: string): Promise<OAuthRefreshToken | null> {
    const token = await this.findByRefreshToken(refreshToken);
    if (!token || !token.isValid()) {
      return null;
    }
    return token;
  }

  async revokeToken(refreshToken: string): Promise<void> {
    const token = await this.findByRefreshToken(refreshToken);
    if (token) {
      token.revoke();
      await this.em.flush();
    }
  }
}
