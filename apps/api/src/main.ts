import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: [config.get<string>("WEB_ORIGIN")!, config.get<string>("ADMIN_ORIGIN")!],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Shopstart API")
    .setDescription("REST API for the shopstart e-commerce template")
    .setVersion("0.1.0")
    .addCookieAuth("access_token")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = config.get<number>("PORT")!;
  await app.listen(port);
  console.log(`Shopstart API listening on http://localhost:${port} (docs at /docs)`);
}

bootstrap();
