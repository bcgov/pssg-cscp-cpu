import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { iExpenseTableMeta } from '../expense-table/expense-table.component';
import { iSalaryAndBenefits } from '../../../core/models/salary-and-benefits.interface';
import { SalaryAndBenefits } from '../../../core/models/salary-and-benefits.class';
import { FormHelper } from '../../../core/form-helper';

@Component({
    selector: 'app-personnel-expense-table',
    templateUrl: './personnel-expense-table.component.html',
    styleUrls: ['./personnel-expense-table.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PersonnelExpenseTableComponent implements OnInit {
  @Input() salariesAndBenefits: iSalaryAndBenefits[] = [];
  @Input() vscpApprovedAmount: number = 0;
  @Input() isDisabled: boolean = false;
  @Output() salariesAndBenefitsChange = new EventEmitter<iSalaryAndBenefits[]>();
  @Output() meta = new EventEmitter<iExpenseTableMeta>();
  @Input() type: string = "";

  totalBenefitsCost: number = 0;
  totalSalaryCost: number = 0;
  totalTotalCost: number = 0;
  totalVscp: number = 0;
  totalGrand: number = 0;

  public formHelper = new FormHelper();
  constructor() { }

  ngOnInit() {
    this.calculateTotals();
  }

  addExpenseItem(): void {
    this.salariesAndBenefits.push(new SalaryAndBenefits());
    this.calculateTotals();
  }
  removeExpenseItem(index: number): void {
    let expenseToRemove = this.salariesAndBenefits[index];
    if (expenseToRemove.uuid) {
      expenseToRemove.isActive = false;
    }
    else {
      this.salariesAndBenefits.splice(index, 1);
    }

    this.calculateTotals();
  }
  calculateTotals() {
    function reducer(prev: number = 0, curr: number = 0): number {
      if (typeof curr === 'number') {
        return prev + curr;
      } else {
        return prev;
      }
    }

    let activeSB = this.salariesAndBenefits.filter(sb => sb.isActive);
    this.totalSalaryCost = 0;
    this.totalBenefitsCost = 0;
    if (activeSB.length > 0) {
      this.totalSalaryCost = activeSB.map(rs => (rs.salary || 0)).reduce(reducer) || 0;
      this.totalBenefitsCost = activeSB.map(rs => (rs.benefits || 0)).reduce(reducer) || 0;
      activeSB.forEach(s => {
        s.totalCost = (s.salary || 0) + (s.benefits || 0);
        s.totalCostMask = s.totalCost ? s.totalCost.toString() : "0";

        if (s.fundedFromVscp > (s.totalCost || 0)) {
          s.fundedFromVscp = (s.totalCost || 0);
          s.fundedFromVscpMask = s.fundedFromVscp.toString();
        }
      });
    }

    this.totalTotalCost = 0;
    if (activeSB.length > 0) {
      this.totalTotalCost = activeSB.map(rs => (rs.totalCost || 0)).reduce(reducer) || 0;
    }

    let totalVscpDefaults = 0;
    let totalVscpCustom = 0;
    if (activeSB.length > 0) {
      totalVscpCustom = activeSB.map(rs => (rs.fundedFromVscp || 0)).reduce(reducer) || 0;
    }
    this.totalVscp = totalVscpDefaults + totalVscpCustom;

    this.salariesAndBenefitsChange.emit(this.salariesAndBenefits);
    this.meta.emit({
      totalCost: this.totalTotalCost,
      totalVscp: this.totalVscp,
      vscpApprovedAmount: this.vscpApprovedAmount
    });
  }
}
