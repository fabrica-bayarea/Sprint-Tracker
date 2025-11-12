import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { BOARD_ROLES_KEY } from '@/auth/strategy/decorators/board-rules.decorator';
import { PrismaService } from '@/prisma/prisma.service';

import type { Request } from 'express';

type GuardReqBody = {
  boardId?: string;
  listId?: string;
  [key: string]: unknown;
};

interface AuthenticatedRequest
  extends Request<Record<string, string>, unknown, GuardReqBody> {
  user?: { id?: string };
}

@Injectable()
export class BoardRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(BOARD_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // Se o endpoint não declarou roles, apenas exige autenticação
    if (requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user?.id) throw new ForbiddenException('Usuário não autenticado');

    const boardId = await this.resolveBoardId(req);
    if (!boardId) {
      throw new ForbiddenException('Board não identificado para autorização');
    }

    const membership = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: user.id } },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('Você não tem acesso a este board.');
    }

    const isAllowed = requiredRoles.includes(membership.role);
    if (!isAllowed) {
      throw new ForbiddenException(
        'Ação não permitida para seu papel no board.',
      );
    }

    return true;
  }

  private async resolveBoardId(
    req: AuthenticatedRequest,
  ): Promise<string | null> {
    // 1) Param direto por diferentes nomes comuns
    if (req.params?.boardId) return req.params.boardId;

    // 2) Body direto
    if (req.body?.boardId) return req.body.boardId;

    // 3) Derivar via List
    const tryResolveByListId = async (listId: string | undefined) => {
      if (!listId) return null;
      const list = await this.prisma.list.findUnique({
        where: { id: listId },
        select: { boardId: true },
      });
      return list?.boardId ?? null;
    };

    // - Param listId
    const byParamList = await tryResolveByListId(req.params?.listId);
    if (byParamList) return byParamList;

    // - Body listId (ex.: criar task)
    const byBodyList = await tryResolveByListId(req.body?.listId);
    if (byBodyList) return byBodyList;

    // 4) Derivar via Task
    const tryResolveByTaskId = async (taskId: string | undefined) => {
      if (!taskId) return null;
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        select: { list: { select: { boardId: true } } },
      });
      return task?.list?.boardId ?? null;
    };

    // - Param id pode ser Task em várias rotas
    const byParamIdAsTask = await tryResolveByTaskId(req.params?.id);
    if (byParamIdAsTask) return byParamIdAsTask;

    // - Param taskId explícito
    const byParamTask = await tryResolveByTaskId(req.params?.taskId);
    if (byParamTask) return byParamTask;

    return null;
  }
}
