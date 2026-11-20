import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import {
  EMAIL_PATTERN,
  PHONE_NUMBER_PATTERN,
} from "../../../core/constants/regex.constants";
import { FormHelper } from "../../../core/form-helper";
import { iContactInformation } from "../../../core/models/contact-information.interface";

@Component({
  selector: "app-primary-contact-form",
  templateUrl: "./primary-contact-form.component.html",
  styleUrls: ["./primary-contact-form.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PrimaryContactFormComponent implements OnInit {
  @Input() contactInformation: iContactInformation;
  @Input() formGroup?: FormGroup;
  @Output() contactInformationChange = new EventEmitter<iContactInformation>();

  public formHelper = new FormHelper();
  emailRegex: string = EMAIL_PATTERN;
  phoneRegex: string = PHONE_NUMBER_PATTERN;

  ngOnInit() {}

  get emailControl() {
    return this.formGroup?.get("emailAddress") || null;
  }

  get phoneControl() {
    return this.formGroup?.get("phoneNumber") || null;
  }

  get faxControl() {
    return this.formGroup?.get("faxNumber") || null;
  }
}
