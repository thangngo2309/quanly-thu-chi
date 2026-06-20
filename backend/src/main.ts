import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = Number(
    configService.get<string>('PORT') ??
      configService.get<string>('BE_PORT') ??
      6200,
  );

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ??
    'http://localhost:6201';

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: frontendUrl
      .split(',')
      .map((item) => item.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Quản lý thu chi API')
    .setDescription(
      'API quản lý doanh thu, công nợ, khoản chi và lợi nhuận',
    )
    .setVersion('1.0')
    .addTag('Sales')
    .addTag('Expenses')
    .addTag('Dashboard')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup(
    'api/docs',
    app,
    swaggerDocument,
    {
      swaggerOptions: {
        persistAuthorization: true,
      },
    },
  );

  await app.listen(port, '0.0.0.0');

  console.log(
    `Backend đang chạy tại: http://localhost:${port}/api`,
  );

  console.log(
    `Swagger đang chạy tại: http://localhost:${port}/api/docs`,
  );
};

void bootstrap();