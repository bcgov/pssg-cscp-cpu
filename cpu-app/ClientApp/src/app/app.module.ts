import { AngularSignaturePadModule as SignaturePadModule } from "@almothafar/angular-signature-pad";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from "ngx-mask";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BudgetProposalComponent } from "./authenticated/budget-proposal/budget-proposal.component";
import { CAPApplicationComponent } from "./authenticated/cap-application/cap-application.component";
import { MinistryContactBoxComponent } from "./authenticated/components/ministry-contact-box/ministry-contact-box.component";
import { OrganizationProfileBoxComponent } from "./authenticated/components/organization-profile-box/organization-profile-box.component";
import { TaskListComponent } from "./authenticated/components/task-list/task-list.component";
import { CoverLetterComponent } from "./authenticated/cover-letter/cover-letter.component";
import { DashboardComponent } from "./authenticated/dashboard/dashboard.component";
import { AddPersonDialog } from "./authenticated/dialogs/add-person/add-person.dialog";
import { AppendixADialog } from "./authenticated/dialogs/appendix-a/appendix-a.dialog";
import { CAPGuidelinesDialog } from "./authenticated/dialogs/cap-guidelines/cap-guidelines.dialog";
import { ProgramEgilibilityDialog } from "./authenticated/dialogs/program-egilibility/program-egilibility.dialog";
import { ExpenseReportComponent } from "./authenticated/expense-report/expense-report.component";
import { NewUserNewOrganizationComponent } from "./authenticated/new-user-new-organization/new-user-new-organization.component";
import { NewUserComponent } from "./authenticated/new-user/new-user.component";
import { PersonnelComponent } from "./authenticated/personnel/personnel.component";
import { ProfileComponent } from "./authenticated/profile/profile.component";
import { ProgramApplicationComponent } from "./authenticated/program-application/program-application.component";
import { ProgramContactComponent } from "./authenticated/program-contact/program-contact.component";
import { ProgramSurplusComponent } from "./authenticated/program-surplus/program-surplus.component";
import { SignContractComponent } from "./authenticated/sign-contract/sign-contract.component";
import { CompletedStatusReportComponent } from "./authenticated/status-report/completed-status-report.component";
import { StatusReportComponent } from "./authenticated/status-report/status-report.component";
import { AddressFormComponent } from "./authenticated/subforms/address-form/address-form.component";
import { AddressComponent } from "./authenticated/subforms/address/address.component";
import { Address2Component } from "./authenticated/subforms/address2/address2.component";
import { AdministrativeInformationComponent } from "./authenticated/subforms/administrative-information/administrative-information.component";
import { ApplicantInformationComponent } from "./authenticated/subforms/applicant-information/applicant-information.component";
import { CAPProgramComponent } from "./authenticated/subforms/cap-program/cap-program.component";
import { CgLiabilityComponent } from "./authenticated/subforms/cg-liability/cg-liability.component";
import { ContactInformation2Component } from "./authenticated/subforms/contact-information2/contact-information2.component";
import { ContractPackageAuthorizerComponent } from "./authenticated/subforms/contract-package-authorizer/contract-package-authorizer";
import { ContractTombstoneComponent } from "./authenticated/subforms/contract-tombstone/contract-tombstone.component";
import { ExpenseTableComponent } from "./authenticated/subforms/expense-table/expense-table.component";
import { FundingCriteriaComponent } from "./authenticated/subforms/funding-criteria/funding-criteria.component";
import { HoursComponent } from "./authenticated/subforms/hours/hours.component";
import { MessageReadComponent } from "./authenticated/subforms/message-read/message-read.component";
import { MessageWriteComponent } from "./authenticated/subforms/message-write/message-write.component";
import { PersonCardComponent } from "./authenticated/subforms/person-card/person-card.component";
import { PersonEditorFormComponent } from "./authenticated/subforms/person-editor-form/person-editor-form.component";
import { PersonEditorComponent } from "./authenticated/subforms/person-editor/person-editor.component";
import { PersonPickerFormComponent } from "./authenticated/subforms/person-picker-form/person-picker-form.component";
import { PersonPickerListComponent } from "./authenticated/subforms/person-picker-list/person-picker-list.component";
import { PersonPickerComponent } from "./authenticated/subforms/person-picker/person-picker.component";
import { PersonTableComponent } from "./authenticated/subforms/person-table/person-table.component";
import { PersonnelExpenseTableComponent } from "./authenticated/subforms/personnel-expense-table/personnel-expense-table.component";
import { PrimaryContactFormComponent } from "./authenticated/subforms/primary-contact-form/primary-contact-form.component";
import { PrimaryContactInfoComponent } from "./authenticated/subforms/primary-contact-info/primary-contact-info.component";
import { ProgramAuthorizerComponent } from "./authenticated/subforms/program-authorizer/program-authorizer.component";
import { ProgramBudgetComponent } from "./authenticated/subforms/program-budget/program-budget.component";
import { ProgramContactInformationComponent } from "./authenticated/subforms/program-contact-information/program-contact-information.component";
import { ProgramSummaryTableComponent } from "./authenticated/subforms/program-summary-table/program-summary-table.component";
import { ProgramComponent } from "./authenticated/subforms/program/program.component";
import { RevenueSourceTableComponent } from "./authenticated/subforms/revenue-source-table/revenue-source-table.component";
import { ReviewApplicationComponent } from "./authenticated/subforms/review-application/review-application.component";
import { SurplusReportComponent } from "./authenticated/surplus-report/surplus-report.component";
import { UploadDocumentComponent } from "./authenticated/upload-document/upload-document.component";
import { UppercaseDirective } from "./core/directives/uppercase.directive";
import { PhonePipe } from "./core/pipes/phone.pipe";
import { SafePipe } from "./core/pipes/safe.pipe";
import { HealthCheckService } from "./core/services/health-check.service";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { LoginPageComponent } from "./login/login.component";
import { OutageComponent } from "./shared/outage/outage.component";
import { ServiceNotAvailableComponent } from "./shared/service-not-available.component";
import { SharedModule } from "./shared/shared.module";
import { ToolTipTriggerComponent } from "./shared/tool-tip/tool-tip.component";
import { TestComponent } from "./test/test.component";

