import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { healthRoutes } from './health.routes';

/**
 * HealthModule - Feature module for health check functionality
 */
@NgModule({
  imports: [
    CommonModule, 
    RouterModule.forChild(healthRoutes)
  ]
})
export class HealthModule {}
