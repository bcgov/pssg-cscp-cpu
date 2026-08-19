import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { BudgetProposalComponent } from "./authenticated/budget-proposal/budget-proposal.component";
import { CAPApplicationComponent } from "./authenticated/cap-application/cap-application.component";
import { CoverLetterComponent } from "./authenticated/cover-letter/cover-letter.component";
import { DashboardComponent } from "./authenticated/dashboard/dashboard.component";
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
import { MessageReadComponent } from "./authenticated/subforms/message-read/message-read.component";
import { MessageWriteComponent } from "./authenticated/subforms/message-write/message-write.component";
import { SurplusReportComponent } from "./authenticated/surplus-report/surplus-report.component";
import { UploadDocumentComponent } from "./authenticated/upload-document/upload-document.component";
import { AuthenticationGuard } from "./core/guards/authentication.guard";
import { HealthGuard } from "./core/guards/health.guard";
import { MaintenanceGuard } from "./core/guards/maintenance.guard";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { LoginPageComponent } from "./login/login.component";
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { NotFoundComponent } from "./shared/not-found/not-found.component";
import { OutageComponent } from "./shared/outage/outage.component";
import { TestComponent } from "./test/test.component";

const routes: Routes = [
  {
    path: "outage",
    component: OutageComponent,
  },
  {
    path: "maintenance",
    component: MaintenanceComponent,
  },
  {
    path: "",
    component: LandingPageComponent,
    canActivate: [HealthGuard, MaintenanceGuard],
  },
  {
    path: "test",
    component: TestComponent,
    canActivate: [HealthGuard, MaintenanceGuard],
  },
  {
    // No HealthGuard here – this is the SiteMinder/BCeID auth-callback
    // landing route. Blocking it during an outage prevents the session
    // handshake from completing and causes a redirect loop to /outage.
    path: "login",
    component: LoginPageComponent,
  },
  {
    path: "authenticated",
    canActivate: [HealthGuard, MaintenanceGuard, AuthenticationGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        component: DashboardComponent,
      },
      {
        path: "budget_proposal/:taskId",
        component: BudgetProposalComponent,
      },
      {
        path: "expense_report/:taskId",
        component: ExpenseReportComponent,
      },
      {
        path: "program_application/:taskId",
        component: ProgramApplicationComponent,
      },
      {
        path: "cap_program_application/:taskId",
        component: CAPApplicationComponent,
      },
      {
        path: "program_surplus/:surplusId",
        component: ProgramSurplusComponent,
      },
      {
        path: "surplus_report/:surplusId",
        component: SurplusReportComponent,
      },
      {
        path: "status_report/:taskId",
        component: StatusReportComponent,
      },
      {
        path: "completed_status_report/:dataCollectionId",
        component: CompletedStatusReportComponent,
      },
      {
        path: "upload_document/:contractId",
        component: UploadDocumentComponent,
      },
      {
        path: "upload_document",
        component: UploadDocumentComponent,
      },
      {
        path: "sign_contract/:taskId",
        component: SignContractComponent,
        data: { formType: "sign_contract" },
      },
      {
        path: "sign_mod_agreement/:taskId",
        component: SignContractComponent,
        data: { formType: "sign_mod_agreement" },
      },
      {
        path: "cover_letter/:taskId",
        component: CoverLetterComponent,
      },
      {
        path: "profile/:taskId",
        redirectTo: "profile",
      },
      {
        path: "profile",
        component: ProfileComponent,
      },
      {
        path: "message_read",
        component: MessageReadComponent,
      },
      {
        path: "message_write",
        component: MessageWriteComponent,
      },
      {
        path: "personnel",
        component: PersonnelComponent,
      },
      {
        path: "new_user",
        component: NewUserComponent,
      },
      {
        path: "new_user_new_organization",
        component: NewUserNewOrganizationComponent,
      },
      {
        path: "program/:contractId/:programId",
        component: ProgramContactComponent,
      },
    ],
  },
  {
    path: "**",
    component: NotFoundComponent,
    canActivate: [HealthGuard, MaintenanceGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
