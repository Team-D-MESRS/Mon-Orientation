import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const estProduction = process.env.NODE_ENV === 'production';
  if (estProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères en production');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Le conseiller accepte uniquement du texte court ; garder une limite de corps JSON réduite.
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));

  // Derrière nginx : nécessaire pour que la limitation des tentatives voie l'IP du client et non celle du proxy
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  // CSP désactivée : sans intérêt pour une API JSON et incompatible avec Swagger UI
  app.use(helmet({ contentSecurityPolicy: false }));

  app.setGlobalPrefix('api');

  const originesAutorisees = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origine) => origine.trim())
    .filter(Boolean);
  app.enableCors({
    origin: originesAutorisees,
    credentials: true,
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Mon Orientation API')
    .setDescription('API de la plateforme nationale d\'orientation scolaire')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  if (!estProduction || process.env.ENABLE_SWAGGER === 'true') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Mon Orientation API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
