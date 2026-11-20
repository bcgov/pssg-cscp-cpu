import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";

export type InputType =
  | "text"
  | "tel"
  | "email"
  | "number"
  | "phone"
  | "password"
  | "date";
export type ControlType = "input" | "select";

export type Option = { label: string; value: any };

@Component({
  selector: "app-form-field",
  templateUrl: "./form-field.component.html",
  styleUrls: ["./form-field.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class FormFieldComponent {
  @Input() type: InputType = "text";
  @Input() controlType: ControlType = "input";

  @Input() id: string;
  @Input() label: string;
  @Input() placeholder: string = "";
  @Input() control?: FormControl;
  @Input() mask: string = "";
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() errorMessage: string = "Try Again";
  @Input() trimOnBlur: boolean = true;

  // select-specific inputs
  @Input() options?: Option[];

  constructor() {}

  get isDirtyOrTouched(): boolean {
    if (!this.control) return false;
    return this.control.dirty || this.control.touched;
  }

  get isValid(): boolean {
    if (!this.control) return false;
    return this.control.valid && this.isDirtyOrTouched && !!this.control.value;
  }

  get hasError(): boolean {
    if (!this.control) return false;
    return this.control.invalid && this.isDirtyOrTouched;
  }

  get isRequired(): boolean {
    return (
      this.required ||
      (this.control?.hasValidator &&
        this.control.hasValidator(Validators.required))
    );
  }

  onBlur(): void {
    if (
      this.trimOnBlur &&
      this.control?.value &&
      typeof this.control.value === "string"
    ) {
      const trimmedValue = this.control.value.trim();
      if (trimmedValue !== this.control.value) {
        this.control.setValue(trimmedValue);
      }
    }
  }
}
