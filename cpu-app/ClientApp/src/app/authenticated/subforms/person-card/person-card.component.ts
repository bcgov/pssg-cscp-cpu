import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { iPerson } from '../../../core/models/person.interface';
import { nameAssemble } from '../../../core/constants/name-assemble';

@Component({
    selector: 'app-person-card',
    templateUrl: './person-card.component.html',
    styleUrls: ['./person-card.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PersonCardComponent implements OnInit {
  @Input() person: iPerson;
  nameAssemble = nameAssemble;
  constructor() { }

  ngOnInit() {
  }

}
