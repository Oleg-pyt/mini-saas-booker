import { Routes } from '@angular/router';
import { DashboardComponent } from "./dashboard/dashboard";
import { BookingPageComponent } from './booking-page/booking-page.component';
import { BusinessDetailsComponent } from './business-details/business-details.component';
import { bookingAuthGuard } from '../auth/guards/booking-auth.guard';

export const mainRoutes: Routes = [
    {
        path: '',
        component: DashboardComponent
    },
    {
        path: 'business/:id/book',
        canActivate: [bookingAuthGuard],
        component: BookingPageComponent
    },
    {
        path: 'business/:id',
        component: BusinessDetailsComponent
    }
];
