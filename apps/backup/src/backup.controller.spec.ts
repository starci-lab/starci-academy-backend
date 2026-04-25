import { Test, TestingModule } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

describe('BackupController', () => {
  let backupController: BackupController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [BackupService],
    }).compile();

    backupController = app.get<BackupController>(BackupController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(backupController.getHello()).toBe('Hello World!');
    });
  });
});
