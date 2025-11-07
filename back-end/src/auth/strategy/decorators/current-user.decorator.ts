import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthenticatedUser } from '@/types/user.interface';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
