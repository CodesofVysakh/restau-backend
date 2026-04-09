import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../common/types';

const orderInclude = {
  items: { include: { menuItem: { select: { name: true, imageUrl: true } }, customizations: { include: { option: { select: { label: true } } } } } },
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll()                  { return this.prisma.order.findMany({ include: orderInclude, orderBy: { placedAt: 'desc' } }); }
  findById(id: string)       { return this.prisma.order.findUnique({ where: { id }, include: orderInclude }); }
  findBySession(sid: string) { return this.prisma.order.findMany({ where: { sessionId: sid }, include: orderInclude, orderBy: { placedAt: 'desc' } }); }

  async createWithStockLock(data: {
    tableNumber: string; sessionId: string; subtotal: number; tax: number; total: number; paymentId: string;
    items: Array<{ menuItemId: string; quantity: number; unitPrice: number; specialInstructions?: string; customizations: Array<{ optionId: string; priceDelta: number }> }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const rows = await tx.$queryRaw<Array<{ id: string; stock_quantity: number; name: string }>>`
          SELECT id, stock_quantity, name FROM menu_items WHERE id = ${item.menuItemId}::text FOR UPDATE`;
        if (!rows[0]) throw new Error(`Menu item ${item.menuItemId} not found`);
        if (rows[0].stock_quantity < item.quantity)
          throw new Error(`Insufficient stock for "${rows[0].name}". Requested: ${item.quantity}, Available: ${rows[0].stock_quantity}`);
        await tx.$executeRaw`UPDATE menu_items SET stock_quantity = stock_quantity - ${item.quantity} WHERE id = ${item.menuItemId}::text`;
      }
      return tx.order.create({
        data: {
          tableNumber: data.tableNumber, sessionId: data.sessionId,
          subtotal: data.subtotal, tax: data.tax, total: data.total,
          paymentStatus: 'PAID', paymentId: data.paymentId, status: 'RECEIVED',
          items: { create: data.items.map(i => ({
            menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: i.unitPrice,
            specialInstructions: i.specialInstructions,
            customizations: { create: i.customizations.map(c => ({ optionId: c.optionId, priceDelta: c.priceDelta })) },
          })) },
          statusHistory: { create: [{ status: 'RECEIVED' }] },
        },
        include: orderInclude,
      });
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({ where: { id }, data: { status }, include: orderInclude });
      await tx.orderStatusHistory.create({ data: { orderId: id, status } });
      return order;
    });
  }
}
