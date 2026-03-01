/**
 * @nestjs/graphql mock for tests
 */

export const GqlExecutionContext = {
  create: jest.fn((context: any) => ({
    getContext: () => ({
      req: context.switchToHttp().getRequest(),
    }),
  })),
};
