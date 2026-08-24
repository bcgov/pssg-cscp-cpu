import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { ProgramApplicationPost } from "../../core/api/models";
import { ProgramApplicationService } from "../../core/api/services/program-application/program-application.service";
import { FormHelper } from "../../core/form-helper";
import { Address } from "../../core/models/address.class";
import { AdministrativeInformation } from "../../core/models/administrative-information.class";
import { ContactInformation } from "../../core/models/contact-information.class";
import { convertProgramApplicationToDynamics } from "../../core/models/converters/program-application-to-dynamics";
import { Hours } from "../../core/models/hours.class";
import { ProgramApplication } from "../../core/models/program-application.class";
import { iProgramApplication } from "../../core/models/program-application.interface";
import { TransmogrifierProgramApplication } from "../../core/models/transmogrifier-program-application.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";
import { AddPersonDialog } from "../dialogs/add-person/add-person.dialog";

const PAGES = {
  CONTACT_INFO: "contact_information",
  ADMIN_INFO: "administrative_information",
  CGLI: "commercial_general_liability_insurance",
  PROGRAM: "program",
  REVIEW: "review_application",
  AUTH: "authorization",
};

@Component({
  selector: "app-program-application",
  templateUrl: "./program-application.component.html",
  styleUrls: ["./program-application.component.css"],
  standalone: false,
})
export class ProgramApplicationComponent implements OnInit {
  data: any;
  out: ProgramApplicationPost;
  trans: TransmogrifierProgramApplication;
  stepperElements: iStepperElement[];
  currentStepperElement: iStepperElement;
  stepperIndex: number = 0;

  programTabs = ["Program Information", "Program Hours of Operations"];
  reviewApplicationTabs: string[] = ["Application Information"];
  currentReviewApplicationTab: number = 0;

  discriminators: string[] = [
    "contact_information",
    "administrative_information",
    "commercial_general_liability_insurance",
    "program",
    "review_application",
    "authorization",
  ];

  programError: boolean = false;
  saving: boolean = false;
  isCompleted: boolean = false;

  private formHelper = new FormHelper();

  REQUIRED_FIELDS: any = {
    contact_information: [],
    administrative_information: [],
    commercial_general_liability_insurance: [],
    program: ["emailAddress", "phoneNumber"],
    review_application: [],
    authorization: [],
  };

