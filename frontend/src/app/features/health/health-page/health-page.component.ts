import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from '../health.service';

@Component({
  selector: 'app-health-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-page.component.html',
  styleUrl: './health-page.component.scss'
})
export class HealthPageComponent implements OnInit {
  protected readonly status = signal<string>('loading...');

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.healthService.check().subscribe({
      next: (r) => this.status.set(r.status ?? 'unknown'),
      error: () => this.status.set('error')
    });
  }
}
