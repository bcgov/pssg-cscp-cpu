// Test entry point for @angular/build:karma (esbuild-based runner).
// Replaces the old webpack/__karma__ bootstrap.
import { NgModule, provideZoneChangeDetection } from "@angular/core";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";

// zone.js and zone.js/testing are loaded via the polyfills config in angular.json.

@NgModule({ providers: [provideZoneChangeDetection()] })
export class TestModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, TestModule],
  platformBrowserTesting(),
  {
    teardown: { destroyAfterEach: false },
    errorOnUnknownElements: false,
    errorOnUnknownProperties: false,
  },
);
