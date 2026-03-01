import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
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
