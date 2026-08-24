import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Subscription } from "rxjs";
import { BudgetProposalDto, BudgetProposalPost } from "../../core/api/models";
import { BudgetProposalService } from "../../core/api/services/budget-proposal/budget-proposal.service";
import { nameAssemble } from "../../core/constants/name-assemble";
import { revenueSourceTypes } from "../../core/constants/revenue-source-type";
import { FormHelper } from "../../core/form-helper";
import { convertBudgetProposalToDynamics } from "../../core/models/converters/budget-proposal-to-dynamics";
import { iProgramBudget } from "../../core/models/program-budget.interface";
import { RevenueSource } from "../../core/models/revenue-source.class";
import { VSCP_APPROVED_SOURCE_NAME } from "../../core/models/revenue-source.interface";
import { TransmogrifierBudgetProposal } from "../../core/models/transmogrifier-budget-proposal.class";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";

@Component({
  selector: "app-budget-proposal",
  templateUrl: "./budget-proposal.component.html",
  styleUrls: ["./budget-proposal.component.css"],
  standalone: false,
})
export class BudgetProposalComponent implements OnInit, OnDestroy {
  currentStepperElement: iStepperElement;
  stepperElements: iStepperElement[];
  stepperIndex: number = 0;

  mainTrans: Transmogrifier;
  contractNumber: string;
  trans: TransmogrifierBudgetProposal;
  data: BudgetProposalDto;
  out: BudgetProposalPost;
  saving: boolean = false;
  isCompleted: boolean = false;

  private stateSubscription: Subscription;

  programBudgetTabs = ["Program Revenue Information", "Program Expense"];
  current_program_budget: iProgramBudget = null;

