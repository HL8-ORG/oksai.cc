/**
 * 角色和权限示例
 * 展示如何使用 @Roles() 和 @OrgRoles() 装饰器
 */

import { Body, Controller, Get, Post } from "@nestjs/common";
import { OrgRoles, Roles, Session } from "@oksai/nestjs-better-auth";

@Controller("admin")
export class AdminController {
  // 只允许 admin 角色访问
  @Get("dashboard")
  @Roles(["admin"])
  getDashboard(@Session() session: any) {
    return {
      message: "Admin dashboard",
      user: session.user,
    };
  }

  // 允许多个角色访问
  @Get("reports")
  @Roles(["admin", "manager"])
  getReports() {
    return {
      reports: [
        { id: 1, title: "Monthly Report" },
        { id: 2, title: "Annual Report" },
      ],
    };
  }

  // 组织级别权限控制
  @Get("org-settings")
  @OrgRoles(["owner", "admin"])
  getOrgSettings(@Session() session: any) {
    return {
      orgId: session.session.activeOrganizationId,
      settings: {
        // 组织设置
      },
    };
  }

  // 组合使用：需要是管理员且是组织所有者
  @Post("org/delete")
  @Roles(["admin"])
  @OrgRoles(["owner"])
  async deleteOrganization(@Session() _session: any, @Body() _body: { orgId: string }) {
    // 删除组织逻辑
    return {
      success: true,
      message: "Organization deleted",
    };
  }
}

/**
 * Better Auth 配置示例
 * 启用 admin 和 organization 插件
 */

import { betterAuth } from "better-auth";
import { admin, organization } from "better-auth/plugins";

const _auth = betterAuth({
  database: {
    // 数据库配置
  },
  plugins: [
    admin(),
    organization({
      // 组织插件配置
    }),
  ],
});
