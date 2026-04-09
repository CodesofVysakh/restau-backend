import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true } })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(OrdersGateway.name);
  constructor(private readonly authService: AuthService) {}

  handleConnection   (client: Socket) { this.logger.log(`Connected:    ${client.id}`); }
  handleDisconnect   (client: Socket) { this.logger.log(`Disconnected: ${client.id}`); }

  @SubscribeMessage('join:order')
  handleJoinOrder(@MessageBody() data: { orderId: string }, @ConnectedSocket() client: Socket) {
    const room = `order:${data.orderId}`;
    client.join(room);
    client.emit('joined', { room });
  }

  @SubscribeMessage('join:kitchen')
  async handleJoinKitchen(@MessageBody() data: { token: string }, @ConnectedSocket() client: Socket) {
    try {
      await this.authService.validateToken(data.token);
      client.join('kitchen:global');
      client.emit('joined', { room: 'kitchen:global' });
    } catch {
      client.emit('error', { message: 'Unauthorized' });
    }
  }

  emitNewOrder(order: any) {
    this.server.to('kitchen:global').emit('order:new', { order });
  }

  emitStatusUpdate(payload: { orderId: string; status: string; tableNumber: string; timestamp: string }) {
    this.server.to(`order:${payload.orderId}`).emit('order:status', payload);
    this.server.to('kitchen:global').emit('order:status', payload);
  }
}
