import { computed, inject } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from "@ngrx/signals";
import { firstValueFrom } from "rxjs";
import { ConfigurationService } from "../api/services/configuration/configuration.service";
import { Configuration } from "../models/configuration.interface";

type ConfigurationState = {
  configuration: Configuration | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: ConfigurationState = {
  configuration: null,
  isLoading: false,
  error: null,
};

export const ConfigurationStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed((store) => ({
    isProdCpu: computed(() => store.configuration()?.isProdCpu ?? false),
    featureHideReportSaveButton: computed(
      () => store.configuration()?.featureHideReportSaveButton ?? false,
    ),
    maintenanceMode: computed(
      () => store.configuration()?.maintenanceMode ?? false,
    ),
    outageMessage: computed(() => store.configuration()?.outageMessage ?? null),
    outageStartDate: computed(
      () => store.configuration()?.outageStartDate ?? null,
    ),
    outageEndDate: computed(() => store.configuration()?.outageEndDate ?? null),
  })),
  withComputed((store) => ({
    showAnnouncementBanner: computed(() => {
      const message = store.outageMessage();
      const startDate = store.outageStartDate();
      const endDate = store.outageEndDate();
      if (!message || !startDate || !endDate) return false;
      const now = Date.now();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return now >= start && now <= end;
    }),
  })),
  withMethods((store, configurationService = inject(ConfigurationService)) => ({
    async load(): Promise<void> {
      if (store.configuration() || store.isLoading()) {
        return;
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const configuration = await firstValueFrom(
          configurationService.getApiConfiguration<Configuration>(),
        );

        patchState(store, {
          configuration,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to load configuration:", error);
        patchState(store, {
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load configuration",
        });
      }
    },
  })),
);
