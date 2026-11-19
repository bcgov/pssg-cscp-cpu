import { Component, OnInit, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppendixADialog } from '../../dialogs/appendix-a/appendix-a.dialog';

@Component({
    selector: 'app-cg-liability',
    templateUrl: './cg-liability.component.html',
    styleUrls: ['./cg-liability.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CgLiabilityComponent implements OnInit {
  @Input() cgLiability: string;
  @Input() isDisabled: boolean = false;
  @Output() cgLiabilityChange = new EventEmitter<string>();
  constructor(
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
  }

  onChanges() {
    this.cgLiabilityChange.emit(this.cgLiability);
  }

  showAppendixADialog() {
    this.dialog.open(AppendixADialog, {
      autoFocus: false,
      data: {}
    });
  }
}
