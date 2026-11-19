import { Component, Input, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Option } from "../../../shared/form-field/form-field.component";

@Component({
  selector: "app-person-editor-form",
  templateUrl: "./person-editor-form.component.html",
  styleUrls: ["./person-editor-form.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PersonEditorFormComponent implements OnInit {
  @Input() personForm: FormGroup;
  @Input() isPoliceContact: boolean = false;

  employmentStatusOptions: Option[] = [
    { label: "--", value: "null" },
    { label: "Full-Time", value: "Full-Time" },
    { label: "Sub-Contracted", value: "Sub-Contracted" },
    { label: "Part-Time", value: "Part-Time" },
    { label: "Leave of Absence", value: "Leave of Absence" },
    { label: "Volunteer", value: "Volunteer" },
  ];

  constructor() {}

  ngOnInit() {}

  get firstName(): FormControl {
    return this.personForm?.get("firstName") as FormControl;
  }

  get middleName(): FormControl {
    return this.personForm?.get("middleName") as FormControl;
  }

  get lastName(): FormControl {
    return this.personForm?.get("lastName") as FormControl;
  }

  get title(): FormControl {
    return this.personForm?.get("title") as FormControl;
  }

  get email(): FormControl {
    return this.personForm?.get("email") as FormControl;
  }

  get phone2(): FormControl {
    return this.personForm?.get("phone2") as FormControl;
  }

  get phone2Extension(): FormControl {
    return this.personForm?.get("phone2Extension") as FormControl;
  }

  get phone(): FormControl {
    return this.personForm?.get("phone") as FormControl;
  }

  get phoneExtension(): FormControl {
    return this.personForm?.get("phoneExtension") as FormControl;
  }

  get fax(): FormControl {
    return this.personForm?.get("fax") as FormControl;
  }

  get addressSameAsAgency(): FormControl {
    return this.personForm?.get("addressSameAsAgency") as FormControl;
  }

  get employmentStatus(): FormControl {
    return this.personForm?.get("employmentStatus") as FormControl;
  }

  get addressForm(): FormGroup {
    return this.personForm?.get("address") as FormGroup;
  }
}
