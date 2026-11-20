import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'appendix-a.dialog',
    templateUrl: 'appendix-a.dialog.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppendixADialog {
  constructor(public dialogRef: MatDialogRef<AppendixADialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onOkayClick() {
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }
}
