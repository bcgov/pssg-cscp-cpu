import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { CapapplicationService } from "../../core/api/services/capapplication/capapplication.service";
import { FormHelper } from "../../core/form-helper";
import { CAPProgram } from "../../core/models/cap-program.class";
import { iCAPProgram } from "../../core/models/cap-program.interface";
import { iContract } from "../../core/models/contract.interface";
import { convertCAPProgramToDynamics } from "../../core/models/converters/cap-program-to-dynamics";
import { TransmogrifierCAPApplication } from "../../core/models/transmogrifier-cap-application.class";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";
import { AddPersonDialog } from "../dialogs/add-person/add-person.dialog";
import { CAPGuidelinesDialog } from "../dialogs/cap-guidelines/cap-guidelines.dialog";
import { ProgramEgilibilityDialog } from "../dialogs/program-egilibility/program-egilibility.dialog";

@Component({
  selector: "app-cap-application",
  templateUrl: "./cap-application.component.html",
  styleUrls: ["./cap-application.component.scss"],
  standalone: false,
})
export class CAPApplicationComponent implements OnInit {
  trans: TransmogrifierCAPApplication;

  stepperElements: iStepperElement[];
  currentStepperElement: iStepperElement;
  stepperIndex: number = 0;

  saving: boolean = false;
  isCompleted: boolean = false;
  discriminators: string[] = [
    "funding_criteria",
    "applicant_information",
    "program",
    "authorization",
  ];
  baseFiscalYear: number;

  private stateSubscription: Subscription;

  private formHelper = new FormHelper();
  contracategory: string = "";
  contracts: iContract[] = [];

