import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { nameAssemble } from "../../core/constants/name-assemble";
import { HealthCheckService } from "../../core/services/health-check.service";
import { StateService } from "../../core/services/state.service";
import { UserDataService } from "../../core/services/user-data.service";
import { ConfigurationStore } from "../../core/store/configuration.store";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  title: string = "Victim Services Community Programs Unit";
  currentUser: string;
  nameAssemble;
  loggedIn: boolean = false;
  loading = false;
  window = window;
  isNewUserRegistration: boolean = false;
  apiPath = environment.apiRootUrl;
  private readonly configStore = inject(ConfigurationStore);

  constructor(
    private router: Router,
    private stateService: StateService,
    private userData: UserDataService,
    private healthCheckService: HealthCheckService,
  ) {
    // for building names
    this.nameAssemble = nameAssemble;
  }

  /** Exposed so the template can read the health signal. */
  readonly isHealthy = this.healthCheckService.isHealthy;
  readonly maintenanceMode = this.configStore.maintenanceMode;

  ngOnInit() {
    this.stateService.loggedIn.subscribe((l: boolean) => {
      this.loggedIn = l;
      if (window.location.href.indexOf("login") < 0) {
        this.router.navigate([this.stateService.homeRoute.getValue()]);
      }
    });
    this.stateService.currentUser.subscribe((u) => {
      if (u) {
        this.currentUser = nameAssemble(u.firstName, u.middleName, u.lastName);
      }
    });
    this.stateService.loading.subscribe((l) => (this.loading = l));
  }
  login() {
    if (this.maintenanceMode()) {
      return;
    }

    if (window.location.href.includes("localhost")) {
      this.stateService.login();
    } else {
      window.location.href = "login";
    }
  }
  logout() {
    this.stateService.logout();
  }
  homeButton() {
    // this is done without a routerlink because you will want to route the user back to a place
    // that is appropriate for their role. So check their logged in state and etc before deciding which route they go to.
    this.router.navigate([this.stateService.homeRoute.getValue()]);
  }
}
