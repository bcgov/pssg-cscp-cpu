import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'program-egilibility.dialog',
    templateUrl: 'program-egilibility.dialog.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProgramEgilibilityDialog {
    constructor(public dialogRef: MatDialogRef<ProgramEgilibilityDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    onOkayClick() {
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }
}
