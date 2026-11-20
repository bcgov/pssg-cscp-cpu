import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { FormHelper } from '../../../core/form-helper';
import { iCAPProgram } from '../../../core/models/cap-program.interface';
import { iPerson } from '../../../core/models/person.interface';
import { Transmogrifier } from '../../../core/models/transmogrifier.class';
import { StateService } from '../../../core/services/state.service';
import { AddPersonDialog } from '../../dialogs/add-person/add-person.dialog';

@Component({
    selector: 'app-cap-program',
    templateUrl: './cap-program.component.html',
    styleUrls: ['./cap-program.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CAPProgramComponent implements OnInit, OnDestroy {
    @Input() program: iCAPProgram;
    @Input() isCompleted: boolean;
    persons: iPerson[] = [];
    trans: Transmogrifier;
    public formHelper = new FormHelper();
    personsObj: any = { persons: [], removedPersons: [] };
    private stateSubscription: Subscription;

    MODEL_LIST = [{
        label: "Family Group Conferencing",
        isChecked: false,
        val: 100000000
    },
    {
        label: "Victim-Offender Mediation",
        isChecked: false,
        val: 100000003
    },
    {
        label: "Circle Process",
        isChecked: false,
        val: 100000001
    },
    {
        label: "Community Accountability Panels",
        isChecked: false,
        val: 100000004
    },
    {
        label: "Community Justice Forums (RCMP Model)",
        isChecked: false,
        val: 100000002
    },
    {
        label: "Victim Offender Conferencing",
        isChecked: false,
        val: 100000005
    },
    {
        label: "Other model",
        isChecked: false,
        val: 100000006
    },

    ];

    OTHER_MODEL = {
        label: "Please specify",
        val: ""
    }

    constructor(private stateService: StateService,
        public dialog: MatDialog,) { }

    ngOnDestroy() {
        this.stateSubscription.unsubscribe();
    }

    ngOnInit() {
        this.stateSubscription = this.stateService.main.subscribe((m: Transmogrifier) => {
            this.trans = m;
            this.persons = m.persons;
        });
        this.personsObj.persons = this.program.additionalStaff;
        this.personsObj.removedPersons = this.program.removedStaff;

        if (this.program.typesOfModels) {
            let self = this;
            this.program.typesOfModels.split(",").forEach(val => {
                let thisVal = parseInt(val);
                for (let i = 0; i < self.MODEL_LIST.length; ++i) {
                    if (self.MODEL_LIST[i].val === thisVal) {
                        self.MODEL_LIST[i].isChecked = true;
                    }
                }
            });

            this.selectedModelChange();
        }
    }
    onProgramStaffChange(personsObj: any) {
        this.program.additionalStaff = personsObj.persons;
        this.program.removedStaff = personsObj.removedPersons;

    }
    showAddProgramStaffDialog() {
        let dialogRef = this.dialog.open(AddPersonDialog, {
            autoFocus: false,
            width: '80vw',
            data: { agencyAddress: this.trans.contactInformation.mainAddress }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.stateService.refresh();
            }
        });
    }

    selectedModelChange() {
        let selectedOptions = this.MODEL_LIST.filter(a => a.isChecked);
        this.program.typesOfModels = selectedOptions.map(a => a.val).toString();
        if (!this.MODEL_LIST[6].isChecked) {
            this.program.otherModel = "";
        }
    }
}