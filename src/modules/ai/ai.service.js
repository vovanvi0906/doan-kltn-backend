import { Injectable, Dependencies } from '@nestjs/common';
import { FastApiAiClient } from '../../infrastructure/external/ai/fastapi-ai.client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(FastApiAiClient, PrismaService)
export class AiService {
  constructor(fastApiAiClient, prisma) {
    this.fastApiAiClient = fastApiAiClient;
    this.prisma = prisma;
  }

  async verifyFace(workerUserId, faceImageUrl, idCardImageUrl) {
    const result = await this.fastApiAiClient.verifyFace(
      faceImageUrl,
      idCardImageUrl,
    );

    if (result.matched && workerUserId) {
      await this.prisma.workerProfile.update({
        where: { userId: workerUserId },
        data: { idCardVerified: true },
      });
    }

    return result;
  }

  async analyzeBeforeAfter(orderId, beforeImageUrl, afterImageUrl) {
    const result = await this.fastApiAiClient.analyzeBeforeAfter(
      beforeImageUrl,
      afterImageUrl,
    );

    if (orderId && result.completed) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          beforeImageUrl,
          afterImageUrl,
        },
      });
    }

    return result;
  }

  async analyzeIncident(orderId, imageUrl, description) {
    const result = await this.fastApiAiClient.analyzeIncident(
      imageUrl,
      description,
    );

    if (orderId && result.issueDetected) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          aiDetectedIssue: result.issueDetected,
        },
      });
    }

    return result;
  }
}
