import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartService } from './cart.service';
import { RedisService } from '../config/redis.service';
import { MenuRepository } from '../menu/menu.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Cart } from '../common/types';

const mockRedis  = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
const mockRepo   = { findItemById: jest.fn(), findItemsByIds: jest.fn() };
const mockPrisma = { customizationOption: { findMany: jest.fn() } };
const mockConfig = { get: jest.fn((k: string, d?: any) => k === 'TAX_RATE' ? 0.08 : k === 'CART_TTL_SECONDS' ? 86400 : d) };

const menuItem = { id: 'i1', name: 'Burrata', imageUrl: '', basePrice: '16.00', prepTimeMins: 8, stockQuantity: 25, isAvailable: true, dietaryTags: [], customizationGroups: [] };
const emptyCart = (): Cart => ({ sessionId: 's1', tableNumber: '5', items: [], subtotal: 0, tax: 0, total: 0, itemCount: 0 });

describe('CartService', () => {
  let svc: CartService;
  beforeEach(async () => {
    const m = await Test.createTestingModule({ providers: [CartService, { provide: RedisService, useValue: mockRedis }, { provide: MenuRepository, useValue: mockRepo }, { provide: PrismaService, useValue: mockPrisma }, { provide: ConfigService, useValue: mockConfig }] }).compile();
    svc = m.get(CartService);
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('returns empty cart for new session', async () => {
      mockRedis.get.mockResolvedValue(null);
      const c = await svc.getCart('new');
      expect(c.items).toHaveLength(0);
    });
    it('returns cart from Redis', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(emptyCart()));
      const c = await svc.getCart('s1');
      expect(c.sessionId).toBe('s1');
    });
  });

  describe('addItem', () => {
    it('adds item and calculates totals', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRepo.findItemById.mockResolvedValue(menuItem);
      mockPrisma.customizationOption.findMany.mockResolvedValue([]);
      await svc.addItem('s1', { menuItemId: 'i1', quantity: 2 });
      const saved = JSON.parse(mockRedis.set.mock.calls[0][1]);
      expect(saved.items).toHaveLength(1);
      expect(saved.subtotal).toBe(32);
      expect(saved.tax).toBeCloseTo(2.56, 2);
    });
    it('throws NotFoundException for missing item', async () => {
      mockRepo.findItemById.mockResolvedValue(null);
      await expect(svc.addItem('s1', { menuItemId: 'bad', quantity: 1 })).rejects.toThrow(NotFoundException);
    });
    it('throws BadRequestException when unavailable', async () => {
      mockRepo.findItemById.mockResolvedValue({ ...menuItem, isAvailable: false });
      await expect(svc.addItem('s1', { menuItemId: 'i1', quantity: 1 })).rejects.toThrow(BadRequestException);
    });
    it('throws BadRequestException on insufficient stock', async () => {
      mockRepo.findItemById.mockResolvedValue({ ...menuItem, stockQuantity: 1 });
      await expect(svc.addItem('s1', { menuItemId: 'i1', quantity: 5 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', async () => {
      const cart = emptyCart();
      cart.items = [{ id: 'ci1', menuItemId: 'i1', name: 'Burrata', imageUrl: '', basePrice: 16, quantity: 1, customizations: [], itemTotal: 16 }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cart));
      await svc.removeItem('s1', 'ci1');
      const saved = JSON.parse(mockRedis.set.mock.calls[0][1]);
      expect(saved.items).toHaveLength(0);
    });
    it('throws NotFoundException for unknown cart item', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(emptyCart()));
      await expect(svc.removeItem('s1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('stale price detection', () => {
    it('returns priceDrift when price increased', async () => {
      const cart = emptyCart();
      cart.items = [{ id: 'ci1', menuItemId: 'i1', name: 'Burrata', imageUrl: '', basePrice: 16, quantity: 1, customizations: [], itemTotal: 16 }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cart));
      mockRepo.findItemsByIds.mockResolvedValue([{ id: 'i1', name: 'Burrata', basePrice: '18.00', stockQuantity: 25, isAvailable: true }]);
      const r = await svc.getCartWithPriceCheck('s1');
      expect(r.priceDrift).toHaveLength(1);
      expect(r.priceDrift![0].currentPrice).toBe(18);
    });
    it('returns no priceDrift when prices unchanged', async () => {
      const cart = emptyCart();
      cart.items = [{ id: 'ci1', menuItemId: 'i1', name: 'Burrata', imageUrl: '', basePrice: 16, quantity: 1, customizations: [], itemTotal: 16 }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cart));
      mockRepo.findItemsByIds.mockResolvedValue([{ id: 'i1', name: 'Burrata', basePrice: '16.00', stockQuantity: 25, isAvailable: true }]);
      const r = await svc.getCartWithPriceCheck('s1');
      expect(r.priceDrift).toBeUndefined();
    });
  });

  it('clearCart deletes Redis key', async () => {
    await svc.clearCart('s1');
    expect(mockRedis.del).toHaveBeenCalledWith('cart:s1');
  });
});
