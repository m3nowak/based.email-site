import { TestBed } from '@angular/core/testing';

import { DmzHttpService } from './dmz-http.service';

describe('DmzHttpService', () => {
  let service: DmzHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DmzHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
