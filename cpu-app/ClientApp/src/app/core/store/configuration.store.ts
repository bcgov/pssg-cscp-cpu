import { computed, inject } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import moment from "moment-timezone";
import { catchError, of, pipe, switchMap, tap } from "rxjs";
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
      const current = moment().tz("America/Vancouver");
      const start = moment(startDate).tz("America/Vancouver");
      const end = moment(endDate).tz("America/Vancouver");
      return current.isBetween(start, end, null, "[]");
    }),
  })),
  withMethods((store) => {
    const configurationService = inject(ConfigurationService);

    return {
      load: rxMethod<void>(
        pipe(
          tap(() => {
            // Only load if not already loaded or loading
            if (store.configuration() || store.isLoading()) {
              return;
            }
            patchState(store, { isLoading: true, error: null });
          }),
          switchMap(() => {
            // Skip API call if already loaded
            if (store.configuration()) {
              return of(store.configuration()!);
            }

            return configurationService
              .getApiConfiguration<Configuration>()
              .pipe(
                tap((configuration) => {
                  console.log("Fetched Configuration:", configuration);
                  patchState(store, { configuration, isLoading: false });
                }),
                catchError((error) => {
                  console.error("Failed to load configuration:", error);
                  const errorMessage =
                    error?.message || "Failed to load configuration";
                  patchState(store, { error: errorMessage, isLoading: false });
                  return of(null);
                }),
              );
          }),
        ),
      ),
    };
  }),
);
