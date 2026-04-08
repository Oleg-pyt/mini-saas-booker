import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HealthResponse, HealthService as HealthApiService } from '@benatti/api';

@Injectable()
export class HealthService {
  constructor(private api: HealthApiService) {}

  check(): Observable<HealthResponse> {
    return this.api.getHealth();
  }
}

