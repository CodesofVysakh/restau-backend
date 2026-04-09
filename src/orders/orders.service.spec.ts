import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CartService } from '../cart/cart.service';
import { PaymentService } from '../payment/payment.service';
import { OrderEventEmitter } from '../socket/order-event.emitter';
import { OrderStatus, PaymentStatus } from '../common/types';

const mockRepo    = { findAll: jest.fn(), findById: jest.fn(), findBySession: jest.fn(), createWithStockLock: jest.fn(), updateStatus: jest.fn() };
const mockCart    = { getCartWithPriceCheck: jest.fn(), clearCart: jest.fn() };
const mockPayment = { processPayment: jest.fn() };
const mockEvents  = { emitNewOrder: jest.fn(), emitStatusUpdate: jest.fn() };

const makeOrder = (status = OrderStatus.RECEIVED) => ({
  id: 'order-1', tableNumber: '5', sessionId: 's1', status,
  subtotal: 32, tax: 2.56, total: 34.56, paymentStatus: PaymentStatus.PAID, paymentId: 'p1',
  placedAt: new Date(), updatedAt: new Date(), items: [], statusHistory: [{ id: 'h1', status, changedAt: new Date() }],
});

const mockCart_ = { sessionId: 's1', tableNumber: '5', items: [{ id: 'ci1', menuItemId: 'i1', name: 'Burrata', imageUrl: '', basePrice: 16, quantity: 2, customizations: [], itemTotal: 32 }], subtotal: 32, tax: 2.56, total: 34.56, itemCount: 2 };

describe('OrdersService', () => {
  let svc: OrdersService;
  beforeEach(async () => {
    const m = await Test.createTestingModule({ providers: [OrdersService, { provide: OrdersRepository, useValue: mockRepo }, { provide: CartService, useValue: mockCart }, { provide: PaymentService, useValue: mockPayment }, { provide: OrderEventEmitter, useValue: mockEvents }] }).compile();
    svc = m.get(OrdersService);
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    it('places order, clears cart, emits event', async () => {
      mockCart.getCartWithPriceCheck.mockResolvedValue(mockCart_);
      mockPayment.processPayment.mockResolvedValue({ paymentId: 'p1', status: 'success', processedAt: new Date().toISOString() });
      mockRepo.createWithStockLock.mockResolvedValue(makeOrder());
      const r = await svc.placeOrder({ sessionId: 's1', tableNumber: '5', cardLastFour: '1234' });
      expect(r.id).toBe('order-1');
      expect(mockCart.clearCart).toHaveBeenCalledWith('s1');
      expect(mockEvents.emitNewOrder).toHaveBeenCalledTimes(1);
    });
    it('throws BadRequestException for empty cart', async () => {
      mockCart.getCartWithPriceCheck.mockResolvedValue({ ...mockCart_, items: [] });
      await expect(svc.placeOrder({ sessionId: 's1', tableNumber: '5', cardLastFour: '1234' })).rejects.toThrow(BadRequestException);
    });
    it('throws BadRequestException on payment failure', async () => {
      mockCart.getCartWithPriceCheck.mockResolvedValue(mockCart_);
      mockPayment.processPayment.mockResolvedValue({ status: 'failure', paymentId: 'f1', processedAt: new Date().toISOString(), failureReason: 'Declined' });
      await expect(svc.placeOrder({ sessionId: 's1', tableNumber: '5', cardLastFour: '0000' })).rejects.toThrow(BadRequestException);
      expect(mockRepo.createWithStockLock).not.toHaveBeenCalled();
    });
    it('throws ConflictException on price drift', async () => {
      mockCart.getCartWithPriceCheck.mockResolvedValue({ ...mockCart_, priceDrift: [{ menuItemId: 'i1', name: 'Burrata', cartPrice: 16, currentPrice: 18 }] });
      await expect(svc.placeOrder({ sessionId: 's1', tableNumber: '5', cardLastFour: '1234' })).rejects.toThrow(ConflictException);
      expect(mockPayment.processPayment).not.toHaveBeenCalled();
    });
    it('throws ConflictException on stock lock failure', async () => {
      mockCart.getCartWithPriceCheck.mockResolvedValue(mockCart_);
      mockPayment.processPayment.mockResolvedValue({ status: 'success', paymentId: 'p1', processedAt: new Date().toISOString() });
      mockRepo.createWithStockLock.mockRejectedValue(new Error('Insufficient stock for "Burrata". Requested: 2, Available: 1'));
      await expect(svc.placeOrder({ sessionId: 's1', tableNumber: '5', cardLastFour: '1234' })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus — FSM', () => {
    it('allows RECEIVED → PREPARING', async () => {
      mockRepo.findById.mockResolvedValue(makeOrder(OrderStatus.RECEIVED));
      mockRepo.updateStatus.mockResolvedValue(makeOrder(OrderStatus.PREPARING));
      const r = await svc.updateStatus('order-1', { status: OrderStatus.PREPARING });
      expect(r.status).toBe(OrderStatus.PREPARING);
      expect(mockEvents.emitStatusUpdate).toHaveBeenCalledTimes(1);
    });
    it('rejects RECEIVED → COMPLETED (skipping)', async () => {
      mockRepo.findById.mockResolvedValue(makeOrder(OrderStatus.RECEIVED));
      await expect(svc.updateStatus('order-1', { status: OrderStatus.COMPLETED })).rejects.toThrow(BadRequestException);
    });
    it('rejects backward PREPARING → RECEIVED', async () => {
      mockRepo.findById.mockResolvedValue(makeOrder(OrderStatus.PREPARING));
      await expect(svc.updateStatus('order-1', { status: OrderStatus.RECEIVED })).rejects.toThrow(BadRequestException);
    });
    it('rejects any transition from COMPLETED', async () => {
      mockRepo.findById.mockResolvedValue(makeOrder(OrderStatus.COMPLETED));
      await expect(svc.updateStatus('order-1', { status: OrderStatus.READY })).rejects.toThrow(BadRequestException);
    });
    it('throws NotFoundException for unknown order', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(svc.updateStatus('bad', { status: OrderStatus.PREPARING })).rejects.toThrow(NotFoundException);
    });
  });
});
