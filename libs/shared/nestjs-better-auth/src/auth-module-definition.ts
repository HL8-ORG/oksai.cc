import { ConfigurableModuleBuilder } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import type { Auth } from "./auth-module.js";

export interface AuthModuleOptions<A = Auth> {
  auth: A;
  /**
   * Platform to use for the authentication module.
   * - 'express' (default) - Uses Express platform
   * - 'fastify' - Uses Fastify platform
   *
   * Note: When using Fastify, you need to install:
   * - @nestjs/platform-fastify
   * - fastify
   *
   * @default 'express'
   */
  platform?: "express" | "fastify";
  disableTrustedOriginsCors?: boolean;
  disableBodyParser?: boolean;
  /**
   * When set to `true`, enables raw body parsing and attaches it to `req.rawBody`.
   *
   * This is useful for webhook signature verification that requires the raw,
   * unparsed request body.
   *
   * **Important:** Since this library disables NestJS's built-in body parser,
   * NestJS's `rawBody: true` option in `NestFactory.create()` has no effect.
   * Use this option instead.
   *
   * @default false
   */
  enableRawBodyParser?: boolean;
  middleware?: (req: Request, res: Response, next: NextFunction) => void;
}

export const MODULE_OPTIONS_TOKEN = Symbol("AUTH_MODULE_OPTIONS");

export const { ConfigurableModuleClass, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<AuthModuleOptions>({
    optionsInjectionToken: MODULE_OPTIONS_TOKEN,
  })
    .setClassMethodName("forRoot")
    .setExtras(
      {
        isGlobal: true,
        disableGlobalAuthGuard: false,
        disableControllers: false,
      },
      (def, extras) => ({
        ...def,
        global: extras.isGlobal,
      })
    )
    .build();
