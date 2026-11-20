import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IconStepperService, iStepperElement } from './icon-stepper.service';
@Component({
    selector: 'app-icon-stepper',
    templateUrl: './icon-stepper.component.html',
    styleUrls: ['./icon-stepper.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class IconStepperComponent implements OnInit {

  currentStepperElement: iStepperElement;
  // master list
  stepperElements: iStepperElement[] = [];
  // this object gives us keys to draw on to get classnames and messages
  levels: {} = {
    // message , colour class, icon class
    'untouched': ['', 'text-secondary', 'far fa-circle', ''],
    'incomplete': ['This form is unsaved but valid.', 'text-warning', 'fas fa-circle', 'tab-incomplete'],
    'invalid': ['This form is invalid.', 'text-danger', 'fas fa-times-circle', 'tab-invalid'],
    'complete': ['', 'text-success tab-complete', 'fas fa-check-circle', ''], //This form is saved and valid.
    'info': ['', 'text-info', 'fas fa-info-circle', ''],
    'saving': ['', 'text-secondary', 'spinner-border spinner-border-sm', ''],
    'valid': ['This form is valid.', 'text-success tab-complete', 'fas fa-check-circle', ''],
  }

  constructor(
    private stepperService: IconStepperService
  ) { }

  ngOnInit() {
    // subscribe to all of the changes
    this.stepperService.currentStepperElement.subscribe(e => {
      this.currentStepperElement = e;
      // whenever someone clicks to another link scroll to the top of the viewport.
      window.scrollTo(0, 0);
    });
    this.stepperService.stepperElements.subscribe(s => this.stepperElements = s);
  }

  onNavigate(id: string) {
    // set the internal state of this component
    this.stepperService.setCurrentStepperElement(id);
  }
}
