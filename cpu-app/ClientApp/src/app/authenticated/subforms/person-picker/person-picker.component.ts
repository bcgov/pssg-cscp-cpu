import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { StateService } from '../../../core/services/state.service';
import { Transmogrifier } from '../../../core/models/transmogrifier.class';
import { iPerson } from '../../../core/models/person.interface';
import { nameAssemble } from '../../../core/constants/name-assemble';
import { Person } from '../../../core/models/person.class';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-person-picker',
    templateUrl: './person-picker.component.html',
    styleUrls: ['./person-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PersonPickerComponent implements OnInit, OnDestroy {
  @Input() title = 'Select Person';
  @Input() isDisabled: boolean = false;
  @Input() person: iPerson;
  @Input() idNum: number = 0;
  @Output() personChange = new EventEmitter<iPerson>();
  @Input() showCard = true;
  personId: string = null;
  public nameAssemble = nameAssemble;
  trans: Transmogrifier;
  private stateSubscription: Subscription;

  constructor(
    private stateService: StateService,
  ) { }

  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }
  ngOnInit() {
    if (this.person && this.person.personId)
      this.personId = this.person.personId;
    this.stateSubscription = this.stateService.main.subscribe((m: Transmogrifier) => {
      this.trans = m;

      if (!this.person) {
        this.person = new Person();
        this.personId = this.person.personId;
      }
      this.setPerson(this.personId);
    });
  }
  setPerson(personId: string): void {
    this.person = this.trans.persons.find(p => p.personId === personId);
    this.personId = personId;
  }
  onChange() {
    this.setPerson(this.personId);
    this.personChange.emit(this.person);
  }
}
