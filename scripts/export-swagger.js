"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.SKIP_DB = 'true';
process.env.DATABASE_URL = 'postgresql://dummy:dummy@dummy:5432/dummy';
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookieParser = require("cookie-parser");
const app_module_1 = require("../src/app.module");
const fs = require("fs");
const path = require("path");
async function exportSwagger() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: false });
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('API')
        .setDescription('API description')
        .setVersion('1.0')
        .addTag('auth')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addCookieAuth('refresh_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
    })
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    const outputPath = path.join(docsDir, 'swagger.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`Swagger documentation exported to ${outputPath}`);
    await app.close();
}
exportSwagger().catch(console.error);
//# sourceMappingURL=export-swagger.js.map