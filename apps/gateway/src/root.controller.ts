import { Controller, Get, Redirect } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { AllowAnonymous } from "@oksai/nestjs-better-auth";

/**
 * 根路径控制器
 *
 * @description
 * 处理根路径 `/` 的请求，重定向到 API 文档页面
 * 此控制器不受全局前缀 `/api` 的影响
 */
@ApiExcludeController()
@Controller()
export class RootController {
  /**
   * 根路径重定向
   *
   * @description
   * 将根路径请求重定向到 Scalar API 文档页面
   */
  @Get()
  @AllowAnonymous()
  @Redirect("/docs", 302)
  redirectRoot() {
    return { url: "/docs" };
  }
}
