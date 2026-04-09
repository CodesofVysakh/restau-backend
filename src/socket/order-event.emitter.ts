import { Injectable, Logger } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { WsOrderStatusPayload } from '../common/types';
@Injectable()
export class OrderEventEmitter {
  private readonly logger = new Logger(OrderEventEmitter.name);
  constructor(private readonly gateway: OrdersGateway) {}
  async emitNewOrder(order: any)                    { try { this.gateway.emitNewOrder(order); }          catch (e) { this.logger.error('emitNewOrder failed', e); } }
  async emitStatusUpdate(p: WsOrderStatusPayload)   { try { this.gateway.emitStatusUpdate(p); }          catch (e) { this.logger.error('emitStatusUpdate failed', e); } }
}
