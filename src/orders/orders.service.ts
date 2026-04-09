import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CartService } from '../cart/cart.service';
import { PaymentService } from '../payment/payment.service';
import { OrderEventEmitter } from '../socket/order-event.emitter';
import { PlaceOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { OrderStatus, isValidTransition } from '../common/types';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly repo:         OrdersRepository,
    private readonly cartService:  CartService,
    private readonly payment:      PaymentService,
    private readonly events:       OrderEventEmitter,
  ) {}

  async placeOrder(dto: PlaceOrderDto) {
    const cart = await this.cartService.getCartWithPriceCheck(dto.sessionId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');
    if (cart.priceDrift?.length)
      throw new ConflictException({ message: 'Prices changed since cart addition', priceDrift: cart.priceDrift });

    const pay = await this.payment.processPayment({ cardLastFour: dto.cardLastFour, amount: cart.total });
    if (pay.status === 'failure')
      throw new BadRequestException({ message: 'Payment failed', reason: pay.failureReason, paymentId: pay.paymentId });

    let order: any;
    try {
      order = await this.repo.createWithStockLock({
        tableNumber: dto.tableNumber || cart.tableNumber,
        sessionId: dto.sessionId,
        subtotal: cart.subtotal, tax: cart.tax, total: cart.total,
        paymentId: pay.paymentId,
        items: cart.items.map(i => ({
          menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: i.basePrice,
          specialInstructions: i.specialInstructions,
          customizations: i.customizations.map(c => ({ optionId: c.optionId, priceDelta: c.priceDelta })),
        })),
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Insufficient stock'))
        throw new ConflictException(err.message);
      throw err;
    }

    await this.cartService.clearCart(dto.sessionId);
    const serialized = this.serialize(order);
    await this.events.emitNewOrder(serialized);
    this.logger.log(`Order ${order.id} placed — table ${order.tableNumber}`);
    return serialized;
  }

  async getAllOrders()                      { return (await this.repo.findAll()).map(this.serialize); }
  async getOrderById(id: string)            { const o = await this.repo.findById(id); if (!o) throw new NotFoundException(`Order '${id}' not found`); return this.serialize(o); }
  async getOrdersBySession(sid: string)     { return (await this.repo.findBySession(sid)).map(this.serialize); }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Order '${id}' not found`);

    const from = existing.status as OrderStatus;
    const to   = dto.status     as OrderStatus;
    if (!isValidTransition(from, to))
      throw new BadRequestException(`Invalid transition: ${from} → ${to}`);

    const updated    = await this.repo.updateStatus(id, to);
    const serialized = this.serialize(updated);
    await this.events.emitStatusUpdate({ orderId: id, status: to, tableNumber: updated.tableNumber, timestamp: new Date().toISOString() });
    this.logger.log(`Order ${id}: ${from} → ${to}`);
    return serialized;
  }

  private serialize(o: any) {
    return {
      ...o,
      subtotal: Number(o.subtotal), tax: Number(o.tax), total: Number(o.total),
      placedAt:  o.placedAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items.map((i: any) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        name:      i.menuItem?.name,
        imageUrl:  i.menuItem?.imageUrl,
        itemTotal: Number(i.unitPrice) * i.quantity + i.customizations.reduce((s: number, c: any) => s + Number(c.priceDelta), 0) * i.quantity,
        customizations: i.customizations.map((c: any) => ({ ...c, priceDelta: Number(c.priceDelta), label: c.option?.label })),
      })),
      statusHistory: o.statusHistory.map((h: any) => ({ ...h, changedAt: h.changedAt.toISOString() })),
    };
  }
}
