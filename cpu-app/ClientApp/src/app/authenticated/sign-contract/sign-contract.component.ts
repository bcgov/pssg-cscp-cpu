import { HttpClient } from "@angular/common/http";
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import {
  DocumentItemDto,
  SignedContractPostFromPortal,
} from "../../core/api/models";
import { FileService } from "../../core/api/services/file/file.service";
import { FormHelper } from "../../core/form-helper";
import { convertContractPackageToDynamics } from "../../core/models/converters/sign-contract-to-dynamics";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";
import {
  IconStepperService,
  iStepperElement,
} from "../../shared/icon-stepper/icon-stepper.service";
import { iSignature } from "../subforms/program-authorizer/program-authorizer.component";

interface FileBundle {
  fileName: string[];
  fileData: string[];
}
@Component({
  selector: "app-sign-contract",
  templateUrl: "./sign-contract.component.html",
  styleUrls: ["./sign-contract.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SignContractComponent implements OnInit, OnDestroy {
  @ViewChild("files", { static: false })
  myInputVariable: ElementRef;

  saving: boolean = false;
  isLoading: boolean = false;
  stepperElements: iStepperElement[];
  currentStepperElement: iStepperElement;
  stepperIndex: number = 0;
  isModificationAgreement: boolean = false;

  documentCollection: DocumentItemDto[] = [];
  out: SignedContractPostFromPortal;

  trans: Transmogrifier;
  contractNumber: string;
  organizationId: string;
  userId: string;
  taskId: string;
  signature: iSignature = {
    signer: undefined,
    signature: "",
    signatureDate: undefined,
    termsConfirmation: false,
  };

  private stateSubscription: Subscription;

  private formHelper = new FormHelper();
  constructor(
    private fileService: FileService,
    private stepperService: IconStepperService,
    private router: Router,
    private stateService: StateService,
    private notificationQueueService: NotificationQueueService,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }

  ngOnInit() {
    let form_type = this.route.snapshot.data["formType"];
    this.isModificationAgreement = form_type == "sign_mod_agreement";

    this.isLoading = true;
    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.trans = m;
      },
    );

    this.route.params.subscribe((p) => {
      this.userId = this.stateService.main.getValue().userId;
      this.organizationId = this.stateService.main.getValue().organizationId;
      this.taskId = p["taskId"];

      this.contractNumber = this.trans.contracts.find(
        (c) => c.tasks.find((t) => t.taskId == this.taskId) !== undefined,
      ).contractNumber;

      this.fileService
        .getApiFileContractPackageBusinessBceidUserBceidTaskId(
          this.organizationId,
          this.userId,
          this.taskId,
        )
        .subscribe((d) => {
          if (!d.isSuccess) {
            this.isLoading = false;
            this.notificationQueueService.addNotification(
              "An attempt at getting this contract package was unsuccessful. If this problem persists please notify your ministry contact.",
              "danger",
            );
          } else {
            this.documentCollection = d.documentCollection ?? [];
            this.documentCollection = this.documentCollection.filter(
              (d) => d.filename?.indexOf(".pdf") > 0,
            );
            this.constructDefaultStepperElements();
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

  submit() {
    try {
      this.saving = true;
      this.out = convertContractPackageToDynamics(
        this.userId,
        this.organizationId,
        this.documentCollection,
        this.signature,
        this.isModificationAgreement,
      );
      this.fileService
        .postApiFileSignedContractTaskId(this.taskId, this.out)
        .subscribe(
          (r) => {
            this.saving = false;
            if (r.isSuccess) {
              this.notificationQueueService.addNotification(
                `You have successfully signed the contract.`,
                "success",
              );
              this.stateService.refresh();
              this.router.navigate(["/authenticated/dashboard"]);
            } else {
              this.notificationQueueService.addNotification(
                "The was a problem saving the signed contract. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
            }
          },
          (err) => {
            console.log(err);
            this.notificationQueueService.addNotification(
              "The was a problem saving the signed contract. If this problem is persisting please contact your ministry representative.",
              "danger",
            );
            this.saving = false;
          },
        );
    } catch (err) {
      console.log(err);
      this.notificationQueueService.addNotification(
        "The was a problem saving the signed contract. If this problem is persisting please contact your ministry representative.",
        "danger",
      );
      this.saving = false;
    }
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
  constructDefaultStepperElements() {
    this.stepperService.reset();

    this.documentCollection.forEach((doc) => {
      let file = "data:application/pdf;base64," + doc.body;
      let obj = { fileData: file, fileName: doc.filename };
      this.stepperService.addStepperElement(
        obj,
        doc.filename,
        "untouched",
        "document",
      );
    });

    if (this.stepperElements.length > 0) {
      this.getSignaturePage().then((file: string) => {
        let body = file.split(",").pop();

        this.documentCollection.push({
          subject: "signing page",
          subjectOther: "",
          body: body,
          filename: "Signature Page",
          overwritetime: "",
        });
        let obj = { fileData: file, fileName: "Sign Contract" };
        this.stepperService.addStepperElement(
          obj,
          "Sign Contract",
          "untouched",
          "auth",
        );

        this.stepperService.setToFirstStepperElement();
        this.isLoading = false;
      });
    } else {
      this.stepperService.setToFirstStepperElement();
      this.isLoading = false;
    }
  }

  getSignaturePage() {
    return new Promise((resolve, reject) => {
      let documentPath =
        "/coastcontracts/assets/documents/TUA Section 25 Draft.pdf";
      if (window.location.href.includes("localhost")) {
        documentPath = "/assets/documents/TUA Section 25 Draft.pdf";
      }
      this.http.get(documentPath, { responseType: "blob" }).subscribe((res) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          var base64data = reader.result;
          resolve(base64data);
        };
        reader.readAsDataURL(res);
      });
    });
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
