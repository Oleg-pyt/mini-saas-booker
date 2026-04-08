import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { HealthService } from '../health/health.service';
import { ApiModule } from '@benatti/api';

/**
 * CoreModule contains singleton services and core functionality
 * Should be imported only once in the AppModule
 */
@NgModule({
  imports: [
    CommonModule,
    ApiModule,
    HttpClientModule
  ]
})
export class CoreModule {}
