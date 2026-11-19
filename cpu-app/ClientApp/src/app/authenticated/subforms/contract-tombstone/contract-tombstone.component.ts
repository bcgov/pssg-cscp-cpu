import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-contract-tombstone',
    templateUrl: './contract-tombstone.component.html',
    styleUrls: ['./contract-tombstone.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ContractTombstoneComponent implements OnInit {
  @Input() contractNumber: string;
  @Input() organizationName: string;

  constructor() { }

  ngOnInit() {
  }

}
