import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PaymentRequest, PaymentResult } from '../common/types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
    if (req.cardLastFour === '0000') {
      this.logger.warn(`Payment declined — card ****${req.cardLastFour}`);
      return { paymentId: `mock_fail_${uuid()}`, status: 'failure', processedAt: new Date().toISOString(), failureReason: 'Card declined — insufficient funds' };
    }
    const paymentId = `mock_pay_${uuid().replace(/-/g,'').slice(0,16)}`;
    this.logger.log(`Payment OK: ${paymentId} $${req.amount}`);
    return { paymentId, status: 'success', processedAt: new Date().toISOString() };
  }
}
