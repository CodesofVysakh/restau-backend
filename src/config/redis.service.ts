import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const password = this.config.get<string>('REDIS_PASSWORD');
    const opts = {
      host:          this.config.get<string>('REDIS_HOST', 'localhost'),
      port:          this.config.get<number>('REDIS_PORT', 6379),
      // password:      this.config.get<string>('REDIS_PASSWORD'),
      ...(password ? { password } : {}),
      tls:           process.env.NODE_ENV === 'production' ? {} : undefined,
      retryStrategy: (t: number) => Math.min(t * 50, 2000),
    };
    this.client     = new Redis(opts);
    this.subscriber = new Redis(opts);
    this.client.on('connect', ()  => this.logger.log('Redis connected'));
    this.client.on('error',   (e) => this.logger.error('Redis error', e));
  }

  async onModuleDestroy() { await this.client.quit(); await this.subscriber.quit(); }

  async get(key: string)                              { return this.client.get(key); }
  async set(key: string, val: string, ttl?: number)   { ttl ? await this.client.setex(key, ttl, val) : await this.client.set(key, val); }
  async del(key: string)                              { await this.client.del(key); }
  async exists(key: string)                           { return (await this.client.exists(key)) === 1; }
  async publish(channel: string, msg: string)         { await this.client.publish(channel, msg); }
  async subscribe(ch: string, fn: (m: string) => void) {
    await this.subscriber.subscribe(ch);
    this.subscriber.on('message', (c, m) => { if (c === ch) fn(m); });
  }
  getClient() { return this.client; }
}
