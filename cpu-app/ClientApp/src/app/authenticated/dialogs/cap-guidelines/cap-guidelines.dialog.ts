import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'cap-guidelines.dialog',
    templateUrl: 'cap-guidelines.dialog.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CAPGuidelinesDialog {
    constructor(public dialogRef: MatDialogRef<CAPGuidelinesDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    onOkayClick() {
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }
}
