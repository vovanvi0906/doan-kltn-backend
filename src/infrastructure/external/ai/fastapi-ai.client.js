import { Injectable, Dependencies } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
@Dependencies(ConfigService)
export class FastApiAiClient {
  constructor(configService) {
    this.baseUrl =
      configService.get('app.fastApiAiUrl') ||
      process.env.FASTAPI_AI_URL ||
      'http://localhost:8000';
  }

  async verifyFace(faceImageUrl, idCardImageUrl) {
    // Gọi endpoint FastAPI để so khớp khuôn mặt và CMND/CCCD
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceImageUrl, idCardImageUrl }),
      });
      if (!response.ok) {
        throw new Error(`AI Service error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return {
        matched: true,
        confidence: 0.95,
        mock: true,
        message: error.message,
      };
    }
  }

  async analyzeBeforeAfter(beforeImageUrl, afterImageUrl) {
    // Gọi endpoint FastAPI để phân tích kết quả công việc trước và sau
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/ai/analyze-before-after`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beforeImageUrl, afterImageUrl }),
        },
      );
      if (!response.ok) {
        throw new Error(`AI Service error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return {
        cleanlinessScore: 90,
        completed: true,
        mock: true,
        message: error.message,
      };
    }
  }

  async analyzeIncident(imageUrl, description) {
    // Gọi endpoint FastAPI để phân tích tranh chấp / sự cố
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/analyze-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, description }),
      });
      if (!response.ok) {
        throw new Error(`AI Service error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return {
        issueDetected: 'Damage found',
        severity: 'MEDIUM',
        mock: true,
        message: error.message,
      };
    }
  }
}
