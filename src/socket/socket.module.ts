import { Module } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { OrderEventEmitter } from './order-event.emitter';
import { AuthModule } from '../auth/auth.module';
@Module({ imports: [AuthModule], providers: [OrdersGateway, OrderEventEmitter], exports: [OrderEventEmitter] })
export class SocketModule {}
