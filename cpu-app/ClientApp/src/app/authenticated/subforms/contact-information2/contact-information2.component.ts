import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import {
  EMAIL_PATTERN,
  PHONE_NUMBER_PATTERN,
} from "../../../core/constants/regex.constants";
import { FormHelper } from "../../../core/form-helper";
import { iContactInformation } from "../../../core/models/contact-information.interface";

@Component({
  selector: "app-contact-information2",
  templateUrl: "./contact-information2.component.html",
  styleUrls: ["./contact-information2.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ContactInformation2Component implements OnInit {
  @Input() contactInformation: iContactInformation;
  @Output() contactInformationChange = new EventEmitter<iContactInformation>();

  public formHelper = new FormHelper();
  emailRegex: string = EMAIL_PATTERN;
  phoneRegex: string = PHONE_NUMBER_PATTERN;

  constructor() {}

  ngOnInit() {}
}
