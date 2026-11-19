import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { StatusReportService } from "../../core/api/services/status-report/status-report.service";
import { FormHelper } from "../../core/form-helper";
import { iAnswerCollection } from "../../core/models/answer-collection.interface";
import { TransmogrifierCompleteStatusReport } from "../../core/models/transmogrifier-complete-status-report.class";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";

@Component({
  selector: "app-completed-status-report",
  templateUrl: "./completed-status-report.component.html",
  styleUrls: ["./completed-status-report.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CompletedStatusReportComponent implements OnInit, OnDestroy {
  data: any;
  trans: TransmogrifierCompleteStatusReport;
  mainTrans: Transmogrifier;

  stepperElements: iStepperElement[];
  currentStepperElement: iStepperElement;
  stepperIndex: number = 0;
  saving: boolean = false;
  didload: boolean = false;

  public formHelper = new FormHelper();
  constructor(
    private notificationQueueService: NotificationQueueService,
    private route: ActivatedRoute,
    private router: Router,
    private statusReportService: StatusReportService,
    private stateService: StateService,
    private stepperService: IconStepperService,
  ) {}

  ngOnInit() {
    this.didload = false;
    this.mainTrans = this.stateService.main.getValue();
    this.route.params.subscribe((p) => {
      const organizationId: string =
        this.stateService.main.getValue().organizationId;
      const userId: string = this.stateService.main.getValue().userId;

      this.statusReportService
        .getApiStatusReportDataCollectionBusinessBceidUserBceidDataCollectionId(
          organizationId,
          userId,
          p["dataCollectionId"],
        )
        .subscribe((r) => {
          if (!r.isSuccess) {
            this.notificationQueueService.addNotification(
              "An attempt at getting this status report was unsuccessful. If this problem persists please notify your ministry contact.",
              "danger",
            );
            this.router.navigate(["/authenticated/dashboard"]);
          } else {
            this.data = r;
            this.trans = new TransmogrifierCompleteStatusReport(r);
            let title =
              (this.trans.reportingPeriod
                ? this.trans.reportingPeriod
                : "Monthly") + "Status Report";
            this.trans.title = title;
            this.constructDefaultstepperElements();
          }
        });
    });

    this.stepperService.stepperElements.subscribe(
      (e) => (this.stepperElements = e),
    );
    this.stepperService.currentStepperElement.subscribe((e) => {
      this.currentStepperElement = e;

      if (this.currentStepperElement && this.stepperElements) {
        this.stepperIndex = this.stepperElements.findIndex(
          (e) => e.id === this.currentStepperElement.id,
        );
      }
    });
  }
  ngOnDestroy() {
    this.didload = false;
  }
  constructDefaultstepperElements() {
    this.stepperService.reset();
    this.trans.statusReportAnswers
      .map((srq: iAnswerCollection): iStepperElement => {
        return {
          itemName: srq.name,
          formState: "untouched",
          object: null,
          discriminator: null,
        };
      })
      .forEach((f: iStepperElement) => {
        this.stepperService.addStepperElement(
          f.object,
          f.itemName,
          f.formState,
          f.discriminator,
        );
      });
    this.stepperService.setToFirstStepperElement();
    this.didload = true;
  }

  exit() {
    this.stateService.refresh();
    this.router.navigate(["/authenticated/dashboard"]);
  }

  setNextStepper() {
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
