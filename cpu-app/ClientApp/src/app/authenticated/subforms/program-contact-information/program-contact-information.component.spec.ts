import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { ProgramContactInformationComponent } from "./program-contact-information.component";

describe("ProgramContactInformationComponent", () => {
  let component: ProgramContactInformationComponent;
  let fixture: ComponentFixture<ProgramContactInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramContactInformationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideRouter([])],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramContactInformationComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
