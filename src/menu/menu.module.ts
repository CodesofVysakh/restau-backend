import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';
import { RedisService } from '../config/redis.service';
@Module({ controllers: [MenuController], providers: [MenuService, MenuRepository, RedisService], exports: [MenuService, MenuRepository] })
export class MenuModule {}
