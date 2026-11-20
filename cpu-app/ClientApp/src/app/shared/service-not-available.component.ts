import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-service-not-available",
  template: `
    <div class="service-error-message">
      <p>
        The Community Programs Unit application is currently down. Please retry
        later.
      </p>
      <p>
        If you need assistance, contact
        <a href="mailto:vspcontracts@gov.bc.ca">vspcontracts&#64;gov.bc.ca</a>.
      </p>
    </div>
  `,
  styles: [
    `
      .service-error-message {
        color: white;
      }
      .service-error-message p {
        margin: 8px 0;
      }
      .service-error-message a {
        color: white;
        text-decoration: underline;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ServiceNotAvailableComponent {
  constructor() {}
}
