import { Injectable, inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { ConfigurationStore } from "../store/configuration.store";

@Injectable({
  providedIn: "root",
})
export class MaintenanceGuard {
  private readonly configStore = inject(ConfigurationStore);
  private readonly router = inject(Router);

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): boolean | UrlTree {
    if (this.configStore.maintenanceMode()) {
      return this.router.createUrlTree(["/maintenance"]);
    }

    return true;
  }
}
