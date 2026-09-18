import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Défaut Express (100kb) trop bas pour une note vocale encodée en base64 (conseiller) ; 6 Mo de marge
  // au-dessus de la limite posée dans ChatDto (~4 Mo) pour le reste du JSON.
  app.use(json({ limit: '6mb' }));
  app.use(urlencoded({ extended: true, limit: '6mb' }));

  // Derrière nginx : nécessaire pour que la limitation des tentatives voie l'IP du client et non celle du proxy
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  // CSP désactivée : sans intérêt pour une API JSON et incompatible avec Swagger UI
  app.use(helmet({ contentSecurityPolicy: false }));

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Mon Orientation API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
