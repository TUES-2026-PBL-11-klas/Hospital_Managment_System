import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TRPCRouter } from './trpc/trpc.router';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  const trpcRouter = app.get(TRPCRouter);
  trpcRouter.applyMiddleware(app);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`MediNest API running on http://localhost:${port}`);
  console.log(`tRPC endpoint: http://localhost:${port}/trpc`);
}

bootstrap();
