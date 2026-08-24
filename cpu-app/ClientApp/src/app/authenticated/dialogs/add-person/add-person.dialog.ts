import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import * as _ from "lodash";
import { OrgService } from "../../../core/api/services/org/org.service";
import { nameAssemble } from "../../../core/constants/name-assemble";
import { FormHelper } from "../../../core/form-helper";
import { Address } from "../../../core/models/address.class";
import { iAddress } from "../../../core/models/address.interface";
import { convertPersonnelToDynamics } from "../../../core/models/converters/personnel-to-dynamics";
import { Person } from "../../../core/models/person.class";
import { iPerson } from "../../../core/models/person.interface";
import { NotificationQueueService } from "../../../core/services/notification-queue.service";
import { StateService } from "../../../core/services/state.service";

@Component({
  selector: "add-person.dialog",
  templateUrl: "add-person.dialog.html",
  styleUrls: ["./add-person.dialog.scss"],
  standalone: false,
})
export class AddPersonDialog {
  agencyAddress: iAddress;
  person: iPerson;

  public nameAssemble = nameAssemble;
  public formHelper = new FormHelper();
  saving: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddPersonDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private stateService: StateService,
    private orgService: OrgService,
    private notificationQueueService: NotificationQueueService,
  ) {
    this.agencyAddress = data.agencyAddress;
    this.person = new Person();
  }

  setAddressSameAsAgency(person: iPerson) {
    let addressCopy = _.cloneDeep(this.agencyAddress);
    person.address = addressCopy;
  }
  clearAddress(person: iPerson) {
    person.address = new Address();
  }

  save() {
    try {
      if (!this.formHelper.isDialogValid(this.notificationQueueService)) {
        return;
      }
      if (
        !this.person.employmentStatus ||
        this.person.employmentStatus === "null"
      ) {
        this.notificationQueueService.addNotification(
          "Employment status is required.",
          "warning",
        );
        return;
      }
      this.saving = true;

      let thisPerson = new Person(this.person);
      if (thisPerson.hasRequiredFields()) {
        const userId = this.stateService.main.getValue().userId;
        const organizationId = this.stateService.main.getValue().organizationId;
        const post = convertPersonnelToDynamics(userId, organizationId, [
          this.person,
        ]);
        this.orgService.setStaff(post).subscribe(
          (r) => {
            if (r.isSuccess) {
              this.saving = false;
              this.notificationQueueService.addNotification(
                `Information is saved for ${nameAssemble(this.person.firstName, this.person.middleName, this.person.lastName)}`,
                "success",
              );
              this.dialogRef.close(true);
            } else {
              this.notificationQueueService.addNotification(
                "There was a problem saving this person. If this problem is persisting please contact your ministry representative.",
                "danger",
              );
              this.saving = false;
            }
          },
          (err) => {
            this.notificationQueueService.addNotification(err, "danger");
            this.saving = false;
          },
        );
      } else {
        this.saving = false;
        this.notificationQueueService.addNotification(
          "Please fill in required fields.",
          "warning",
        );
      }
    } catch (err) {
      console.log(err);
      this.notificationQueueService.addNotification(
        "The agency staff could not be saved. If this problem is persisting please contact your ministry representative.",
        "danger",
      );
      this.saving = false;
    }
  }

  close() {
    this.dialogRef.close();
  }
}
