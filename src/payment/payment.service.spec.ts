import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let svc: PaymentService;
  beforeEach(() => { svc = new PaymentService(); });

  it('returns success for normal card', async () => {
    const r = await svc.processPayment({ cardLastFour: '1234', amount: 50 });
    expect(r.status).toBe('success');
    expect(r.paymentId).toMatch(/^mock_pay_/);
    expect(r.failureReason).toBeUndefined();
  });

  it('returns failure for card 0000', async () => {
    const r = await svc.processPayment({ cardLastFour: '0000', amount: 50 });
    expect(r.status).toBe('failure');
    expect(r.paymentId).toMatch(/^mock_fail_/);
    expect(r.failureReason).toBeDefined();
  });

  it('generates unique payment IDs', async () => {
    const [r1, r2] = await Promise.all([svc.processPayment({ cardLastFour: '1111', amount: 10 }), svc.processPayment({ cardLastFour: '2222', amount: 20 })]);
    expect(r1.paymentId).not.toBe(r2.paymentId);
  });

  it('processedAt is valid ISO string', async () => {
    const r = await svc.processPayment({ cardLastFour: '9999', amount: 1 });
    expect(new Date(r.processedAt).toISOString()).toBe(r.processedAt);
  });
});
