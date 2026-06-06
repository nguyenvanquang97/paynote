import 'reflect-metadata';
import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {getConfig} from './shared/config';

async function bootstrap() {
  const config = getConfig();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: config.allowedOrigin === '*' ? true : config.allowedOrigin,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: false}));

  await app.listen(config.port);
}

void bootstrap();
