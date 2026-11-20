import { Component, Input, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { COUNTRIES_ADDRESS_2 } from "../../../core/constants/country-list";
import { POSTAL_CODE_PATTERN } from "../../../core/constants/regex.constants";
import { Option } from "../../../shared/form-field/form-field.component";

@Component({
  selector: "app-address-form",
  templateUrl: "./address-form.component.html",
  styleUrls: ["./address-form.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AddressFormComponent implements OnInit {
  @Input() formGroup: FormGroup;

  countries: any;
  country: any;
  postalRegex: string;

  constructor() {
    this.postalRegex = POSTAL_CODE_PATTERN;
    this.countries = COUNTRIES_ADDRESS_2;
  }

  ngOnInit() {
    this.updateCountry();
  }

  private updateCountry(): void {
    const countryValue = this.formGroup?.get("country")?.value;

    this.country =
      countryValue && COUNTRIES_ADDRESS_2[countryValue]
        ? COUNTRIES_ADDRESS_2[countryValue]
        : COUNTRIES_ADDRESS_2["Canada"];
  }

  get line1Control() {
    return this.formGroup?.get("line1") || null;
  }

  get line2Control() {
    return this.formGroup?.get("line2") || null;
  }

  get cityControl() {
    return this.formGroup?.get("city") || null;
  }

  get provinceControl() {
    return this.formGroup?.get("province") || null;
  }

  get postalCodeControl() {
    return this.formGroup?.get("postalCode") || null;
  }

  get countryControl() {
    return this.formGroup?.get("country") || null;
  }

  get provinceOptions(): Option[] {
    return this.country?.areas?.map((area: any) => ({
      label: area,
      value: area,
    }));
  }
}