  constructor(
    private notificationQueueService: NotificationQueueService,
    private programApplicationService: ProgramApplicationService,
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private stepperService: IconStepperService,
    public ref: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((q) => {
      if (q && q.completed) {
        this.isCompleted = q.completed == "true";
      }
    });
    this.route.params.subscribe((p) => {
      const userId: string = this.stateService.main.getValue().userId;
      const organizationId: string =
        this.stateService.main.getValue().organizationId;
      this.programApplicationService
        .getApiProgramApplicationBusinessBceidUserBceidScheduleFId(
          organizationId,
          userId,
          p["taskId"],
        )
        .subscribe((f) => {
          if (!f.isSuccess) {
            this.notificationQueueService.addNotification(
              "An attempt at getting this program application form was unsuccessful. If the problem persists please notify your ministry contact.",
              "danger",
            );
            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            this.data = f;

            this.trans = new TransmogrifierProgramApplication(f);
            this.trans.programApplications.forEach((p: iProgramApplication) => {
              this.reviewApplicationTabs.push(p.name);
            });
            this.constructDefaultstepperElements(this.trans);

            if (this.isCompleted)
              this.trans.administrativeInformation.awareOfCriminalRecordCheckRequirement = true;
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

  isCurrentStepperElement(item: iStepperElement): boolean {
    if (item.id === this.currentStepperElement.id) {
      return true;
    }
    return false;
  }
  constructDefaultstepperElements(m: TransmogrifierProgramApplication) {
    this.stepperService.reset();
    [
      {
        itemName: "Applicant Contact Information",
        formState: "untouched",
        object: { type: ContactInformation, data: m.contactInformation },
        discriminator: "contact_information",
      },
      {
        itemName: "Applicant Administrative Information",
        formState: "untouched",
        object: {
          type: AdministrativeInformation,
          data: m.administrativeInformation,
        },
        discriminator: "administrative_information",
      },
      {
        itemName: "Commercial General Liability Insurance",
        formState: "untouched",
        object: null,
        discriminator: "commercial_general_liability_insurance",
      },
    ].forEach((f: iStepperElement) => {
      this.stepperService.addStepperElement(
        f.object,
        f.itemName,
        f.formState,
        f.discriminator,
      );
    });

    if (!this.trans.programApplications.length) {
      this.programError = true;
      this.stepperService.addStepperElement(
        null,
        "Program Application Does Not Include Programs",
        "invalid",
      );
      this.notificationQueueService.addNotification(
        "A program application should always have a program attached. This is a problem with the data held by the ministry. Please contact your ministry representative and let them know that this has occured and that you cannot complete your program application.",
        "danger",
        99999999,
      );
    }

    this.trans.programApplications.forEach((p: iProgramApplication) => {
      this.stepperService.addStepperElement(
        { type: ProgramApplication, data: p },
        p.name,
        "untouched",
        "program",
      );
    });

    let finalStepperElements = [
      {
        itemName: "Review Program Application",
        formState: "untouched",
        object: null,
        discriminator: "review_application",
      },
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

        this.saving = true;
        this.out = convertProgramApplicationToDynamics(this.trans);
        this.programApplicationService
          .postApiProgramApplication(this.out)
          .subscribe({
            next: () => {
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
            },
            error: (err) => {
              console.log(err);
              this.notificationQueueService.addNotification(
                "The program application could not be saved. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
              reject();
            },
          });
      } catch (err) {
        console.log(err);
        this.notificationQueueService.addNotification(
          "The program application could not be saved. If this problem is persisting please contact your ministry representative.",
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
      this.out = convertProgramApplicationToDynamics(this.trans, isSubmit);
      this.programApplicationService
        .postApiProgramApplication(this.out)
        .subscribe(
          () => {
            this.notificationQueueService.addNotification(
              `You have successfully submitted the program application.`,
              "success",
            );
            this.saving = false;
            this.stateService.refresh();
            this.router.navigate(["/authenticated/dashboard"]);
          },
          (err) => {
            console.log(err);
            this.notificationQueueService.addNotification(
              "The program application could not be submitted. If this problem is persisting please contact your ministry representative.",
              "danger",
            );
            this.saving = false;
          },
        );
    } catch (err) {
      console.log(err);
      this.notificationQueueService.addNotification(
        "The program application could not be saved. If this problem is persisting please contact your ministry representative.",
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
      this.programApplicationService
        .getApiProgramApplicationBusinessBceidUserBceidScheduleFId(
          organizationId,
          userId,
          p["taskId"],
        )
        .subscribe((f) => {
          if (!f.isSuccess) {
            this.notificationQueueService.addNotification(
              "An attempt at getting this program application form was unsuccessful. If the problem persists please notify your ministry contact.",
              "danger",
            );
            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            this.data = f;
            let tempTrans = new TransmogrifierProgramApplication(f);

            for (let i = 0; i < tempTrans.programApplications.length; ++i) {
              Object.assign(
                this.trans.programApplications[i],
                tempTrans.programApplications[i],
              );
              if (this.trans.programApplications[i].standbyHours.length == 0) {
                this.trans.programApplications[i].standbyHours.push(
                  new Hours(),
                );
              }
              if (
                this.trans.programApplications[i].operationHours.length == 0
              ) {
                this.trans.programApplications[i].operationHours.push(
                  new Hours(),
                );
              }
            }
          }
        });
    });
  }

  setNextStepper() {
    let originalStepper = _.cloneDeep(this.currentStepperElement);
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

    if (originalStepper.discriminator === PAGES.PROGRAM) {
      let current_program: iProgramApplication =
        this.trans.programApplications.find(
          (pa) => pa.programId === originalStepper.object.data.programId,
        );
      if (current_program) {
        let index = this.programTabs.findIndex(
          (t) => t === current_program.currentTab,
        );
        if (index < this.programTabs.length - 1) {
          if (
            !this.formHelper.isFormValid(
              this.notificationQueueService,
              currentTabHasInvalidClass,
            ) &&
            !this.isCompleted
          ) {
            return;
          }
          current_program.currentTab = this.programTabs[index + 1];
          window.scrollTo(0, 0);
          return;
        }
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

    if (originalStepper.discriminator === PAGES.REVIEW) {
      let index = this.currentReviewApplicationTab;
      // console.log(index);
      if (index < this.reviewApplicationTabs.length - 1) {
        ++this.currentReviewApplicationTab;
        window.scrollTo(0, 0);
        return;
      }
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

    let nextStepper = this.stepperElements[this.stepperIndex];
    if (nextStepper.discriminator === this.discriminators[3]) {
      let current_program = this.trans.programApplications.find(
        (pa) => pa.name === nextStepper.itemName,
      );
      if (current_program) {
        current_program.currentTab = this.programTabs[0];
      }
    }
    if (nextStepper.discriminator === this.discriminators[4]) {
      this.currentReviewApplicationTab = 0;
    }

    this.stepperService.setCurrentStepperElement(
      this.stepperElements[this.stepperIndex].id,
    );
  }
  setPreviousStepper() {
    if (this.currentStepperElement.discriminator === this.discriminators[3]) {
      let current_program = this.trans.programApplications.find(
        (pa) => pa.name === this.currentStepperElement.itemName,
      );
      if (current_program) {
        let index = this.programTabs.findIndex(
          (t) => t === current_program.currentTab,
        );
        if (index > 0) {
          current_program.currentTab = this.programTabs[index - 1];
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    if (this.currentStepperElement.discriminator === this.discriminators[4]) {
      let index = this.currentReviewApplicationTab;
      if (index > 0) {
        --this.currentReviewApplicationTab;
        window.scrollTo(0, 0);
        return;
      }
    }
    --this.stepperIndex;

    let nextStepper = this.stepperElements[this.stepperIndex];
    if (nextStepper.discriminator === this.discriminators[3]) {
      let current_program = this.trans.programApplications.find(
        (pa) => pa.name === nextStepper.itemName,
      );
      if (current_program) {
        current_program.currentTab =
          this.programTabs[this.programTabs.length - 1];
      }
    }
    if (nextStepper.discriminator === this.discriminators[4]) {
      this.currentReviewApplicationTab = this.reviewApplicationTabs.length - 1;
    }

    this.stepperService.setCurrentStepperElement(
      this.stepperElements[this.stepperIndex].id,
    );
  }
  reviewApplicationTabChange(index: number) {
    this.currentReviewApplicationTab = index;
  }
  setMailingAddressSameAsMainAddress() {
    if (this.trans.contactInformation.mailingAddressSameAsMainAddress) {
      this.trans.contactInformation.mailingAddress =
        this.trans.contactInformation.mainAddress;
    } else {
      this.trans.contactInformation.mailingAddress = new Address();
    }
  }

  showAddPersonDialog() {
    let dialogRef = this.dialog.open(AddPersonDialog, {
      autoFocus: false,
      width: "80vw",
      data: { agencyAddress: this.trans.contactInformation.mainAddress },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.stateService.refresh();
      }
    });
  }
}
