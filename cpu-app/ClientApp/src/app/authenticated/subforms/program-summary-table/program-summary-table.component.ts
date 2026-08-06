import moment from 'moment';
import { Component, OnInit, Input } from '@angular/core';
import { iProgramApplication } from '../../../core/models/program-application.interface';
import { iHours } from '../../../core/models/hours.interface';

@Component({
    selector: 'app-program-summary-table',
    templateUrl: './program-summary-table.component.html',
    styleUrls: ['./program-summary-table.component.css'],
    standalone: false
})
export class ProgramSummaryTableComponent implements OnInit {
  @Input() pa: iProgramApplication;
  operationsSum: number = 0;
  standbySum: number = 0;
  constructor() { }

  ngOnInit() {
    if (this.pa.operationHours && this.pa.operationHours.length) {
      this.operationsSum = this.pa.operationHours.map(h => this.calculateHourTotal(h)).reduce((prev, curr) => prev += curr);
    }
    if (this.pa.standbyHours && this.pa.standbyHours.length) {
      this.standbySum = this.pa.standbyHours.map(h => this.calculateHourTotal(h)).reduce((prev, curr) => prev += curr);
    }
  }
  calculateHourTotal(h: iHours): number {
    if (h.open && h.closed) {
      const open: moment.Moment = moment().hours(Number(h.open.split(':')[0])).minutes(Number(h.open.split(':')[1]));
      const closed: moment.Moment = moment().hours(Number(h.closed.split(':')[0])).minutes(Number(h.closed.split(':')[1]));

      if (closed.diff(open) < 0) {
        closed.add(1, 'days');
      }

      const daily: number = closed.diff(open, 'hours');
      let total = 0;
      if (h.monday) total = total + daily;
      if (h.tuesday) total = total + daily;
      if (h.wednesday) total = total + daily;
      if (h.friday) total = total + daily;
      if (h.saturday) total = total + daily;
      if (h.sunday) total = total + daily;
      return total;
    } else {
      return 0
    }
  }
}

