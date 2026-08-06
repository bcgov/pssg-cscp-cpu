import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { OrgService } from "../../core/api/services/org/org.service";
import { ContactInformationFormFactory } from "../../core/forms/contact-information-form.factory";
import { iContactInformation } from "../../core/models/contact-information.interface";
import { convertContactInformationToDynamics } from "../../core/models/converters/contact-information-to-dynamics";
import { Transmogrifier } from "../../core/models/transmogrifier.class";
import { Roles } from "../../core/models/user-settings.interface";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
  standalone: false,
})
export class ProfileComponent implements OnInit, OnDestroy {
  trans: Transmogrifier;
  contactForm: FormGroup;
  saving: boolean = false;
  private stateSubscription: Subscription;
  private executiveContactSubscription: Subscription;
  private boardContactSubscription: Subscription;
  originalContactInfo: iContactInformation;
  Roles = Roles;
  userRole = Roles.ProgramStaff;

  constructor(
    private router: Router,
    private stateService: StateService,
    private orgService: OrgService,
    private notificationQueueService: NotificationQueueService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.userRole = this.stateService.userSettings.getValue().userRole;

    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.trans = m;
        this.originalContactInfo = structuredClone(this.trans.contactInformation);

        // Initialize form with contact information
        this.contactForm =
          ContactInformationFormFactory.createContactInformationFormGroup(
            this.fb,
            this.trans.contactInformation,
          );

        this.setupMailingAddressSync();

        this.disableFormControlsForRole();

        this.setTransmogrifierValueOnContactChange();
      },
    );
  }

  private setupMailingAddressSync(): void {
    const mailingAddressSameControl = this.contactForm.get(
      "mailingAddressSameAsMainAddress",
    );
    const mainAddressControl = this.contactForm.get("mainAddress");
    const mailingAddressControl = this.contactForm.get("mailingAddress");

    if (mailingAddressSameControl?.value) {
      mailingAddressControl?.disable({ emitEvent: false });
    }

    mailingAddressSameControl?.valueChanges.subscribe((isSame) => {
      if (isSame) {
        mailingAddressControl?.patchValue(mainAddressControl?.value, {
          emitEvent: false,
        });
        mailingAddressControl?.disable({ emitEvent: false });
      } else {
        mailingAddressControl?.enable({ emitEvent: false });
        mailingAddressControl?.reset(mainAddressControl?.value, {
          emitEvent: false,
        });
      }
    });

    // Sync mailing address when main address changes (if checkbox is checked)
    mainAddressControl?.valueChanges.subscribe((mainAddress) => {
      if (mailingAddressSameControl?.value) {
        mailingAddressControl?.patchValue(mainAddress, { emitEvent: false });
      }
    });
  }

  private disableFormControlsForRole(): void {
    if (this.userRole === Roles.ProgramStaff) {
      this.contactForm.get("primaryContact")?.disable();
      this.contactForm.get("mainAddress")?.disable();
      this.contactForm.get("mailingAddress")?.disable();
      this.contactForm.get("executiveContactId")?.disable();
      this.contactForm.get("boardContactId")?.disable();
    }
  }

  private setTransmogrifierValueOnContactChange(): void {
    const hasBoardContactControl = this.contactForm.get("hasBoardContact");
    hasBoardContactControl?.valueChanges.subscribe((hasBoardContact) => {
      this.trans.contactInformation.hasBoardContact = hasBoardContact;

      if (!hasBoardContact) {
        this.boardContactControl?.patchValue(null);
      }
    });

    // Sync executive contact personId to trans.contactInformation
    const executiveContactControl = this.contactForm.get("executiveContactId");
    this.executiveContactSubscription =
      executiveContactControl?.valueChanges.subscribe((personId) => {
        if (personId && this.trans?.persons) {
          this.trans.contactInformation.executiveContact =
            this.trans.persons.find((p) => p.personId === personId);
        }
      });

    // Sync board contact personId to trans.contactInformation
    const boardContactControl = this.contactForm.get("boardContactId");
    this.boardContactSubscription = boardContactControl?.valueChanges.subscribe(
      (personId) => {
        if (personId && this.trans?.persons) {
          this.trans.contactInformation.boardContact = this.trans.persons.find(
            (p) => p.personId === personId,
          );
        }
      },
    );
  }

  get executiveContactControl(): FormControl {
    return this.contactForm?.get("executiveContactId") as FormControl;
  }

  get boardContactControl(): FormControl {
    return this.contactForm?.get("boardContactId") as FormControl;
  }

  ngOnDestroy() {
    // Restore original contact info if form was modified but not saved
    if (this.contactForm && this.contactForm.dirty) {
      const updatedContactInfo =
        ContactInformationFormFactory.formToContactInformation(
          this.contactForm,
          this.trans.contactInformation,
        );
      if (JSON.stringify(this.originalContactInfo) !== JSON.stringify(updatedContactInfo)) {
        this.trans.contactInformation = this.originalContactInfo;
      }
    }
    this.stateSubscription?.unsubscribe();
    this.executiveContactSubscription?.unsubscribe();
    this.boardContactSubscription?.unsubscribe();
  }

  cancel() {
    // Reset form to original values - this will trigger subscriptions
    // and update trans.contactInformation automatically
    this.contactForm.patchValue({
      executiveContactId:
        this.originalContactInfo.executiveContact?.personId || null,
      boardContactId: this.originalContactInfo.boardContact?.personId || null,
      hasBoardContact: this.originalContactInfo.hasBoardContact || false,
      mailingAddressSameAsMainAddress:
        this.originalContactInfo.mailingAddressSameAsMainAddress || false,
    });

    // Reset address groups
    this.contactForm
      .get("mainAddress")
      ?.patchValue(this.originalContactInfo.mainAddress || {});
    this.contactForm
      .get("mailingAddress")
      ?.patchValue(this.originalContactInfo.mailingAddress || {});
    this.contactForm.get("primaryContact")?.patchValue({
      emailAddress: this.originalContactInfo.emailAddress || "",
      phoneNumber: this.originalContactInfo.phoneNumber || "",
      faxNumber: this.originalContactInfo.faxNumber || "",
    });

    this.contactForm.markAsPristine();
    this.contactForm.markAsUntouched();
  }

  save(shouldExit: boolean = false): void {
    try {
      // Mark all fields as touched to show validation errors
      this.contactForm.markAllAsTouched();

      // Check form validity (validates all fields including person pickers)
      if (!this.contactForm.valid) {
        this.notificationQueueService.addNotification(
          "All required fields must be completed.",
          "warning",
        );
        return;
      }

      // Merge form values back to trans.contactInformation
      const updatedContactInfo =
        ContactInformationFormFactory.formToContactInformation(
          this.contactForm,
          this.trans.contactInformation,
        );

      this.saving = true;

      // Update trans with form values
      this.trans.contactInformation = updatedContactInfo;

      this.orgService
        .postApiOrg(convertContactInformationToDynamics(this.trans))
        .subscribe(
          (res) => {
            this.saving = false;
            this.notificationQueueService.addNotification(
              "The contact information for your organization has been updated.",
              "success",
            );
            this.stateService.refresh();
            this.contactForm.markAsPristine();
            this.originalContactInfo = structuredClone(
              this.trans.contactInformation,
            );
            if (shouldExit)
              this.router.navigate([this.stateService.homeRoute.getValue()]);
          },
          (err) => {
            console.log(err);
            this.saving = false;
            this.notificationQueueService.addNotification(
              "The contact information could not be saved. Please try again.",
              "danger",
            );
          },
        );
    } catch (err) {
      console.log(err);
      this.notificationQueueService.addNotification(
        "The contact information for your organization could not be saved. If this problem is persisting please contact your ministry representative.",
        "danger",
      );
      this.saving = false;
    }
  }

  exit() {
    if (this.contactForm.dirty) {
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
}
