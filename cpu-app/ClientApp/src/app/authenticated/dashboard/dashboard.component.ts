import { Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { Transmogrifier } from '../../core/models/transmogrifier.class';
import { iContract } from '../../core/models/contract.interface';
import { Subscription } from 'rxjs';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { Roles } from '../../core/models/user-settings.interface';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  data: any;
  trans: Transmogrifier;
  categories = ['upcoming', 'current', 'past'];
  upcomingContracts: iContract[] = [];
  currentContracts: iContract[] = [];
  pastContracts: iContract[] = [];
  currentYear: number;

  private stateSubscription: Subscription;
  constructor(
    private stateService: StateService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
    this.stateSubscription = this.stateService.main.subscribe((m: Transmogrifier) => {
      this.trans = m;

      // console.log("dashboard subscribed data");
      // console.log(this.trans);
      if (m.contracts) {
        this.upcomingContracts = m.contracts.filter((c: iContract) => c.fiscalYearStart > this.currentYear);
        this.currentContracts = m.contracts.filter((c: iContract) => c.fiscalYearStart == this.currentYear);
        this.pastContracts = m.contracts.filter((c: iContract) => c.fiscalYearStart < this.currentYear);
      }
    });
  }
  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }
}