  personDict: object = {};
  private formHelper = new FormHelper();
  constructor(
    private budgetProposalService: BudgetProposalService,
    private notificationQueueService: NotificationQueueService,
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private stepperService: IconStepperService,
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
    this.personDict = this.stateService.main
      .getValue()
      .persons.map((p) => {
        const tmp = {};
        tmp[p.personId] = nameAssemble(p.firstName, p.middleName, p.lastName);
        return tmp;
      })
      .reduce((prev, curr) => {
        return { ...prev, ...curr };
      });
    this.route.params.subscribe((p) => {
      const userId: string = this.stateService.main.getValue().userId;
      const organizationId: string =
        this.stateService.main.getValue().organizationId;

      this.budgetProposalService
        .getApiBudgetProposalBusinessBceidUserBceidContractId(
          organizationId,
          userId,
          p["taskId"],
        )
        .subscribe((d) => {
          if (!d.isSuccess) {
            this.data = d;
            this.notificationQueueService.addNotification(
              "An attempt at getting this budget proposal form was unsuccessful. If the problem persists please notify your ministry contact.",
              "danger",
            );

            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            this.data = d;
            this.trans = new TransmogrifierBudgetProposal(d);
            this.trans.programBudgets = this.trans.programBudgets.map(
              (pb: iProgramBudget): iProgramBudget => {
                this.contractNumber = this.mainTrans.contracts.find(
                  (c) => c.contractId === d.contract.vsd_ContractId,
                ).contractNumber;
                return pb;
              },
            );

            this.constructDefaultstepperElements();
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
          (originalStepper.formState === "complete" &&
            formState === "untouched") ||
          originalStepper.formState === "invalid"
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

      if (
        this.trans &&
        this.trans.programBudgets &&
        this.trans.programBudgets.length > 0 &&
        this.currentStepperElement &&
        this.currentStepperElement.discriminator
      ) {
        this.current_program_budget = this.trans.programBudgets.find(
          (pb) => pb.programId === this.currentStepperElement.discriminator,
        );
      }
    });
  }

  isCurrentStepperElement(item: iStepperElement): boolean {
    if (item.id === this.currentStepperElement.id) {
      return true;
    }
    return false;
  }
  constructDefaultstepperElements() {
    this.stepperService.reset();
    this.stepperService.addStepperElement(
      null,
      "Overview",
      "info",
      "program_overview",
    );
    this.trans.programBudgets.forEach((pb) =>
      this.stepperService.addStepperElement(
        null,
        pb.name,
        "untouched",
        pb.programId,
      ),
    );

    if (!this.isCompleted) {
      this.stepperService.addStepperElement(
        null,
        "Authorization",
        "untouched",
        "authorization",
      );
    }
    this.stepperService.setToFirstStepperElement();
  }
  save(shouldExit: boolean = false, isSubmit: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      try {
        let originalStepper = _.cloneDeep(this.currentStepperElement);
        let currentTabHasInvalidClass =
          originalStepper.formState === "invalid" ? 1 : 0;
        if (
          !this.formHelper.isFormValid(
            this.notificationQueueService,
            currentTabHasInvalidClass,
          )
        ) {
          resolve();
          return;
        }

        if (!this.validateProgramBudgets(this.trans.programBudgets)) {
          resolve();
          return;
        }

        this.saving = true;
        this.out = convertBudgetProposalToDynamics(this.trans, isSubmit);
        this.budgetProposalService
          .postApiBudgetProposal(this.out)
          .subscribe(
            (r: any) => {
              if (r.IsSuccess) {
                this.notificationQueueService.addNotification(
                  `You have successfully saved the budget proposal.`,
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
                this.reloadBudgetProposal();
                this.formHelper.makeFormClean();
                resolve();
              } else {
                // console.log(r);
                this.notificationQueueService.addNotification(
                  "The budget proposal could not be saved. If this problem is persisting please contact your ministry representative.",
                  "danger",
                );
                this.saving = false;
                reject();
              }
            },
            (err) => {
              console.log(err);
              this.notificationQueueService.addNotification(
                "The budget proposal could not be saved. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
              reject();
            },
          );
      } catch (err) {
        console.log(err);
        this.notificationQueueService.addNotification(
          "The budget proposal could not be saved. If this problem is persisting please contact your ministry representative.",
          "danger",
        );
        this.saving = false;
      }
    });
  }
  exit() {
    this.stateService.refresh();
    this.router.navigate(["/authenticated/dashboard"]);
  }
  reloadBudgetProposal() {
    this.route.params.subscribe((p) => {
      const userId: string = this.stateService.main.getValue().userId;
      const organizationId: string =
        this.stateService.main.getValue().organizationId;

      this.budgetProposalService
        .getApiBudgetProposalBusinessBceidUserBceidContractId(
          organizationId,
          userId,
          p["taskId"],
        )
        .subscribe((d) => {
          if (!d.isSuccess) {
            this.data = d;
            this.notificationQueueService.addNotification(
              "An attempt at getting this budget proposal form was unsuccessful. If the problem persists please notify your ministry contact.",
              "danger",
            );
            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            this.data = d;
            let tempTrans = new TransmogrifierBudgetProposal(d);

            for (let i = 0; i < this.trans.programBudgets.length; ++i) {
              tempTrans.programBudgets[i].currentTab =
                this.trans.programBudgets[i].currentTab;
              Object.assign(
                this.trans.programBudgets[i],
                tempTrans.programBudgets[i],
              );
              if (!this.trans.programBudgets[i].revenueSources.length) {
                let rev = new RevenueSource();
                rev.revenueSourceName = revenueSourceTypes[4];
                this.trans.programBudgets[i].revenueSources.push(rev);
              }
            }
          }
        });
    });
  }
  validateProgramBudgets(programBudgets: iProgramBudget[]) {
    let isValid = true;

    programBudgets.forEach((pb: iProgramBudget) => {
      let vscpApprovedAmount = 0;
      pb.revenueSources
        .filter((rs) => rs.isActive)
        .forEach((rs) => {
          if (rs.revenueSourceName === VSCP_APPROVED_SOURCE_NAME) {
            vscpApprovedAmount += (rs.cash || 0) + (rs.inKindContribution || 0);
          }
        });

      let totalFundedFromVSCP = 0;
      pb.salariesAndBenefits
        .filter((sb) => sb.isActive)
        .forEach((sb) => {
          totalFundedFromVSCP += sb.fundedFromVscp || 0;
        });
      pb.programDeliveryCosts
        .filter((pd) => pd.isActive)
        .forEach((pd) => {
          totalFundedFromVSCP += pd.fundedFromVscp || 0;
        });
      pb.programDeliveryOtherExpenses
        .filter((pd) => pd.isActive)
        .forEach((pd) => {
          totalFundedFromVSCP += pd.fundedFromVscp || 0;
        });
      pb.administrationCosts
        .filter((ac) => ac.isActive)
        .forEach((ac) => {
          totalFundedFromVSCP += ac.fundedFromVscp || 0;
        });
      pb.administrationOtherExpenses
        .filter((ac) => ac.isActive)
        .forEach((ac) => {
          totalFundedFromVSCP += ac.fundedFromVscp || 0;
        });

      if (vscpApprovedAmount.toFixed(2) !== totalFundedFromVSCP.toFixed(2)) {
        let stepperWithError = this.stepperElements.find(
          (s) => s.discriminator === pb.programId,
        );
        if (stepperWithError) {
          this.stepperService.setStepperElementProperty(
            stepperWithError.id,
            "formState",
            "invalid",
          );
        }
        isValid = false;
      }
    });

    if (!isValid) {
      this.notificationQueueService.addNotification(
        `The total VSCP funding must match the total component value outlined in Schedule B-Terms and Conditions of Payment.`,
        "warning",
      );
    }

    return isValid;
  }
  setNextStepper() {
    let ignoreTabErrors = true;
    let originalStepper = _.cloneDeep(this.currentStepperElement);

    let currentTabHasInvalidClass =
      originalStepper.formState === "invalid" ? 1 : 0;
    if (
      !this.formHelper.isFormValid(
        this.notificationQueueService,
        currentTabHasInvalidClass,
        ignoreTabErrors,
      )
    ) {
      return;
    }

    this.current_program_budget = this.trans.programBudgets.find(
      (pb) => pb.programId === originalStepper.discriminator,
    );
    if (this.current_program_budget) {
      let index = this.programBudgetTabs.findIndex(
        (t) => t === this.current_program_budget.currentTab,
      );
      if (index < this.programBudgetTabs.length - 1) {
        this.current_program_budget.currentTab =
          this.programBudgetTabs[index + 1];
        window.scrollTo(0, 0);
        return;
      }
    }

    if (
      this.current_program_budget &&
      !this.validateProgramBudgets([this.current_program_budget])
    ) {
      return;
    }

    if (
      originalStepper.discriminator === "program_overview" &&
      !this.isCompleted
    ) {
      setTimeout(() => {
        this.stepperService.setStepperElementProperty(
          originalStepper.id,
          "formState",
          "complete",
        );
      }, 0);
    } else if (!this.trans.signature.signatureDate && !this.isCompleted) {
      setTimeout(() => {
        this.stepperService.setStepperElementProperty(
          originalStepper.id,
          "formState",
          "saving",
        );
      }, 0);

      this.saveSingleProgramBudget(this.current_program_budget)
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

    let nextStepper = this.stepperElements[this.stepperIndex];
    let next_program_budget = this.trans.programBudgets.find(
      (pb) => pb.programId === nextStepper.discriminator,
    );
    if (next_program_budget) {
      next_program_budget.currentTab = this.programBudgetTabs[0];
    }

    this.stepperService.setCurrentStepperElement(
      this.stepperElements[this.stepperIndex].id,
    );
  }
  setPreviousStepper() {
    let current_program_budget = this.trans.programBudgets.find(
      (pb) => pb.programId === this.currentStepperElement.discriminator,
    );
    if (current_program_budget) {
      let index = this.programBudgetTabs.findIndex(
        (t) => t === current_program_budget.currentTab,
      );
      if (index > 0) {
        current_program_budget.currentTab = this.programBudgetTabs[index - 1];
        window.scrollTo(0, 0);
        return;
      }
    }

    --this.stepperIndex;

    let nextStepper = this.stepperElements[this.stepperIndex];
    let next_program_budget = this.trans.programBudgets.find(
      (pb) => pb.programId === nextStepper.discriminator,
    );
    if (next_program_budget) {
      next_program_budget.currentTab =
        this.programBudgetTabs[this.programBudgetTabs.length - 1];
    }

    this.stepperService.setCurrentStepperElement(
      this.stepperElements[this.stepperIndex].id,
    );
  }

  saveSingleProgramBudget(programBudget: iProgramBudget) {
    return new Promise<void>((resolve, reject) => {
      try {
        this.saving = true;
        let singleTrans = _.cloneDeep(this.trans);
        singleTrans.programBudgets = singleTrans.programBudgets.filter(
          (pb) => pb.programId === programBudget.programId,
        );
        this.out = convertBudgetProposalToDynamics(singleTrans);

        this.budgetProposalService
          .postApiBudgetProposal(this.out)
          .subscribe(
            (r: any) => {
              if (r.IsSuccess) {
                this.stateService.refresh();
                this.saving = false;
                this.reloadBudgetProposal();
                resolve();
              } else {
                this.notificationQueueService.addNotification(
                  "The budget proposal could not be saved. If this problem is persisting please contact your ministry representative.",
                  "danger",
                );
                this.saving = false;
                reject();
              }
            },
            (err) => {
              console.log(err);
              this.notificationQueueService.addNotification(
                "The budget proposal could not be saved. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
              reject();
            },
          );
      } catch (err) {
        console.log(err);
        this.notificationQueueService.addNotification(
          "The budget proposal could not be saved. If this problem is persisting please contact your ministry representative.",
          "danger",
        );
        this.saving = false;
      }
    });
  }
}
