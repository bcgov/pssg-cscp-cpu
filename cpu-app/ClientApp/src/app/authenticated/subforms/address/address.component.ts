import { Component, forwardRef, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { COUNTRIES_ADDRESS_2, iCountry } from '../../../core/constants/country-list';
import { POSTAL_CODE, WORD } from '../../../core/constants/regex.constants';
import { FormHelper } from '../../../core/form-helper';
import { iAddress } from '../../../core/models/address.interface';

// TODO: not used
@Component({
    selector: 'app-address',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AddressComponent),
            multi: true,
        }
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AddressComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() required: boolean = false;

  private _onChange = (_: any) => { };
  private _onTouched = () => { };
  private onDestroy$: Subject<void> = new Subject();

  public internalFormGroup: UntypedFormGroup;

  country: iCountry;
  postalCodeRegex: RegExp;
  hasCharactersRegex: RegExp;

  constructor() {
    this.country = COUNTRIES_ADDRESS_2.Canada;
    this.postalCodeRegex = POSTAL_CODE;
    this.hasCharactersRegex = WORD;
    this.buildForm();
  }

  ngOnInit(): void {
    this.internalFormGroup.valueChanges
      .pipe(
        tap(value => {
          this._onChange(value);
          this._onTouched();
        }),
        takeUntil(this.onDestroy$),
      ).subscribe();
  }
  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  public formHelper = new FormHelper();
  get line1() { return this.internalFormGroup.get('line1') }
  get line2() { return this.internalFormGroup.get('line2') }
  get city() { return this.internalFormGroup.get('city') }
  get province() { return this.internalFormGroup.get('province') }
  get postalCode() { return this.internalFormGroup.get('postalCode') }

  buildForm() {
    if (this.required) {
      this.internalFormGroup = new UntypedFormGroup({
        'line1': new UntypedFormControl('', [Validators.required, Validators.pattern(this.hasCharactersRegex)]),
        'line2': new UntypedFormControl(''),
        'city': new UntypedFormControl('', [Validators.required, Validators.pattern(this.hasCharactersRegex)]),
        'province': new UntypedFormControl('British Columbia', [Validators.required, Validators.pattern(this.hasCharactersRegex)]),
        'postalCode': new UntypedFormControl('', [Validators.required, Validators.pattern(this.postalCodeRegex), Validators.pattern(this.hasCharactersRegex)]),
      });
    } else {
      this.internalFormGroup = new UntypedFormGroup({
        'line1': new UntypedFormControl(''),
        'line2': new UntypedFormControl(''),
        'city': new UntypedFormControl(''),
        'province': new UntypedFormControl('British Columbia'),
        'postalCode': new UntypedFormControl('', Validators.pattern(this.postalCodeRegex)),
      });
    }
  }

  // ******************ControlValueAccessor interface stuff below *************************
  writeValue(address: iAddress): void {
    if (address) {
      // every time this form control is updated from the parent
      const addressCleaned = {
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        province: address.province || '',
        postalCode: address.postalCode || '',
      };
      this.internalFormGroup.setValue(addressCleaned, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    // when we want to let the parent know that the value of the form control should be updated
    this._onChange = fn;
  }
  registerOnTouched(fn: any): void {
    // when we want to let the parent know that the form control has been touched
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    // when the parent updates the state of the form control
    isDisabled ? this.internalFormGroup.disable() : this.internalFormGroup.enable();
  }
}
