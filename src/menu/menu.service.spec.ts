import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';
import { RedisService } from '../config/redis.service';

const mockRepo  = { findAllCategories: jest.fn(), findAllItems: jest.fn(), findItemById: jest.fn() };
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

const cat  = { id: 'c1', name: 'Appetizers', slug: 'appetizers', displayOrder: 1 };
const item = { id: 'i1', categoryId: 'c1', name: 'Burrata', description: 'desc', imageUrl: '', basePrice: '16.00', prepTimeMins: 8, stockQuantity: 25, isAvailable: true, dietaryTags: [], updatedAt: new Date(), createdAt: new Date(), category: cat, customizationGroups: [] };

describe('MenuService', () => {
  let svc: MenuService;
  beforeEach(async () => {
    const m = await Test.createTestingModule({ providers: [MenuService, { provide: MenuRepository, useValue: mockRepo }, { provide: RedisService, useValue: mockRedis }] }).compile();
    svc = m.get(MenuService);
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('returns from cache on hit', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify([cat]));
      expect(await svc.getCategories()).toEqual([cat]);
      expect(mockRepo.findAllCategories).not.toHaveBeenCalled();
    });
    it('fetches and caches on miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRepo.findAllCategories.mockResolvedValue([cat]);
      await svc.getCategories();
      expect(mockRepo.findAllCategories).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('getItems', () => {
    it('serializes basePrice to number', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRepo.findAllItems.mockResolvedValue([item]);
      const r = await svc.getItems({});
      expect(typeof r[0].basePrice).toBe('number');
      expect(r[0].basePrice).toBe(16);
    });
    it('skips cache for filtered queries', async () => {
      mockRepo.findAllItems.mockResolvedValue([]);
      await svc.getItems({ search: 'test' });
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('getItemById', () => {
    it('returns cached item without hitting DB', async () => {
      const cached = { ...item, basePrice: 16 };
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const r = await svc.getItemById('i1');
      expect(r).toEqual(cached);
      expect(mockRepo.findItemById).not.toHaveBeenCalled();
    });
    it('throws NotFoundException when not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRepo.findItemById.mockResolvedValue(null);
      await expect(svc.getItemById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
