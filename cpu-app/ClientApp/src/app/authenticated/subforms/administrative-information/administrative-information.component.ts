import { AbstractControl } from '@angular/forms';
import { Component, OnInit, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { TransmogrifierProgramApplication } from '../../../core/models/transmogrifier-program-application.class';
import { FormHelper } from '../../../core/form-helper';

@Component({
    selector: 'app-administrative-information',
    templateUrl: './administrative-information.component.html',
    styleUrls: ['./administrative-information.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdministrativeInformationComponent implements OnInit {
  @Input() transmogrifierProgramApplication: TransmogrifierProgramApplication;
  @Input() isDisabled: boolean = false;
  @Output() transmogrifierProgramApplicationChange = new EventEmitter<TransmogrifierProgramApplication>();

  subcontractedStaffObj: any = { persons: [], removedPersons: [] };
  public formHelper = new FormHelper();

  constructor() { }
  ngOnInit() {
    this.subcontractedStaffObj.persons = this.transmogrifierProgramApplication.administrativeInformation.staffSubcontractedPersons;
    this.subcontractedStaffObj.removedPersons = [];
  }

  showValidFeedback(control: AbstractControl): boolean { return !(control.valid && (control.dirty || control.touched)) }
  showInvalidFeedback(control: AbstractControl): boolean { return !(control.invalid && (control.dirty || control.touched)) }

  onInput() {
    this.transmogrifierProgramApplicationChange.emit(this.transmogrifierProgramApplication);
  }

  onSubcontractedStaffChange(personsObj: any) {
    this.transmogrifierProgramApplication.administrativeInformation.staffSubcontractedPersons = personsObj.persons;
    this.onInput();

  }
}
