import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RedisService } from '../config/redis.service';
import { MenuRepository } from './menu.repository';
import { MenuItemQueryDto } from './dto/menu-query.dto';

const TTL  = 300;
const KEYS = { categories: 'menu:categories', items: (s:string)=>`menu:items:${s}`, item: (id:string)=>`menu:item:${id}` };

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  constructor(private readonly repo: MenuRepository, private readonly redis: RedisService) {}

  async getCategories() {
    const c = await this.redis.get(KEYS.categories);
    if (c) return JSON.parse(c);
    const data = await this.repo.findAllCategories();
    await this.redis.set(KEYS.categories, JSON.stringify(data), TTL);
    return data;
  }

  async getItems(q: MenuItemQueryDto) {
    const simple = !q.search && !q.category && !q.dietary?.length && q.minPrice === undefined && q.maxPrice === undefined;
    const key    = KEYS.items([q.category,q.search,q.minPrice,q.maxPrice,q.dietary?.join('-'),q.available].join(':'));
    if (simple) { const c = await this.redis.get(key); if (c) return JSON.parse(c); }
    const items  = (await this.repo.findAllItems(q)).map(this.serialize);
    if (simple) await this.redis.set(key, JSON.stringify(items), TTL);
    return items;
  }

  async getItemById(id: string) {
    const c = await this.redis.get(KEYS.item(id));
    if (c) return JSON.parse(c);
    const item = await this.repo.findItemById(id);
    if (!item) throw new NotFoundException(`Menu item '${id}' not found`);
    const s = this.serialize(item);
    await this.redis.set(KEYS.item(id), JSON.stringify(s), TTL);
    return s;
  }

  async invalidateCache() {
    await this.redis.del(KEYS.categories);
    this.logger.log('Menu cache invalidated');
  }

  private serialize(item: any) {
    return {
      ...item,
      basePrice: Number(item.basePrice),
      customizationGroups: item.customizationGroups?.map((g: any) => ({
        ...g, options: g.options.map((o: any) => ({ ...o, priceDelta: Number(o.priceDelta) })),
      })),
    };
  }
}
