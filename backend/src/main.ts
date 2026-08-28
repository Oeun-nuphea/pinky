import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Use WsAdapter for WebSockets
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Pinky NestJS Backend API running on http://localhost:${port}`);
  console.log(`📡 WebSocket Terminal Gateway available at ws://localhost:${port}/ws/terminal`);
  console.log(`📦 APT Repository distribution hosted at http://localhost:${port}/public/dists/stable`);
}

bootstrap();
