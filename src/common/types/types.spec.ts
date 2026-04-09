import { OrderStatus, isValidTransition, ORDER_STATUS_TRANSITIONS } from './index';

describe('OrderStatus FSM', () => {
  const valid: [OrderStatus, OrderStatus][] = [
    [OrderStatus.RECEIVED, OrderStatus.PREPARING],
    [OrderStatus.PREPARING, OrderStatus.READY],
    [OrderStatus.READY, OrderStatus.COMPLETED],
  ];
  it.each(valid)('allows %s → %s', (from, to) => expect(isValidTransition(from, to)).toBe(true));

  const invalid: [OrderStatus, OrderStatus][] = [
    [OrderStatus.RECEIVED,  OrderStatus.READY],
    [OrderStatus.RECEIVED,  OrderStatus.COMPLETED],
    [OrderStatus.PREPARING, OrderStatus.RECEIVED],
    [OrderStatus.READY,     OrderStatus.PREPARING],
    [OrderStatus.COMPLETED, OrderStatus.READY],
    [OrderStatus.COMPLETED, OrderStatus.RECEIVED],
  ];
  it.each(invalid)('rejects %s → %s', (from, to) => expect(isValidTransition(from, to)).toBe(false));

  it('COMPLETED has no allowed next states', () => expect(ORDER_STATUS_TRANSITIONS[OrderStatus.COMPLETED]).toHaveLength(0));
  it('each non-terminal state has exactly one next state', () => {
    [OrderStatus.RECEIVED, OrderStatus.PREPARING, OrderStatus.READY].forEach(s => expect(ORDER_STATUS_TRANSITIONS[s]).toHaveLength(1));
  });
});
