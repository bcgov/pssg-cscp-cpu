import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { ExpenseReportPost } from "../../core/api/models/expenseReportPost";
import { ExpenseReportService } from "../../core/api/services/expense-report/expense-report.service";
import { perTypeDict } from "../../core/constants/per-type";
import { FormHelper } from "../../core/form-helper";
import { convertExpenseReportToDynamics } from "../../core/models/converters/expense-report-to-dynamics";
import { iPerson } from "../../core/models/person.interface";
import { TransmogrifierExpenseReport } from "../../core/models/transmogrifier-expense-report.class";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import * as _ from "lodash";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";

@Component({
  selector: "app-expense-report",
  templateUrl: "./expense-report.component.html",
  styleUrls: ["./expense-report.component.css"],
  standalone: false,
})
export class ExpenseReportComponent implements OnInit, OnDestroy {
  stepperElements: iStepperElement[];
  currentStepperElement: iStepperElement;
  stepperIndex: number = 0;
  discriminators: string[] = [
    "salary_benefits",
    "program_expense",
    "authorization",
  ];
  saving: boolean = false;

  lineItemSums = {
    annualBudgetSum: null,
    quarterlyBudgetSum: null,
    actualSum: null,
    quarterlyVarianceSum: null,
    paidYearToDateSum: null,
    actualYearToDateSum: null,
    annualVarianceSum: null,
    annualRemainingSum: null,
  };

  mainTrans: Transmogrifier;
  contractNumber: string;

  trans: TransmogrifierExpenseReport;
  data: any;
  out: ExpenseReportPost;
  currentUser: iPerson;
  perType: string;
  isCompleted: boolean = false;

  public formHelper = new FormHelper();
  private stateSubscription: Subscription;

