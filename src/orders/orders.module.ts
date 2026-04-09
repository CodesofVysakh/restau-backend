import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CartModule } from '../cart/cart.module';
import { PaymentModule } from '../payment/payment.module';
import { SocketModule } from '../socket/socket.module';
@Module({ imports: [CartModule, PaymentModule, SocketModule], controllers: [OrdersController], providers: [OrdersService, OrdersRepository], exports: [OrdersService] })
export class OrdersModule {}
