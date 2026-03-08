import type { ExecutionContext } from "@nestjs/common";

type GqlExecutionContextType = {
  create: (context: ExecutionContext) => {
    getContext: () => { req: any };
  };
};

declare global {
  // biome-ignore lint/suspicious/noRedeclare: 用于测试环境注入 mock
  var __TEST_GQL_EXECUTION_CONTEXT__: GqlExecutionContextType | undefined;
}

let GqlExecutionContext: GqlExecutionContextType | undefined;

function getGqlExecutionContext(): GqlExecutionContextType {
  if (GqlExecutionContext) {
    return GqlExecutionContext;
  }

  if (globalThis.__TEST_GQL_EXECUTION_CONTEXT__) {
    GqlExecutionContext = globalThis.__TEST_GQL_EXECUTION_CONTEXT__;
    return GqlExecutionContext;
  }

  try {
    const gqlModule = require("@nestjs/graphql");
    GqlExecutionContext = gqlModule.GqlExecutionContext;
    return GqlExecutionContext!;
  } catch (error) {
    throw new Error(
      "@nestjs/graphql is not installed. Please install it to use GraphQL context: npm install @nestjs/graphql graphql"
    );
  }
}

/**
 * Extracts the request object from either HTTP, GraphQL or WebSocket execution context
 * @param context - The execution context
 * @returns The request object
 */
export function getRequestFromContext(context: ExecutionContext) {
  const contextType = context.getType<"graphql" | "ws" | "http">();
  if (contextType === "graphql") {
    const gqlContext = getGqlExecutionContext().create(context);
    return gqlContext.getContext().req;
  }

  if (contextType === "ws") {
    return context.switchToWs().getClient();
  }

  return context.switchToHttp().getRequest();
}
