import { Component, Input, NgModule, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "signature-pad",
  template: "<canvas></canvas>",
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SignaturePadComponent {
  @Input() options: object = {};
  clear() {}
  set(_option: string, _value: unknown) {}
  getCanvas() {
    return document.createElement("canvas");
  }
  toDataURL() {
    return "";
  }
  fromDataURL(_dataURL: string) {}
  isEmpty() {
    return true;
  }
  on() {}
  off() {}
}

@NgModule({
  declarations: [SignaturePadComponent],
  exports: [SignaturePadComponent],
})
export class AngularSignaturePadModule {}
