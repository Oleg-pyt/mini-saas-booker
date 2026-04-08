import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HealthResponse, HealthService as HealthApiService } from '@benatti/api';

/**
 * HealthService wraps the generated DefaultService from the `api` npm package.
 * The package is generated from api/swagger.json by openapi-generator.
 *
 * Usage in a component:
 *   constructor(private health: HealthService) {}
 *   ngOnInit() { this.health.check().subscribe(r => console.log(r.status)); }
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  constructor(private api: HealthApiService) {}

  check(): Observable<HealthResponse> {
    return this.api.getHealth();
  }
}
