import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("默认")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "获取欢迎信息", description: "返回 API 欢迎信息和版本号" })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Welcome to OksAI Gateway" },
        version: { type: "string", example: "1.0.0" },
      },
    },
  })
  getHello(): { message: string; version: string } {
    return this.appService.getHello();
  }
}
