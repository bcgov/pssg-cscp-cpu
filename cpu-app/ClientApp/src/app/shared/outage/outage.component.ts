import { Component, effect, inject, ChangeDetectionStrategy } from "@angular/core";
import { Router } from "@angular/router";
import { HealthCheckService } from "../../core/services/health-check.service";

@Component({
  selector: "app-outage",
  template: `
    <div class="outage-wrapper">
      <div class="outage-card">
        <div class="outage-icon" aria-hidden="true">⚠</div>
        <h1>Service Unavailable</h1>
        <p class="lead">
          We're sorry — the CPU Portal is temporarily unavailable due to planned
          maintenance or an unexpected issue.
        </p>
        <p>
          Please try again in a few minutes. If the problem persists, contact
          your system administrator.
        </p>
        <button class="retry-btn" (click)="retry()">Try Again</button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        background: #f4f6f9;
      }

      .outage-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 1rem;
      }

      .outage-card {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        max-width: 520px;
        width: 100%;
        padding: 3rem 2.5rem;
        text-align: center;
      }

      .outage-icon {
        font-size: 4rem;
        color: #d9534f;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      .lead {
        font-size: 1.05rem;
        color: #555;
        margin-bottom: 0.75rem;
      }

      p {
        color: #777;
        margin-bottom: 1.5rem;
      }

      .retry-btn {
        background: #003366;
        color: #fff;
        border: none;
        border-radius: 4px;
        padding: 0.6rem 1.8rem;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
      }

      .retry-btn:hover {
        background: #00529b;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class OutageComponent {
  private readonly healthCheckService = inject(HealthCheckService);
  private readonly router = inject(Router);

  constructor() {
    // Automatically navigate home as soon as the API reports healthy again.
    effect(() => {
      if (this.healthCheckService.isHealthy()) {
        this.router.navigateByUrl("/");
      }
    });
  }

  retry(): void {
    // Re-run the health check and let the effect handle navigation if healthy.
    this.healthCheckService.initialize();
  }
}
