import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { iPerson } from '../../../core/models/person.interface';

@Component({
    selector: 'app-person-table',
    templateUrl: './person-table.component.html',
    styleUrls: ['./person-table.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PersonTableComponent implements OnInit {
  @Input() title: string;
  @Input() person: iPerson;

  constructor() { }

  ngOnInit() {
  }

}
