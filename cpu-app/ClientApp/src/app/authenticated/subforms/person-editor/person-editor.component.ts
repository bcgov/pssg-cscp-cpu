import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import {
  EMAIL_PATTERN,
  LETTERS_SPACES_PATTERN,
  NAME_REGEX_PATTERN,
  PHONE_NUMBER_PATTERN,
} from "../../../core/constants/regex.constants";
import { FormHelper } from "../../../core/form-helper";
import { iPerson } from "../../../core/models/person.interface";

@Component({
  selector: "app-person-editor",
  templateUrl: "./person-editor.component.html",
  styleUrls: ["./person-editor.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PersonEditorComponent implements OnInit {
  @Input() person: iPerson;
  @Input() isDisabled: boolean = false;
  @Input() idNum: number = 0;
  @Input() isPoliceContact: boolean = false;
  @Input() invalidFields: string[] = [];
  @Output() personChange = new EventEmitter<iPerson>();
  @Output() setAddress = new EventEmitter<iPerson>();
  @Output() clearAddress = new EventEmitter<iPerson>();

  public formHelper = new FormHelper();
  me: boolean = false;
  emailRegex: string = EMAIL_PATTERN;
  phoneRegex: string = PHONE_NUMBER_PATTERN;
  wordRegex: string = LETTERS_SPACES_PATTERN;
  nameRegex: string = NAME_REGEX_PATTERN;
  constructor() {}

  ngOnInit() {
    if (this.person.me) {
      this.me = true;
    }
  }

  onChanges() {
    this.personChange.emit(this.person);
  }

  setAddressSameAsAgency() {
    if (!this.person.addressSameAsAgency) {
      this.setAddress.emit(this.person);
    } else {
      this.clearAddress.emit(this.person);
    }
  }
}