  constructor(
    private notificationQueueService: NotificationQueueService,
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private stepperService: IconStepperService,
    private capService: CapapplicationService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.contracts = m.contracts;
        if (this.trans) {
          this.getFiscalYear();
        }
      },
    );

    this.route.queryParams.subscribe((q) => {
      if (q && q.completed) {
        this.isCompleted = q.completed == "true";
      }
    });
    this.route.params.subscribe((p) => {
      const userId: string = this.stateService.main.getValue().userId;
      const organizationId: string =
        this.stateService.main.getValue().organizationId;
      this.capService
        .getApiCAPApplicationBusinessBceidUserBceidScheduleFId(
          organizationId,
          userId,
          p["taskId"],
        )
        .subscribe((f) => {
          if (!f.isSuccess) {
            this.notificationQueueService.addNotification(
              "An attempt at getting this cap application form was unsuccessful. If the problem persists please notify your ministry contact.",
              "danger",
            );
            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            // console.log("cap application dynamics info");
            // console.log(f);

            this.trans = new TransmogrifierCAPApplication(f);
            // console.log("cap application transmogrifier");
            // console.log(this.trans);

            this.constructDefaultstepperElements(this.trans);

            if (this.contracts) {
              this.getFiscalYear();
            }
          }
        });
    });
    this.stepperService.stepperElements.subscribe(
      (e) => (this.stepperElements = e),
    );
    this.stepperService.currentStepperElement.subscribe((e) => {
      if (this.currentStepperElement) {
        let originalStepper = structuredClone(this.currentStepperElement);
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

  getFiscalYear() {
    let self = this;
    self.baseFiscalYear = new Date().getFullYear();

    let thisContract = self.contracts.find(
      (c) => c.contractId === self.trans.contractId,
    );
    if (thisContract) {
      self.baseFiscalYear = thisContract.fiscalYearStart;
    }

    self.trans.fiscalYear = `${self.baseFiscalYear} to ${self.baseFiscalYear + 1}`;
  }

  isCurrentStepperElement(item: iStepperElement): boolean {
    if (item.id === this.currentStepperElement.id) {
      return true;
    }
    return false;
  }
  constructDefaultstepperElements(m: TransmogrifierCAPApplication) {
    this.stepperService.reset();
    [
      {
        itemName: "Funding Application",
        formState: "untouched",
        object: null,
        discriminator: "funding_criteria",
      },
      {
        itemName: "Applicant Information",
        formState: "untouched",
        object: null,
        discriminator: "applicant_information",
      },
    ].forEach((f: iStepperElement) => {
      this.stepperService.addStepperElement(
        f.object,
        f.itemName,
        f.formState,
        f.discriminator,
      );
    });

    if (!this.trans.capPrograms.length) {
      this.stepperService.addStepperElement(
        null,
        "CAP Application Does Not Include Programs",
        "invalid",
      );
      this.notificationQueueService.addNotification(
        "A cap application should always have a program attached. This is a problem with the data held by the ministry. Please contact your ministry representative and let them know that this has occured and that you cannot complete your program application.",
        "danger",
        99999999,
      );
    }

    this.trans.capPrograms.forEach((p: iCAPProgram) => {
      this.stepperService.addStepperElement(
        { type: CAPProgram, data: p },
        p.name,
        "untouched",
        "program",
      );
    });

    let finalStepperElements = [
      {
        itemName: "Authorization",
        formState: "untouched",
        object: null,
        discriminator: "authorization",
      },
    ];

    if (this.isCompleted) {
      finalStepperElements.pop();
    }

    finalStepperElements.forEach((f: iStepperElement) => {
      this.stepperService.addStepperElement(
        f.object,
        f.itemName,
        f.formState,
        f.discriminator,
      );
    });
    this.stepperService.setToFirstStepperElement();
  }
  save(showNotification: boolean = true, shouldExit: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      try {
        this.saving = true;
        // console.log("saving...");
        // console.log(structuredClone(this.trans));
        this.capService
          .postApiCAPApplication(convertCAPProgramToDynamics(this.trans))
          .subscribe(
            (r) => {
              if (r.isSuccess) {
                if (showNotification) {
                  this.notificationQueueService.addNotification(
                    `You have successfully saved the program application.`,
                    "success",
                  );
                }
                this.saving = false;
                this.stepperElements.forEach((s) => {
                  if (s.formState === "complete") return;

                  if (s.formState !== "untouched")
                    this.stepperService.setStepperElementProperty(
                      s.id,
                      "formState",
                      "complete",
                    );
                  else
                    this.stepperService.setStepperElementProperty(
                      s.id,
                      "formState",
                      "untouched",
                    );
                });

                if (shouldExit)
                  this.router.navigate(["/authenticated/dashboard"]);

                this.formHelper.makeFormClean();
                this.reloadProgramApplication();
                resolve();
              } else {
                this.notificationQueueService.addNotification(
                  "The cap application could not be saved. If this problem is persisting please contact your ministry representative.",
                  "danger",
                );
                this.saving = false;
                reject();
              }
            },
            (err) => {
              console.log(err);
              this.notificationQueueService.addNotification(
                "The cap application could not be saved. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
              reject();
            },
          );
      } catch (err) {
        console.log(err);
        this.notificationQueueService.addNotification(
          "The cap application could not be saved. If this problem is persisting please contact your ministry representative.",
          "danger",
        );
        this.saving = false;
        reject();
      }
    });
  }
  exit() {
    if (this.formHelper.showWarningBeforeExit()) {
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
  submit() {
    try {
      if (!this.formHelper.isFormValid(this.notificationQueueService)) {
        return;
      }
      this.saving = true;
      let isSubmit = true;
      // console.log("submitting...");
      // console.log(structuredClone(this.trans));
      this.capService
        .postApiCAPApplication(
          convertCAPProgramToDynamics(this.trans, isSubmit),
        )
        .subscribe(
          (r) => {
            if (r.isSuccess) {
              this.notificationQueueService.addNotification(
                `You have successfully submitted the cap application.`,
                "success",
              );
              this.saving = false;
              this.stateService.refresh();
              this.router.navigate(["/authenticated/dashboard"]);
            } else {
              this.notificationQueueService.addNotification(
                "The cap application could not be submitted. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
            }
          },
          (err) => {
            console.log(err);
            this.notificationQueueService.addNotification(
              "The cap application could not be submitted. If this problem is persisting please contact your ministry representative.",
              "danger",
            );
            this.saving = false;
          },
        );
    } catch (err) {
      console.log(err);
      this.notificationQueueService.addNotification(
        "The cap application could not be saved. If this problem is persisting please contact your ministry representative.",
        "danger",
      );
      this.saving = false;
    }
  }
  reloadProgramApplication() {
    this.route.params.subscribe((p) => {
      const userId: string = this.stateService.main.getValue().userId;
      const organizationId: string =
        this.stateService.main.getValue().organizationId;
    });
  }

  setNextStepper() {
    let originalStepper = structuredClone(this.currentStepperElement);
    let currentTabHasInvalidClass =
      originalStepper.formState === "invalid" ? 1 : 0;

    if (originalStepper.object) {
      let obj_to_validate = new originalStepper.object.type(
        originalStepper.object.data,
      );
      if (!obj_to_validate.hasRequiredFields()) {
        // console.log(obj_to_validate.getMissingFields());
        this.notificationQueueService.addNotification(
          "Please fill in all required fields",
          "warning",
        );
        return;
      }
    }

    if (
      !this.formHelper.isFormValid(
        this.notificationQueueService,
        currentTabHasInvalidClass,
      )
    ) {
      return;
    }

    if (!this.trans.signature.signatureDate && !this.isCompleted) {
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

  showAddPersonDialog() {
    let dialogRef = this.dialog.open(AddPersonDialog, {
      autoFocus: false,
      width: "80vw",
      data: { agencyAddress: this.trans.applicantInformation.mailingAddress },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.stateService.refresh();
      }
    });
  }

  showCAPGuidelines() {
    this.dialog.open(CAPGuidelinesDialog);
  }
  showProgramEligibility() {
    this.dialog.open(ProgramEgilibilityDialog);
  }
}
