import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import moment from "moment";
import { Subscription } from "rxjs";
import {
  DocumentItemDto,
  MonthlyStatisticsDto,
} from "../../../core/api/models";
import { FileService } from "../../../core/api/services/file/file.service";
import { StatusReportService } from "../../../core/api/services/status-report/status-report.service";
import { formTypes } from "../../../core/constants/form-types";
import { months } from "../../../core/constants/month-codes";
import { TaskStatus } from "../../../core/constants/task-status";
import { iContract } from "../../../core/models/contract.interface";
import { CRMPaymentStatusCode } from "../../../core/models/payment-status.interface";
import { iTask } from "../../../core/models/task.interface";
import { Transmogrifier } from "../../../core/models/transmogrifier.class";
import { Roles } from "../../../core/models/user-settings.interface";
import { NotificationQueueService } from "../../../core/services/notification-queue.service";
import { StateService } from "../../../core/services/state.service";

enum StatusReasons {
  Received = 1,
  Processing = 100000000,
  Approved = 100000001,
  Information_Denied = 100000002,
}

@Component({
  selector: "app-task-list",
  templateUrl: "./task-list.component.html",
  styleUrls: ["./task-list.component.css"],
  standalone: false,
})
export class TaskListComponent implements OnInit, OnDestroy {
  @Input() contract: iContract;
  trans: Transmogrifier;

  tabs: any;
  currentTab: string;

  statuses: string[];
  formTypes: string[];

  didLoadStats: boolean = false;
  loadingStats: boolean = false;
  completedStats: MonthlyStatisticsDto;
  dataCollection: any[] = [];

  didLoadDocuments: boolean = false;
  documentCollection: DocumentItemDto[] = [];
  private stateSubscription: Subscription;
  loadingDocuments: boolean = false;
  downloadingDocument: boolean = false;

  organizationId: string;
  userId: string;
  today = moment().endOf("day");

  StatusReasons = StatusReasons;
  PaymentStatusCode = CRMPaymentStatusCode;

  userRole = Roles.ProgramStaff;
  Roles = Roles;

  isDropdownOpen = false;

  constructor(
    private stateService: StateService,
    private statusReportService: StatusReportService,
    private notificationQueueService: NotificationQueueService,
    public fileService: FileService,
  ) {
    this.tabs = {
      tasksDue: "Tasks Due",
      tasksCompleted: "Completed Tasks",
      completedStats: "Completed Monthly Reports",
      editProgramInformation: "Update Program/Contact Information",
      yourDocuments: "Your Documents",
      messages: "Messages",
    };
    this.currentTab = this.tabs.tasksDue;
    this.statuses = TaskStatus;
    this.formTypes = formTypes;
  }

  ngOnInit() {
    let userSettings = this.stateService.userSettings.getValue();
    this.userRole = userSettings.userRole;
    this.stateSubscription = this.stateService.main.subscribe(
      (m: Transmogrifier) => {
        this.trans = m;
        this.organizationId = this.stateService.main.getValue().organizationId;
        this.userId = this.stateService.main.getValue().userId;
      },
    );

    this.contract.tasks.forEach((task: iTask) => {
      task.isOverDue = this.today.isAfter(moment(task.deadline));
    });
  }
  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }

  setCurrentTab(tab: any) {
    this.currentTab = tab;
  }

  getCompletedMonthlyStats(contractId: string) {
    if (this.didLoadStats) {
      return;
    }

    // console.log("getting monthly stats");
    this.loadingStats = true;

    this.statusReportService
      .getApiStatusReportMonthlyStatsBusinessBceidUserBceidContractId(
        this.organizationId,
        this.userId,
        contractId,
      )
      .subscribe((res: MonthlyStatisticsDto) => {
        this.loadingStats = false;
        this.didLoadStats = true;
        if (!res.isSuccess) {
          this.notificationQueueService.addNotification(
            "There was an issue loading Monthly Stats information. If this problem is persisting please contact your ministry representative.",
            "danger",
          );
        } else {
          // console.log("Monthly Stats:");
          // console.log(res);
          this.completedStats = res;
          this.dataCollection = this.completedStats.dataCollection ?? [];
          for (let data of this.dataCollection) {
            data.reportingPeriod = Object.keys(months).find(
              (key) => months[key] === data.vsd_reportingperiod,
            );
            let program = (this.completedStats.programCollection ?? []).find(
              (p) => p.vsd_programid == data._vsd_program_value,
            );
            data.program_name =
              program && program.vsd_name ? program.vsd_name : "";
          }
          //console.log(this.dataCollection);
        }
      });
  }

  download(doc: DocumentItemDto) {
    if (this.downloadingDocument) return;
    this.downloadingDocument = true;
    this.fileService
      .getApiFileBusinessBceidUserBceidDocumentDocId(
        this.organizationId,
        this.userId,
        doc.activitymimeattachmentid,
      )
      .subscribe((d) => {
        this.downloadingDocument = false;
        if (!d.isSuccess) {
          this.notificationQueueService.addNotification(
            "There has been a data problem retrieving this file. Please let your ministry contact know that you have seen this error.",
            "danger",
          );
        } else {
          let downloadLink = document.createElement("a");
          downloadLink.href = "data:application/octet-stream;base64," + d.body;
          downloadLink.download = d.fileName;

          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      });
  }

  getContractDocuments(contractId: string) {
    if (this.didLoadDocuments) {
      return;
    }
    this.loadingDocuments = true;
    this.fileService
      .getApiFileBusinessBceidUserBceidDocumentsContractContractId(
        this.trans.organizationId,
        this.trans.userId,
        contractId,
      )
      .subscribe((d) => {
        this.didLoadDocuments = true;
        this.loadingDocuments = false;
        if (!d.isSuccess) {
          this.notificationQueueService.addNotification(
            "There has been a data problem retrieving this file. Please let your ministry contact know that you have seen this error.",
            "danger",
          );
        } else {
          this.documentCollection = (d.documentCollection ?? []).filter(
            (d) => d.filename?.indexOf(".pdf") > 0,
          );
        }
      });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  exportMonthlyStats(
    programId: string,
    contractId: string,
    programName: string,
    contractNumber: string,
  ) {
    const encodedContractNumber = encodeURIComponent(contractNumber);
    const encodedProgramName = encodeURIComponent(programName);
    const requestOptions: any = { responseType: "blob" };

    this.statusReportService
      .getApiStatusReportExportMonthlyReportContractIdProgramIdContractNumberProgramName<Blob>(
        contractId,
        programId,
        encodedContractNumber,
        encodedProgramName,
        requestOptions,
      )
      .subscribe(
        (response: Blob) => {
          if (response == null || response.size === 0) {
            this.notificationQueueService.addNotification(
              "There are no submitted reports for " +
                programName +
                " to export.",
              "danger",
            );
          } else {
            const url = window.URL.createObjectURL(response);
            const a = document.createElement("a");
            a.href = url;
            a.download =
              programName + "(" + contractNumber + ") Monthly Statistics.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            this.notificationQueueService.addNotification(
              "Exporting monthly statisics file for " + programName + ".",
              "success",
            );
          }
        },
        () => {
          this.notificationQueueService.addNotification(
            "Unable to download monthly statistics right now. Please try again later.",
            "danger",
          );
        },
      );
  }
}
