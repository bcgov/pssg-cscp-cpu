import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { StateService } from '../../../core/services/state.service';
import { nameAssemble } from '../../../core/constants/name-assemble';
import { Transmogrifier } from '../../../core/models/transmogrifier.class';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-ministry-contact-box',
    templateUrl: './ministry-contact-box.component.html',
    styleUrls: ['./ministry-contact-box.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MinistryContactBoxComponent implements OnInit, OnDestroy {
  trans: Transmogrifier;
  nameAssemble = nameAssemble;
  private stateSubscription: Subscription;
  constructor(
    private stateService: StateService,
  ) { }

  ngOnInit() {
    this.stateSubscription = this.stateService.main.subscribe((m: Transmogrifier) => this.trans = m);
  }
  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }
}
