import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger configuration (only in non-production environments)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || 'InsightFlow API')
      .setDescription(
        process.env.SWAGGER_DESCRIPTION ||
          'API documentation for InsightFlow application',
      )
      .setVersion(process.env.SWAGGER_VERSION || '1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH || 'docs', app, document);
  }

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `📚 Swagger documentation: http://localhost:${port}/${process.env.SWAGGER_PATH || 'docs'}`,
    );
  }
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
