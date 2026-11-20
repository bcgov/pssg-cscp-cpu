import { Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { StateService } from '../../../core/services/state.service';
import { Transmogrifier } from '../../../core/models/transmogrifier.class';
import { nameAssemble } from '../../../core/constants/name-assemble';
import { iProgramApplication } from '../../../core/models/program-application.interface';
import { Subscription } from 'rxjs';
import { Roles } from '../../../core/models/user-settings.interface';

@Component({
    selector: 'app-organization-profile-box',
    templateUrl: './organization-profile-box.component.html',
    styleUrls: ['./organization-profile-box.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OrganizationProfileBoxComponent implements OnInit, OnDestroy {
  @Input() type: string;
  @Input() programInfo: iProgramApplication;
  public nameAssemble = nameAssemble;
  trans: Transmogrifier;
  contractNumber: string;

  userRole = Roles.ProgramStaff
  Roles = Roles;

  private stateSubscription: Subscription;
  constructor(
    private stateService: StateService
  ) { }
  ngOnInit() {
    let userSettings = this.stateService.userSettings.getValue();
    this.userRole = userSettings.userRole;
    this.stateSubscription = this.stateService.main.subscribe((m: Transmogrifier) => {
      this.trans = m;
      if (this.type === "program-contact") {
        this.contractNumber = m.contracts.find(c => c.contractId === this.programInfo.contractId).contractNumber;
      }
    });
  }
  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }
}
