import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { ProgramAuthorizerComponent } from "./program-authorizer.component";

describe("ProgramAuthorizerComponent", () => {
  let component: ProgramAuthorizerComponent;
  let fixture: ComponentFixture<ProgramAuthorizerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramAuthorizerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideRouter([])],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramAuthorizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
