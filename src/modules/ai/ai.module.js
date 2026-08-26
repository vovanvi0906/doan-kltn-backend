import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { FastApiAiClient } from '../../infrastructure/external/ai/fastapi-ai.client';

@Module({
  controllers: [AiController],
  providers: [AiService, FastApiAiClient],
  exports: [AiService, FastApiAiClient],
})
export class AiModule {}
