/**
 * API Key 数据迁移脚本（简化版）
 * 
 * 从自定义实现迁移到 Better Auth API Key 插件
 * 
 * 运行方式：
 * pnpm tsx scripts/migrate-api-keys.ts
 */

import { db } from "@oksai/database";
import { apiKeys } from "@oksai/database";
import { and, eq, isNull } from "drizzle-orm";
import { createAuth } from "../apps/gateway/src/auth/auth.config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 环境变量未设置");
}

const auth = createAuth(databaseUrl);

/**
 * 主函数
 */
async function migrateApiKeys() {
  console.log("🚀 开始 API Key 迁移...\n");
  console.log("⚠️  注意：无法直接迁移 Hash 值，  Better Auth 使用不同的 Hash 算法
  必须为每个用户生成新的 API Key\n");

  // 1. 查询所有用户
  console.log("=" .repeat(60));
  console.log("📋 查询所有用户...");

  const users = await db
    .select({
      id: apiKeys.userId,
    })
    .from(apiKeys)
    .where(isNull(apiKeys.revokedAt))
    .groupBy(apiKeys.userId);

  console.log(`✅ 找到 ${users.length} 个用户\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // 2. 遍历每个用户
  for (const user of users) {
    console.log("=" .repeat(60));
    console.log(`\n👤 处理用户: ${user.id}\n`);

    // 2.1 查询用户的所有 API Keys
    const oldKeys = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, user.id),
          isNull(apiKeys.revokedAt)
        )
      );

    if (oldKeys.length === 0) {
      console.log(`  ℹ️  用户没有有效的 API Keys`);
      continue;
    }

    console.log(`  📋 找到 ${oldKeys.length} 个 API Keys`);

    // 2.2 为每个旧 Key 创建新的 Better Auth API Key
    for (const oldKey of oldKeys) {
      console.log(`\n  🔄 迁移 Key: ${oldKey.id} (${oldKey.name || "未命名"})`);

      try {
        // 计算剩余有效时间
        let expiresIn: number | undefined;
        if (oldKey.expiresAt) {
          const now = new Date();
          const expiresAt = new Date(oldKey.expiresAt);
          const diffMs = expiresAt.getTime() - now.getTime();
          const diffSec = Math.floor(diffMs / 1000);

          if (diffSec <= 0) {
            console.log(`  ⏭️  跳过已过期的 Key`);
            totalSkipped++;
            continue;
          }
          expiresIn = diffSec;
        }

        // 创建新的 Better Auth API Key
        const result = await auth.api.createApiKey({
          body: {
            userId: user.id,
            name: oldKey.name || "Migrated Key",
            expiresIn,
          },
        });

        if (!result) {
          throw new Error("创建失败");
        }

        // 标记旧 Key 为已迁移
        await db
          .update(apiKeys)
          .set({ 
            revokedAt: new Date(),
            // 注意：可能需要添加 migrated 字段
          })
          .where(eq(apiKeys.id, oldKey.id));

        console.log(`  ✅  迁移成功`);
        console.log(`     新 Key ID: ${result.id}`);
        console.log(`     新 Key: ${result.key}`);
        console.log(`     过期时间: ${result.expiresAt || "永不过期"}`);
        console.log(`     ⚠️  请保存新 Key，此 Key 仅显示一次！`);

        totalMigrated++;

        // TODO: 发送邮件通知用户
        // await sendEmail(user.email, result.key);
      } catch (error: any) {
        console.error(`  ❌  迁移失败:`, error.message);
        totalFailed++;
      }
    }
  }

  // 3. 输出总结
  console.log("\n" + "=".repeat(60));
  console.log("📊 迁移摘要");
  console.log("=".repeat(60));
  console.log(`✅ 成功迁移: ${totalMigrated} 个 Keys`);
  console.log(`⏭️  跳过（已过期）: ${totalSkipped} 个 Keys`);
  console.log(`❌ 失败: ${totalFailed} 个 Keys`);
  console.log("=".repeat(60));

  console.log("\n✅ 迁移完成！\n");
}

// 主入口
migrateApiKeys().catch((error) => {
  console.error("迁移失败:", error);
  process.exit(1);
});
