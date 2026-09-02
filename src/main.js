import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Cấu hình Global Prefix
  app.setGlobalPrefix('api');

  // 2. Kích hoạt CORS
  app.enableCors();

  // 3. Kích hoạt Global ValidationPipe với whitelist & transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // 4. Cấu hình OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('On-Demand Services API (ProjectConnect / FixGo)')
    .setDescription('Hệ thống API kết nối dịch vụ sửa chữa gia đình theo thời gian thực (On-Demand)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend Server running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger API Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
