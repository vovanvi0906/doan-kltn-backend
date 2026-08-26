import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('App Bootstrapping (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should initialize the application successfully', () => {
    expect(app).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
