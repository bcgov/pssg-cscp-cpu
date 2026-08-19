import {
  enableProdMode,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from "@angular/core";
import { platformBrowser } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { AppModule } from "./app/app.module";
import { HealthCheckService } from "./app/core/services/health-check.service";
import { ConfigurationStore } from "./app/core/store/configuration.store";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
  if (window) {
    window.console.log = function () {};
  }
}

platformBrowser().bootstrapModule(AppModule, {
  applicationProviders: [
    provideZoneChangeDetection(),
    provideAppInitializer(async () => {
      const router = inject(Router);
      const healthCheckService = inject(HealthCheckService);
      const configStore = inject(ConfigurationStore);

      await healthCheckService.initialize();

      if (!healthCheckService.isHealthy()) {
        router.navigateByUrl("/outage");
        return;
      }

      await configStore.load();

      if (configStore.maintenanceMode()) {
        router.navigateByUrl("/maintenance");
      }
    }),
  ],
});
