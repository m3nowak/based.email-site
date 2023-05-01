import { TestBed } from '@angular/core/testing';

import { NatsDemoService } from './nats-demo.service';

describe('NatsDemoService', () => {
  let service: NatsDemoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NatsDemoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
