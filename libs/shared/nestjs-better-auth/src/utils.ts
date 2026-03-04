import type { ExecutionContext } from "@nestjs/common";

// biome-ignore lint/suspicious/noExplicitAny: GqlExecutionContext comes from optional @nestjs/graphql dependency
let GqlExecutionContext: any;

function getGqlExecutionContext(): any {
  if (!GqlExecutionContext) {
    try {
      GqlExecutionContext = require("@nestjs/graphql").GqlExecutionContext;
    } catch (error) {
      throw new Error(
        "@nestjs/graphql is not installed. Please install it to use GraphQL context: npm install @nestjs/graphql graphql"
      );
    }
  }
  return GqlExecutionContext;
}

/**
 * Extracts the request object from either HTTP, GraphQL or WebSocket execution context
 * @param context - The execution context
 * @returns The request object
 */
export function getRequestFromContext(context: ExecutionContext) {
  const contextType = context.getType<"graphql" | "ws" | "http">();
  if (contextType === "graphql") {
    return getGqlExecutionContext().create(context).getContext().req;
  }

  if (contextType === "ws") {
    return context.switchToWs().getClient();
  }

  return context.switchToHttp().getRequest();
}
