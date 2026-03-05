/**
 * 迁移用户角色到 Better Auth Admin 插件
 *
 * @description
 * 将现有用户角色迁移到 Better Auth Admin 插件兼容格式
 *
 * 迁移规则：
 * - owner → superadmin
 * - admin → admin
 * - 其他 → user
 */

import { config } from "dotenv";
import { db, users } from "@oksai/database";
import { eq, sql } from "drizzle-orm";

// 加载环境变量
config();

/**
 * 用户角色映射
 */
const ROLE_MAPPING: Record<string, string> = {
  OWNER: "superadmin",
  ADMIN: "admin",
  MEMBER: "user",
  VIEWER: "user",
  owner: "superadmin",
  admin: "admin",
  user: "user",
};

/**
 * 迁移用户角色
 */
async function migrateAdminData() {
  console.log("🚀 开始迁移用户角色...\n");

  try {
    // 1. 统计当前用户角色分布
    console.log("📊 统计当前用户角色分布...");
    const roleStats = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(users)
      .groupBy(users.role);

    console.log("\n当前角色分布：");
    for (const stat of roleStats) {
      console.log(`  - ${stat.role}: ${stat.count} 个用户`);
    }
    console.log("");

    // 2. 查询所有用户
    const allUsers = await db.select().from(users);
    console.log(`📋 找到 ${allUsers.length} 个用户\n`);

    if (allUsers.length === 0) {
      console.log("✅ 没有用户需要迁移\n");
      return;
    }

    // 3. 迁移每个用户的角色
    let migratedCount = 0;
    let skippedCount = 0;
    const migrationLog: string[] = [];

    for (const user of allUsers) {
      const currentRole = user.role;
      const newRole = ROLE_MAPPING[currentRole] || "user";

      // 如果角色已经是标准格式，跳过
      if (currentRole === newRole) {
        skippedCount++;
        migrationLog.push(`⏭️  跳过 ${user.email} (${currentRole} → ${newRole})`);
        continue;
      }

      // 迁移角色
      await db
        .update(users)
        .set({
          role: newRole,
        })
        .where(eq(users.id, user.id));

      migratedCount++;
      migrationLog.push(`✓ 迁移 ${user.email} (${currentRole} → ${newRole})`);
    }

    // 4. 输出迁移日志
    console.log("📝 迁移日志：\n");
    for (const log of migrationLog) {
      console.log(`  ${log}`);
    }

    // 5. 统计迁移结果
    console.log("\n✅ 迁移完成！\n");
    console.log("📊 迁移统计：");
    console.log(`  - 总用户数：${allUsers.length}`);
    console.log(`  - 已迁移：${migratedCount}`);
    console.log(`  - 已跳过：${skippedCount}`);

    // 6. 验证迁移结果
    console.log("\n🔍 验证迁移结果...\n");
    const newRoleStats = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(users)
      .groupBy(users.role);

    console.log("新角色分布：");
    for (const stat of newRoleStats) {
      console.log(`  - ${stat.role}: ${stat.count} 个用户`);
    }
    console.log("");

    // 7. 提示下一步
    console.log("🎉 用户角色迁移成功完成！\n");
    console.log("下一步：");
    console.log("  1. 检查迁移结果是否正确");
    console.log("  2. 运行测试验证功能");
    console.log("  3. 部署到生产环境");
    console.log("");
  } catch (error) {
    console.error("❌ 迁移失败：", error);
    process.exit(1);
  }

  process.exit(0);
}

// 执行迁移
migrateAdminData();
