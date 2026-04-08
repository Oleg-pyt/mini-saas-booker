import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { mainRoutes } from './main.routes';
import { DashboardComponent } from './dashboard/dashboard';
import { BusinessFiltersComponent } from './business-filters/business-filters.component';
import { BusinessCardComponent } from './business-card/business-card.component';
import { BusinessListComponent } from './business-list/business-list.component';
import { BusinessDetailsComponent } from './business-details/business-details.component';
import { BookingPageComponent } from './booking-page/booking-page.component';
import { BookingStepServiceComponent } from './booking-step-service/booking-step-service.component';
import { BookingStepReviewComponent } from './booking-step-review/booking-step-review.component';
import { ApiModule } from '@benatti/api';

@NgModule({
  declarations: [
    DashboardComponent,
    BusinessFiltersComponent,
    BusinessCardComponent,
    BusinessListComponent,
    BusinessDetailsComponent,
    BookingPageComponent,
    BookingStepServiceComponent,
    BookingStepReviewComponent
  ],
  imports: [
    CommonModule,
    ApiModule,
    RouterModule.forChild(mainRoutes)
  ]
})
export class MainModule {}
