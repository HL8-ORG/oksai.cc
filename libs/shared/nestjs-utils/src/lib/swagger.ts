import type { INestApplication } from "@nestjs/common";

/**
 * Swagger 配置选项
 */
export interface SetupSwaggerOptions {
  /**
   * 是否启用 Swagger
   * @default false
   */
  enabled: boolean;

  /**
   * Swagger UI 路径
   * @default 'swagger'
   */
  swaggerPath?: string;

  /**
   * 是否启用 Scalar UI
   * @default true
   */
  enableScalar?: boolean;

  /**
   * Scalar UI 路径
   * @default 'docs'
   */
  scalarPath?: string;

  /**
   * API 文档标题
   */
  title?: string;

  /**
   * API 文档描述
   */
  description?: string;

  /**
   * API 版本
   * @default '1.0.0'
   */
  version?: string;
}

/**
 * 设置 Swagger + Scalar API 文档
 *
 * 说明：
 * - 使用动态 import 避免 Swagger 依赖被强绑到所有服务
 * - `@nestjs/swagger` 必须由使用方安装
 * - Scalar UI 使用 CDN 版本，无需额外安装 npm 包
 *
 * @param app - NestJS 应用实例
 * @param options - Swagger 配置
 * @returns swaggerPath（若未启用则返回 null）
 *
 * @example
 * ```typescript
 * import { setupSwagger } from '@oksai/nestjs-utils';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   await setupSwagger(app, {
 *     enabled: true,
 *     title: 'My API',
 *     description: 'API 文档',
 *   });
 *
 *   await app.listen(3000);
 * }
 * ```
 */
export async function setupSwagger(
  app: INestApplication,
  options: SetupSwaggerOptions
): Promise<string | null> {
  if (!options.enabled) return null;

  const swaggerPath = options.swaggerPath ?? "swagger";
  const scalarPath = options.scalarPath ?? "docs";
  const enableScalar = options.enableScalar ?? true;

  let SwaggerModule: any;
  let DocumentBuilder: any;

  try {
    const mod = await import("@nestjs/swagger");
    SwaggerModule = (mod as any).SwaggerModule;
    DocumentBuilder = (mod as any).DocumentBuilder;
  } catch (error) {
    throw new Error("未安装 Swagger 依赖：请在 app 的依赖中添加 `@nestjs/swagger`，或在配置中关闭 swagger。");
  }

  const title = options.title ?? "OksAI API";
  const description = options.description ?? "OksAI 平台 API 文档";
  const version = options.version ?? "1.0.0";

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "请输入 JWT Token",
        in: "header",
      },
      "bearer"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      showRequestDuration: true,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: `${title} - Swagger UI`,
  });

  if (enableScalar) {
    await setupScalarUi(app, {
      title,
      scalarPath,
      swaggerJsonPath: `/${swaggerPath}-json`,
    });
  }

  return swaggerPath;
}

/**
 * 设置 Scalar UI（使用 CDN）
 */
async function setupScalarUi(
  app: INestApplication,
  options: {
    title: string;
    scalarPath: string;
    swaggerJsonPath: string;
  }
): Promise<void> {
  const { title, scalarPath, swaggerJsonPath } = options;

  const httpAdapter = app.getHttpAdapter();
  const instance: any = httpAdapter.getInstance();
  const routePath = `/${scalarPath}`;

  const html = (swaggerJsonUrl: string) => `<!doctype html>
<html>
  <head>
    <title>${title} - API 文档</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${title} 的 API 文档" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${swaggerJsonUrl}"
      data-configuration='${JSON.stringify({
        theme: "purple",
        layout: "modern",
        darkMode: true,
        metaData: {
          title: `${title} - API 文档`,
          description: `${title} 的 API 文档`,
        },
        showSidebar: true,
        showToolbar: true,
        persistAuth: true,
      })}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

  instance.get(routePath, (_req: any, replyOrRes: any) => {
    const body = html(swaggerJsonPath);

    if (replyOrRes && typeof replyOrRes.type === "function" && typeof replyOrRes.send === "function") {
      return replyOrRes.type("text/html").send(body);
    }

    if (replyOrRes && typeof replyOrRes.setHeader === "function" && typeof replyOrRes.end === "function") {
      replyOrRes.setHeader("content-type", "text/html; charset=utf-8");
      replyOrRes.end(body);
      return;
    }
  });
}
