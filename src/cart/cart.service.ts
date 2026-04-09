import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { RedisService } from '../config/redis.service';
import { MenuRepository } from '../menu/menu.repository';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto, SetTableDto } from './dto/cart.dto';
import { Cart, CartItem, CartItemCustomization, PriceDriftItem } from '../common/types';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly TAX:  number;
  private readonly TTL:  number;
  constructor(private redis: RedisService, private menuRepo: MenuRepository, private prisma: PrismaService, private config: ConfigService) {
    this.TAX = config.get<number>('TAX_RATE', 0.08);
    this.TTL = config.get<number>('CART_TTL_SECONDS', 86400);
  }
  private key(sid: string) { return `cart:${sid}`; }

  async getCart(sid: string): Promise<Cart> {
    const raw = await this.redis.get(this.key(sid));
    if (!raw) return this.empty(sid);
    return this.recalc(JSON.parse(raw));
  }

  async getCartWithPriceCheck(sid: string): Promise<Cart> {
    const cart = await this.getCart(sid);
    if (!cart.items.length) return cart;
    const ids     = [...new Set(cart.items.map(i => i.menuItemId))];
    const current = await this.menuRepo.findItemsByIds(ids);
    const map     = new Map(current.map(i => [i.id, Number(i.basePrice)]));
    const drift: PriceDriftItem[] = cart.items
      .filter(i => map.has(i.menuItemId) && map.get(i.menuItemId) !== i.basePrice)
      .map(i => ({ menuItemId: i.menuItemId, name: i.name, cartPrice: i.basePrice, currentPrice: map.get(i.menuItemId)! }));
    return { ...cart, priceDrift: drift.length ? drift : undefined };
  }

  async setTable(sid: string, dto: SetTableDto): Promise<Cart> {
    const cart = await this.getCart(sid);
    cart.tableNumber = dto.tableNumber;
    await this.save(sid, cart);
    return cart;
  }

  async addItem(sid: string, dto: AddCartItemDto): Promise<Cart> {
    const item = await this.menuRepo.findItemById(dto.menuItemId);
    if (!item)             throw new NotFoundException(`Item '${dto.menuItemId}' not found`);
    if (!item.isAvailable) throw new BadRequestException(`'${item.name}' is unavailable`);
    if (item.stockQuantity < dto.quantity) throw new BadRequestException(`Only ${item.stockQuantity} available`);

    const customs: CartItemCustomization[] = [];
    if (dto.customizations?.length) {
      const opts = await this.prisma.customizationOption.findMany({ where: { id: { in: dto.customizations.map(c=>c.optionId) }, group: { menuItemId: dto.menuItemId } } });
      if (opts.length !== dto.customizations.length) throw new BadRequestException('Invalid customization options');
      customs.push(...opts.map(o => ({ optionId: o.id, label: o.label, priceDelta: Number(o.priceDelta) })));
    }

    const cart      = await this.getCart(sid);
    const customSum = customs.reduce((s,c) => s + c.priceDelta, 0);
    const newItem: CartItem = {
      id: uuid(), menuItemId: item.id, name: item.name, imageUrl: item.imageUrl,
      basePrice: Number(item.basePrice), quantity: dto.quantity, customizations: customs,
      specialInstructions: dto.specialInstructions,
      itemTotal: (Number(item.basePrice) + customSum) * dto.quantity,
    };
    cart.items.push(newItem);
    const updated = this.recalc(cart);
    await this.save(sid, updated);
    return updated;
  }

  async updateItem(sid: string, cartItemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(sid);
    const idx  = cart.items.findIndex(i => i.id === cartItemId);
    if (idx === -1) throw new NotFoundException(`Cart item '${cartItemId}' not found`);
    if (dto.quantity === 0) { cart.items.splice(idx, 1); }
    else {
      const item = cart.items[idx];
      if (dto.quantity !== undefined) item.quantity = dto.quantity;
      if (dto.specialInstructions !== undefined) item.specialInstructions = dto.specialInstructions;
      item.itemTotal = (item.basePrice + item.customizations.reduce((s,c)=>s+c.priceDelta,0)) * item.quantity;
    }
    const updated = this.recalc(cart);
    await this.save(sid, updated);
    return updated;
  }

  async removeItem(sid: string, cartItemId: string): Promise<Cart> {
    const cart = await this.getCart(sid);
    const prev = cart.items.length;
    cart.items = cart.items.filter(i => i.id !== cartItemId);
    if (cart.items.length === prev) throw new NotFoundException(`Cart item '${cartItemId}' not found`);
    const updated = this.recalc(cart);
    await this.save(sid, updated);
    return updated;
  }

  async clearCart(sid: string) { await this.redis.del(this.key(sid)); }

  private recalc(cart: Cart): Cart {
    const subtotal  = cart.items.reduce((s,i) => s + i.itemTotal, 0);
    const tax       = Math.round(subtotal * this.TAX * 100) / 100;
    const total     = Math.round((subtotal + tax) * 100) / 100;
    const itemCount = cart.items.reduce((s,i) => s + i.quantity, 0);
    return { ...cart, subtotal, tax, total, itemCount };
  }

  private async save(sid: string, cart: Cart) {
    await this.redis.set(this.key(sid), JSON.stringify(cart), this.TTL);
  }

  private empty(sid: string): Cart {
    return { sessionId: sid, tableNumber: '', items: [], subtotal: 0, tax: 0, total: 0, itemCount: 0 };
  }
}
