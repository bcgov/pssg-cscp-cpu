import { TestBed } from '@angular/core/testing';

import { NotificationQueueService } from './notification-queue.service';

describe('NotificationQueueService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NotificationQueueService = TestBed.inject(NotificationQueueService);
    expect(service).toBeTruthy();
  });
});
