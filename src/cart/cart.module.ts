import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { MenuModule } from '../menu/menu.module';
import { RedisService } from '../config/redis.service';
@Module({ imports: [MenuModule], controllers: [CartController], providers: [CartService, RedisService], exports: [CartService] })
export class CartModule {}
