import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@libs/common/filter/http-exception.filter';
import { HttpResponseInterceptor } from '@libs/common/interceptor/http-response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Config } from '@xingliu/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new HttpResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin:
      process.env.APP_ENV === 'development'
        ? [`http://${Config.host.dev.creator}`, `http://${Config.host.dev.web}`]
        : [`https://${Config.host.prod.creator}`, `https://${Config.host.prod.web}`],
  });

  const config = new DocumentBuilder()
    .setTitle('AI Creator Platform API')
    .setDescription('AI 创作者平台后端接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.use(
    '/docs',
    apiReference({
      content: document,
      title: 'AI Creator Platform API Reference',
    }),
  );

  await app.listen(Config.port.server);
}

void bootstrap();
