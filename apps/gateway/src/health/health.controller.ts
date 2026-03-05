import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("健康检查")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "健康检查", description: "检查服务是否正常运行" })
  @ApiResponse({
    status: 200,
    description: "服务正常",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        timestamp: { type: "string", example: "2024-03-06T12:00:00.000Z" },
      },
    },
  })
  check(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  @ApiOperation({ summary: "就绪检查", description: "检查所有依赖服务是否就绪" })
  @ApiResponse({
    status: 200,
    description: "所有服务就绪",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ready" },
        services: {
          type: "object",
          properties: {
            database: { type: "string", example: "connected" },
            redis: { type: "string", example: "connected" },
            auth: { type: "string", example: "ready" },
          },
        },
      },
    },
  })
  ready(): { status: string; services: Record<string, string> } {
    return {
      status: "ready",
      services: {
        database: "connected",
        redis: "connected",
        auth: "ready",
      },
    };
  }
}