@NgModule({
  declarations: [
    AddPersonDialog,
    Address2Component,
    PersonPickerFormComponent,
    PrimaryContactFormComponent,
    AddressFormComponent,
    AddressComponent,
    AdministrativeInformationComponent,
    AppComponent,
    AppendixADialog,
    ApplicantInformationComponent,
    BudgetProposalComponent,
    CAPApplicationComponent,
    CAPGuidelinesDialog,
    CAPProgramComponent,
    CgLiabilityComponent,
    CompletedStatusReportComponent,
    ContactInformation2Component,
    ContractPackageAuthorizerComponent,
    ContractTombstoneComponent,
    CoverLetterComponent,
    DashboardComponent,
    ExpenseReportComponent,
    ExpenseTableComponent,
    FundingCriteriaComponent,
    HoursComponent,
    LandingPageComponent,
    LoginPageComponent,
    MessageReadComponent,
    MessageWriteComponent,
    MinistryContactBoxComponent,
    NewUserComponent,
    NewUserNewOrganizationComponent,
    OrganizationProfileBoxComponent,
    PersonCardComponent,
    PersonEditorComponent,
    PersonEditorFormComponent,
    PersonPickerComponent,
    PersonPickerListComponent,
    PersonTableComponent,
    PersonnelComponent,
    PersonnelExpenseTableComponent,
    PhonePipe,
    PrimaryContactInfoComponent,
    ProfileComponent,
    ProgramApplicationComponent,
    ProgramAuthorizerComponent,
    ProgramBudgetComponent,
    ProgramComponent,
    ProgramContactComponent,
    ProgramContactInformationComponent,
    ProgramEgilibilityDialog,
    ProgramSummaryTableComponent,
    ProgramSurplusComponent,
    RevenueSourceTableComponent,
    ReviewApplicationComponent,
    SafePipe,
    SignContractComponent,
    StatusReportComponent,
    SurplusReportComponent,
    TaskListComponent,
    TestComponent,
    ToolTipTriggerComponent,
    UploadDocumentComponent,
    UppercaseDirective,
    ServiceNotAvailableComponent,
    OutageComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    MatDialogModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    SignaturePadModule,
    NgxMaskDirective,
    NgxMaskPipe,
  ],
  providers: [
    provideNgxMask(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: APP_INITIALIZER,
      useFactory: (healthCheckService: HealthCheckService) => () =>
        healthCheckService.initialize(),
      deps: [HealthCheckService],
      multi: true,
    },
  ],
  exports: [MatToolbarModule, MatTooltipModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
