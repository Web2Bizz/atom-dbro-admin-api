import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VersioningType, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { json } from 'express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.use(json({ limit: '10mb' }));

    const organizationsLogger = new Logger('OrganizationsRequestLogger');

    app.use((req: any, res: any, next: any) => {
      if (req.method === 'POST' && req.path.includes('/organizations')) {
        const endpoint = req.originalUrl ?? req.path;
        const method = req.method;
        const bodyContent =
          req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body ?? '');
        const bodyBits = Buffer.byteLength(bodyContent, 'utf8') * 8;

        organizationsLogger.debug(
          `Organizations request -> endpoint: ${endpoint}, method: ${method}, body size: ${bodyBits} bits`,
        );
      }
      next();
    });

    // CORS конфигурация
    const corsLogger = new Logger('CORS');
    const corsOriginsEnv = configService.get<string>('CORS_ORIGINS');
    const allowedOrigins = corsOriginsEnv
      ? corsOriginsEnv.split(',').map((origin) => origin.trim())
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    corsLogger.log(`CORS configuration: NODE_ENV=${process.env.NODE_ENV}, isDevelopment=${isDevelopment}`);
    corsLogger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          corsLogger.debug('Request without origin - allowing');
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          corsLogger.debug(`Origin ${origin} is in allowed list - allowing`);
          return callback(null, true);
        }
        
        if (isDevelopment && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
          corsLogger.debug(`Origin ${origin} is localhost in development - allowing`);
          return callback(null, true);
        }
        
        corsLogger.warn(`CORS: Origin ${origin} is not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
      ],
      exposedHeaders: ['Authorization'],
      maxAge: 86400,
    });

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
      .setTitle('Atom DBRO Admin Backend API')
      .setDescription('API для админ панели Atom DBRO')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log('Swagger configured');

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
    console.log(`📚 Swagger API docs: http://0.0.0.0:${port}/api`);
    console.log(`🌐 API v1 endpoints: http://0.0.0.0:${port}/api/v1`);
    console.log(`🌐 API v2 endpoints: http://0.0.0.0:${port}/api/v2`);
  } catch (error) {
    console.error('❌ Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();

