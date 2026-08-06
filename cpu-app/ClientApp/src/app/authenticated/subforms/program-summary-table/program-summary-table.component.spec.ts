import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { PhonePipe } from "../../../core/pipes/phone.pipe";
import { ProgramSummaryTableComponent } from "./program-summary-table.component";

describe("ProgramSummaryTableComponent", () => {
  let component: ProgramSummaryTableComponent;
  let fixture: ComponentFixture<ProgramSummaryTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramSummaryTableComponent, PhonePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideRouter([])],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramSummaryTableComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
