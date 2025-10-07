"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('App (e2e)', () => {
    let app;
    let accessToken;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    it('/auth/login (POST) - should login user', () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@example.com', password: 'admin123' })
            .expect(200)
            .expect((res) => {
            expect(res.body.accessToken).toBeDefined();
            accessToken = res.body.accessToken;
        });
    });
    it('/projects (POST) - should create project', () => {
        return request(app.getHttpServer())
            .post('/projects')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            name: 'Test Project',
            description: 'Test project description',
        })
            .expect(201)
            .expect((res) => {
            expect(res.body.id).toBeDefined();
        });
    });
    it('/projects/:projectId/issues (POST) - should create issue', () => {
        return request(app.getHttpServer())
            .post('/projects/1/issues')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            title: 'Test Issue',
            description: 'Test issue description',
        })
            .expect(201)
            .expect((res) => {
            expect(res.body.id).toBeDefined();
        });
    });
    it('/projects/:projectId/issues/:id (GET) - should get issue', () => {
        return request(app.getHttpServer())
            .get('/projects/1/issues/1')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
            .expect((res) => {
            expect(res.body.id).toBe(1);
            expect(res.body.title).toBe('Test Issue');
        });
    });
    afterAll(async () => {
        await app.close();
    });
});
//# sourceMappingURL=app.e2e-spec.js.map