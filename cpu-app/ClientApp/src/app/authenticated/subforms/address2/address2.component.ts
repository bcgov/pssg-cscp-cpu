import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import { COUNTRIES_ADDRESS_2 } from "../../../core/constants/country-list";
import { POSTAL_CODE_PATTERN } from "../../../core/constants/regex.constants";
import { FormHelper } from "../../../core/form-helper";
import { iAddress } from "../../../core/models/address.interface";

@Component({
  selector: "app-address2",
  templateUrl: "./address2.component.html",
  styleUrls: ["./address2.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class Address2Component implements OnInit {
  public formHelper = new FormHelper();
  @Input() address: iAddress;
  @Input() isDisabled: boolean = false;
  @Input() addressRequired: boolean = false;
  @Output() addressChange = new EventEmitter<iAddress>();

  countries: any;
  country: any;
  postalRegex: string;

  constructor() {
    this.postalRegex = POSTAL_CODE_PATTERN;
    this.countries = COUNTRIES_ADDRESS_2;
    this.country =
      this.address && this.address.country
        ? COUNTRIES_ADDRESS_2[this.address.country]
        : COUNTRIES_ADDRESS_2["Canada"];
  }

  ngOnInit() {}
  onChange() {
    this.addressChange.emit(this.address);
  }
}
