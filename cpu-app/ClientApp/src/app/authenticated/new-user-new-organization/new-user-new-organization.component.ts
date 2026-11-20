import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { Router } from "@angular/router";
import { RegisterNewUserService } from "../../core/api/services/register-new-user/register-new-user.service";
import {
  EMAIL_PATTERN,
  LETTERS_SPACES_PATTERN,
  NAME_REGEX_PATTERN,
  PHONE_NUMBER_PATTERN,
} from "../../core/constants/regex.constants";
import { FormHelper } from "../../core/form-helper";
import { convertNewUserToDynamics } from "../../core/models/converters/new-user-to-dynamics";
import { TransmogrifierNewUser } from "../../core/models/converters/transmogrifier-new-user.class";
import { NotificationQueueService } from "../../core/services/notification-queue.service";
import { StateService } from "../../core/services/state.service";

@Component({
  selector: "app-new-user",
  templateUrl: "./new-user-new-organization.component.html",
  styleUrls: ["./new-user-new-organization.component.css"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class NewUserNewOrganizationComponent implements OnInit {
  emailRegex: string = EMAIL_PATTERN;
  phoneRegex: string = PHONE_NUMBER_PATTERN;
  wordRegex: string = LETTERS_SPACES_PATTERN;
  nameRegex: string = NAME_REGEX_PATTERN;
  organizationName: string;
  saving: boolean = false;
  trans: TransmogrifierNewUser = new TransmogrifierNewUser(false);
  public formHelper = new FormHelper();
  constructor(
    private stateService: StateService,
    private registerNewUserService: RegisterNewUserService,
    private router: Router,
    private notificationQueueService: NotificationQueueService,
  ) {}

  ngOnInit() {}

  registerNewUser() {
    try {
      let userSettings = this.stateService.userSettings.getValue();
      this.trans.organizationId = userSettings.accountId;
      this.trans.userId = userSettings.userId;

      if (!this.trans.hasRequiredOrganizationFields()) {
        this.notificationQueueService.addNotification(
          "Please fill in required Organization information.",
          "warning",
        );
        return;
      }

      if (!this.trans.hasRequiredFields()) {
        this.notificationQueueService.addNotification(
          "Please fill in required fields.",
          "warning",
        );
        return;
      }

      let data = convertNewUserToDynamics(this.trans);
      this.registerNewUserService.postApiRegisterNewUser(data).subscribe(
        (res) => {
          if (res.isSuccess) {
            this.notificationQueueService.addNotification(
              `You have successfully registered a new user and organization.`,
              "success",
            );
            setTimeout(() => {
              this.stateService.logout();
            }, 4000);
          } else {
            this.notificationQueueService.addNotification(
              "The new user could not be saved. If this problem is persisting please contact your ministry representative.",
              "danger",
            );
            this.saving = false;
          }
        },
        (err) => {
          console.log(err);
          this.notificationQueueService.addNotification(
            "The new user could not be saved. If this problem is persisting please contact your ministry representative.",
            "danger",
          );
          this.saving = false;
        },
      );
    } catch (err) {
      console.log(err);
      // console.log("some error happened...");
    }
  }
  exit() {
    if (
      this.formHelper.isFormDirty() &&
      confirm("Are you sure you want to exit?")
    ) {
      this.router.navigate([""]);
    } else {
      this.router.navigate([""]);
    }
  }
}
