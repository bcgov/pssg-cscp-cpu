import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { MinistryContactBoxComponent } from "./ministry-contact-box.component";

describe("MinistryContactBoxComponent", () => {
  let component: MinistryContactBoxComponent;
  let fixture: ComponentFixture<MinistryContactBoxComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MinistryContactBoxComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideRouter([])],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinistryContactBoxComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