  constructor(
    private ref: ChangeDetectorRef,
    private expenseReportService: ExpenseReportService,
    private stepperService: IconStepperService,
    private stateService: StateService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationQueueService: NotificationQueueService,
  ) {}

  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }
  ngOnInit() {
    this.route.queryParams.subscribe((q) => {
      if (q && q.completed) {
        this.isCompleted = q.completed == "true";
      }
    });

    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.mainTrans = m;
      },
    );
    this.stateService.currentUser.subscribe((u) => (this.currentUser = u));
    this.route.params.subscribe((p) => {
      const organizationId: string =
        this.stateService.main.getValue().organizationId;
      const userId: string = this.stateService.main.getValue().userId;

      this.expenseReportService
        .getApiExpenseReportBusinessBceidUserBceidExpenseReportId(
          organizationId,
          userId,
          p["taskId"],
        )
        .subscribe((g) => {
          if (!g.isSuccess) {
            this.notificationQueueService.addNotification(
              "An attempt at getting this expense report was unsuccessful. If this problem persists please notify your ministry contact.",
              "danger",
            );
            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            this.data = g;
            this.trans = new TransmogrifierExpenseReport(g);

            this.perType = perTypeDict[this.trans.expenseReport.perType];

            this.contractNumber = this.mainTrans.contracts.find(
              (c) => c.contractId === g.contract?.vsd_ContractId,
            )?.contractNumber;
            this.constructDefaultstepperElements();
            this.calculateLineItemSums();
          }
        });
    });

    this.stepperService.stepperElements.subscribe(
      (e) => (this.stepperElements = e),
    );
    this.stepperService.currentStepperElement.subscribe((e) => {
      if (this.currentStepperElement) {
        let originalStepper = _.cloneDeep(this.currentStepperElement);
        let formState = this.formHelper.getFormState();

        if (
          originalStepper.formState === "complete" &&
          formState === "untouched"
        ) {
        } else if (
          originalStepper.formState !== "incomplete" ||
          formState !== "untouched"
        ) {
          this.currentStepperElement.formState = formState;
        }
      }
      this.currentStepperElement = e;

      if (this.currentStepperElement && this.stepperElements) {
        this.stepperIndex = this.stepperElements.findIndex(
          (e) => e.id === this.currentStepperElement.id,
        );
      }
    });
  }

  constructDefaultstepperElements() {
    this.stepperService.reset();
    [
      {
        itemName:
          "Salary, benefits, program delivery and administration expense",
        formState: "untouched",
        object: null,
        discriminator: "salary_benefits",
      },
      {
        itemName: "Program expense",
        formState: "untouched",
        object: null,
        discriminator: "program_expense",
      },
      {
        itemName: "Authorization",
        formState: "untouched",
        object: null,
        discriminator: "authorization",
      },
    ].forEach((f: iStepperElement) => {
      this.stepperService.addStepperElement(
        f.object,
        f.itemName,
        f.formState,
        f.discriminator,
      );
    });

    if (this.isCompleted) {
      this.stepperElements.pop();
    }

    this.stepperService.setToFirstStepperElement();
  }

  calculateLineItemSums() {
    let self = this;
    this.lineItemSums["annualBudgetSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.annualBudget)
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["quarterlyBudgetSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.quarterlyBudget)
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["actualSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.actual)
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["quarterlyVarianceSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.quarterlyBudget - l.actual)
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["paidYearToDateSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map(
          (l) =>
            (l.annualBudget / 4) *
            self.trans.expenseReport.reportingPeriod.multiplier,
        )
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["actualYearToDateSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.actualYearToDate + l.actual)
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["annualVarianceSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map(
          (l) =>
            (l.annualBudget / 4) *
              self.trans.expenseReport.reportingPeriod.multiplier -
            (l.actualYearToDate + l.actual),
        )
        .reduce((prev, curr) => prev + curr, 0);
    this.lineItemSums["annualRemainingSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.annualBudget - (l.actualYearToDate + l.actual))
        .reduce((prev, curr) => prev + curr, 0);
  }
  updateLineItemSums() {
    let self = this;
    this.lineItemSums["actualSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.actual)
        .reduce((prev, curr) => prev + curr);
    this.lineItemSums["quarterlyVarianceSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.quarterlyBudget - l.actual)
        .reduce((prev, curr) => prev + curr);
    this.lineItemSums["actualYearToDateSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.actualYearToDate + l.actual)
        .reduce((prev, curr) => prev + curr);
    this.lineItemSums["annualVarianceSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map(
          (l) =>
            (l.annualBudget / 4) *
              self.trans.expenseReport.reportingPeriod.multiplier -
            (l.actualYearToDate + l.actual),
        )
        .reduce((prev, curr) => prev + curr);
    this.lineItemSums["annualRemainingSum"] =
      this.trans.expenseReport.programExpenseLineItems
        .map((l) => l.annualBudget - (l.actualYearToDate + l.actual))
        .reduce((prev, curr) => prev + curr);
  }
  save(shouldExit: boolean = false, isSubmit: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!this.formHelper.isFormValid(this.notificationQueueService)) {
          resolve();
          return;
        }
        this.saving = true;
        this.out = convertExpenseReportToDynamics(this.trans, isSubmit);
        this.expenseReportService
          .postApiExpenseReport<{
            isSuccess: boolean;
            result: string;
          }>(this.out)
          .subscribe(
            (r) => {
              if (r.isSuccess) {
                this.notificationQueueService.addNotification(
                  `You have successfully saved the expense report.`,
                  "success",
                );
                this.stateService.refresh();
                if (shouldExit)
                  this.router.navigate(["/authenticated/dashboard"]);
                this.saving = false;
                this.stepperElements.forEach((s) => {
                  if (s.formState === "complete") return;
                  this.stepperService.setStepperElementProperty(
                    s.id,
                    "formState",
                    "untouched",
                  );
                });
                this.formHelper.makeFormClean();
                resolve();
              } else {
                this.notificationQueueService.addNotification(
                  "The expense report could not be saved. If this problem is persisting please contact your ministry representative.",
                  "danger",
                );
                this.saving = false;
                reject();
              }
            },
            (err) => {
              console.log(err);
              this.notificationQueueService.addNotification(
                "The expense report could not be saved. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
              reject();
            },
          );
      } catch (err) {
        console.log(err);
        this.notificationQueueService.addNotification(
          "The expense report could not be saved. If this problem is persisting please contact your ministry representative.",
          "danger",
        );
        this.saving = false;
        reject();
      }
    });
  }
  exit() {
    if (this.formHelper.isFormDirty()) {
      if (
        confirm(
          "Are you sure you want to return to the dashboard? All unsaved work will be lost.",
        )
      ) {
        this.stateService.refresh();
        this.router.navigate(["/authenticated/dashboard"]);
      }
    } else {
      this.stateService.refresh();
      this.router.navigate(["/authenticated/dashboard"]);
    }
  }

  setNextStepper() {
    let originalStepper = _.cloneDeep(this.currentStepperElement);

    if (!this.trans.expenseReport.executiveReview && !this.isCompleted) {
      setTimeout(() => {
        this.stepperService.setStepperElementProperty(
          originalStepper.id,
          "formState",
          "saving",
        );
      }, 0);

      this.save(false)
        .then(() => {
          this.stepperService.setStepperElementProperty(
            originalStepper.id,
            "formState",
            "complete",
          );
        })
        .catch(() => {
          this.stepperService.setStepperElementProperty(
            originalStepper.id,
            "formState",
            "invalid",
          );
        });
    }

    ++this.stepperIndex;

    this.stepperService.setCurrentStepperElement(
      this.stepperElements[this.stepperIndex].id,
    );
  }

  setPreviousStepper() {
    --this.stepperIndex;

    this.stepperService.setCurrentStepperElement(
      this.stepperElements[this.stepperIndex].id,
    );
  }
}
