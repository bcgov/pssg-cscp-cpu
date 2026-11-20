import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { nameAssemble } from "../../../core/constants/name-assemble";
import { iPerson } from "../../../core/models/person.interface";
import { Transmogrifier } from "../../../core/models/transmogrifier.class";
import { StateService } from "../../../core/services/state.service";

@Component({
  selector: "app-person-picker-form",
  templateUrl: "./person-picker-form.component.html",
  styleUrls: ["./person-picker-form.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PersonPickerFormComponent implements OnInit, OnDestroy {
  @Input() title = "Select Person";
  @Input() idNum: number = 0;
  @Input() control: FormControl;
  @Input() errorMessage: string = "Please select a person";

  person: iPerson;

  public nameAssemble = nameAssemble;
  trans: Transmogrifier;
  private stateSubscription: Subscription;
  private controlSubscription: Subscription;

  constructor(private stateService: StateService) {}

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
    this.controlSubscription?.unsubscribe();
  }
  ngOnInit() {
    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.trans = m;

        if (this.trans?.persons) {
          this.person = this.trans.persons.find(
            (p) => p.personId === this.control.value,
          );
        }
      },
    );

    this.controlSubscription = this.control.valueChanges.subscribe((value) => {
      if (this.trans?.persons && value) {
        this.person = this.trans.persons.find((p) => p.personId === value);
      }
    });
  }

  get isDirtyOrTouched(): boolean {
    if (!this.control) return false;

    return this.control.dirty || this.control.touched;
  }

  get isRequired(): boolean {
    if (!this.control) return false;

    return (
      this.control?.hasValidator &&
      this.control.hasValidator(Validators.required)
    );
  }

  get hasError(): boolean {
    if (!this.control) return false;

    return this.control.hasError("required") && this.isDirtyOrTouched;
  }

  get personOptions() {
    if (!this.trans?.persons) return [];

    return this.trans.persons.map((p) => ({
      value: p.personId,
      label: `${nameAssemble(p.firstName, p.middleName, p.lastName)}${p.title ? " - " + p.title : ""}`,
    }));
  }
}
