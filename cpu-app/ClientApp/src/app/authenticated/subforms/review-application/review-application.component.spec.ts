import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { ReviewApplicationComponent } from "./review-application.component";

describe("ReviewApplicationComponent", () => {
  let component: ReviewApplicationComponent;
  let fixture: ComponentFixture<ReviewApplicationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewApplicationComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideRouter([])],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewApplicationComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
