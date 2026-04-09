import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MenuItemQueryDto } from './dto/menu-query.dto';

export const menuItemInclude = {
  category: true,
  customizationGroups: { include: { options: true } },
} satisfies Prisma.MenuItemInclude;

@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllCategories() { return this.prisma.category.findMany({ orderBy: { displayOrder: 'asc' } }); }

  findAllItems(q: MenuItemQueryDto) {
    const where: Prisma.MenuItemWhereInput = {};
    if (q.available !== false) where.isAvailable = true;
    if (q.category)            where.category    = { slug: q.category };
    if (q.search)              where.name        = { contains: q.search, mode: 'insensitive' };
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.basePrice = {};
      if (q.minPrice !== undefined) (where.basePrice as Prisma.DecimalFilter).gte = q.minPrice;
      if (q.maxPrice !== undefined) (where.basePrice as Prisma.DecimalFilter).lte = q.maxPrice;
    }
    if (q.dietary?.length) where.dietaryTags = { hasEvery: q.dietary };
    return this.prisma.menuItem.findMany({ where, include: menuItemInclude, orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }] });
  }

  findItemById(id: string) { return this.prisma.menuItem.findUnique({ where: { id }, include: menuItemInclude }); }

  findItemsByIds(ids: string[]) {
    return this.prisma.menuItem.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, basePrice: true, stockQuantity: true, isAvailable: true } });
  }
}
