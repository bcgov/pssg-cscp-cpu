import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import {
  EMAIL_PATTERN,
  PHONE_NUMBER_PATTERN,
} from "../../../core/constants/regex.constants";
import { FormHelper } from "../../../core/form-helper";
import { iContactInformation } from "../../../core/models/contact-information.interface";

@Component({
  selector: "app-primary-contact-info",
  templateUrl: "./primary-contact-info.component.html",
  styleUrls: ["./primary-contact-info.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PrimaryContactInfoComponent implements OnInit {
  @Input() contactInformation: iContactInformation;
  @Input() isDisabled: boolean = false;
  @Output() contactInformationChange = new EventEmitter<iContactInformation>();

  public formHelper = new FormHelper();
  emailRegex: string = EMAIL_PATTERN;
  phoneRegex: string = PHONE_NUMBER_PATTERN;
  constructor() {}

  ngOnInit() {}
}
