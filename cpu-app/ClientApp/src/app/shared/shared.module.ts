import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NgxMaskDirective } from "ngx-mask";
import { AlertComponent } from "./alert/alert.component";
import { FooterComponent } from "./footer/footer.component";
import { FormFieldComponent } from "./form-field/form-field.component";
import { HeaderComponent } from "./header/header.component";
import { IconStepperComponent } from "./icon-stepper/icon-stepper.component";
import { NotFoundComponent } from "./not-found/not-found.component";
import { NotificationBannerComponent } from "./notification-banner/notification-banner.component";

@NgModule({
  declarations: [
    AlertComponent,
    FooterComponent,
    HeaderComponent,
    IconStepperComponent,
    NotFoundComponent,
    NotificationBannerComponent,
    FormFieldComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  exports: [
    AlertComponent,
    FooterComponent,
    HeaderComponent,
    IconStepperComponent,
    NotFoundComponent,
    NotificationBannerComponent,
    FormFieldComponent,
  ],
})
export class SharedModule {}
