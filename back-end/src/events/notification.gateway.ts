import { WebSocketGateway } from '@nestjs/websockets';

import { BaseGateway } from './base.gateway';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway extends BaseGateway {
  /**
   * Envia notificação de nova notificação para o usuário especificado.
   * Retorna true se a notificação foi enviada (ou seja, se havia clientes conectados),
   * ou false caso contrário.
   */
  public sendNewNotificationToUser(userId: string): boolean {
    if (!this.server) {
      this.logger.error('WebSocket server não inicializado!');
      return false;
    }

    const room = this.server.sockets.adapter.rooms.get(userId);
    if (!room || room.size === 0) {
      this.logger.warn(`Nenhum cliente conectado na sala ${userId}`);
      return false;
    }

    this.server.to(userId).emit('newNotification');
    this.logger.log(
      `Evento 'newNotification' emitido para o usuário: ${userId}`,
    );

    return true;
  }
}
