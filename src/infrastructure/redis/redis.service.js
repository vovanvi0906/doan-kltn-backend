import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor() {
    this.logger = new Logger(RedisService.name);
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl, {
      lazyConnect: false,
    });
  }

  async onModuleInit() {
    try {
      await this.client.set('thesis:test', 'hello');
      const testVal = await this.client.get('thesis:test');
      this.logger.log(
        `Redis connected successfully. Test write/read verification: thesis:test = "${testVal}"`
      );
    } catch (error) {
      this.logger.error(
        `Failed to connect or perform test operations on Redis: ${error.message}`,
        error.stack
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed.');
    }
  }

  getClient() {
    return this.client;
  }
}
