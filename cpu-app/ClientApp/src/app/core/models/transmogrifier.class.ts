import * as _ from "lodash";
import moment from "moment";
import { CpuOrgContractsDto, TaskDto } from "../api/models";
import { contractStatus } from "../constants/contract-code";
import { decodeTaskType } from "../constants/decode-task-type";
import { employmentStatusTypeDict } from "../constants/employment-status-types";
import { nameAssemble } from "../constants/name-assemble";
import { PAYMENT_QUARTERS } from "../constants/reporting-period";
import { taskCode } from "../constants/task-code";
import { iContactInformation } from "./contact-information.interface";
import { iContract } from "./contract.interface";
import { iMessage } from "./message.interface";
import { iMinistryUser } from "./ministry-user.interface";
import {
  iPaymentStatus,
  PaymentStatusDisplay,
} from "./payment-status.interface";
import { iPerson } from "./person.interface";
import { iProgram } from "./program.interface";
import { iTask } from "./task.interface";
import { Roles } from "./user-settings.interface";

export class Transmogrifier {
  public accountId: string; // this is the ID to identify an organization in dynamics. NOT A BCEID
  public contactInformation: iContactInformation;
  public contracts: iContract[];
  public ministryContact: iMinistryUser;
  public organizationId: string;
  public organizationName: string;
  public persons: iPerson[];
  public role: Roles;
  public userId: string;

  private ROLES_LOOKUP = [
    {
      vsd_name: "Program Staff Role",
      vsd_portalroleid: "286d3bd0-22e6-e911-b811-00505683fbf4",
      role: Roles.ProgramStaff,
    },
    {
      vsd_name: "Board Contact Role",
      vsd_portalroleid: "71a24e72-b7f3-ea11-b81d-00505683fbf4",
      role: Roles.BoardContact,
    },
    {
      vsd_name: "Executive Contact Role",
      vsd_portalroleid: "89b84866-b7f3-ea11-b81d-00505683fbf4",
      role: Roles.ExecutiveContact,
    },
  ];

  constructor(b: CpuOrgContractsDto) {
    this.accountId = b.organization.accountId || null; // the dynamics id must be included when posting back sometimes.
    this.contracts = [];
    this.organizationId = b.businessbceid || null;
    this.organizationName = b.organization.name || null;
    this.userId = b.userbceid || null;
    this.contactInformation = this.buildContactInformation(b);
    this.persons = this.buildPersons(b);
    this.ministryContact = this.buildMinistryContact(b);
    this.contracts = this.buildContracts(b);
    this.role = Roles.ProgramStaff;
    for (let i = 0; i < b.portalRoles.length; ++i) {
      let thisRole = this.ROLES_LOOKUP.find(
        (r) => r.vsd_portalroleid === b.portalRoles[i].vsd_PortalRoleId,
      );
      if (thisRole) {
        let roleLevel = thisRole.role;
        if (roleLevel > this.role) this.role = roleLevel;
      }
    }
  }
  private buildTasks(b: CpuOrgContractsDto, contractId: string): iTask[] {
    const tasks: iTask[] = [];
    for (let task of b.tasks) {
      if (task.regardingObjectIdValue === contractId) {
        let thisTask: iTask = {
          status: taskCode(task.statusCode),
          isCompleted: this.isCompleted(task.stateCode),
          taskName: decodeTaskType(task.vsd_TaskTypeIdValue, true),
          taskTitle: task.subject,
          taskDescription: task.description,
          deadline: task.scheduledEnd ? new Date(task.scheduledEnd) : null,
          submittedDate: task.modifiedOn ? new Date(task.modifiedOn) : null,
          taskId: this.getCorrectTaskIdByDiscriminator(
            contractId,
            task.vsd_ProgramIdValue,
            task,
            decodeTaskType(task.vsd_TaskTypeIdValue),
          ),
          formType: decodeTaskType(task.vsd_TaskTypeIdValue),
        };

        if (
          task.vsd_ProgramIdValue &&
          (thisTask.formType === "expense_report" ||
            thisTask.formType === "status_report")
        ) {
          let programInfo = b.programs.find(
            (p) => p.vsd_ProgramId === task.vsd_ProgramIdValue,
          );
          if (programInfo) {
            thisTask.taskName += " (" + programInfo.vsd_Name + ")";
          }
        }
        tasks.push(thisTask);
      }
    }
    return tasks;
  }

  private buildMessages(b: CpuOrgContractsDto, contractId: string): iMessage[] {
    const messages: iMessage[] = [];
    for (let message of b.messages) {
      if (message.regardingObjectId === contractId) {
        messages.push({
          timeStamp: null,
          from: null,
          to: null,
          direction: null,
          regardingObjectId: null,
          program: message.vsd_Program,
          cpuRegionDistrict: message.vsd_Cpu_RegionDistrict,
          subject: null,
          description: message.description,
        });
      }
    }
    return messages;
  }

  private getCorrectTaskIdByDiscriminator(
    contractId: string,
    programId: string,
    t: TaskDto,
    discriminator: string,
  ): string {
    // sometimes we look up by a scheduleG ID, sometimes by a contractId, sometimes by a programId. :-(
    if (discriminator === "budget_proposal") {
      return contractId;
    }
    if (discriminator === "expense_report") {
      return t.vsd_ScheduleGIdValue;
    }
    if (
      discriminator === "status_report" ||
      discriminator === "sign_contract" ||
      discriminator === "sign_mod_agreement"
    ) {
      return t.activityId;
    }
    if (
      discriminator === "program_application" ||
      discriminator === "cap_program_application"
    ) {
      return contractId;
    }
    if (discriminator === "download_document") {
      return contractId;
    }
    if (discriminator === "cover_letter") {
      return contractId;
    }
    if (
      discriminator === "program_surplus" ||
      discriminator === "surplus_report"
    ) {
      return t.vsd_SurplusPlanIdValue;
    }
    return contractId;
  }
  private buildPrograms(b: CpuOrgContractsDto, contractId: string): iProgram[] {
    const programs: iProgram[] = [];
    for (let program of b.programs) {
      if (program.vsd_ContractIdValue === contractId) {
        let programContact = b.staff.find(
          (s) => s.contactId === program.vsd_ContactLookupValue,
        );
        programs.push({
          // build an address
          address: {
            city: program.vsd_City,
            line1: program.vsd_AddressLine1,
            line2: program.vsd_AddressLine2,
            postalCode: program.vsd_City,
            province: program.vsd_ProvinceState,
          },
          email: program.vsd_EmailAddress,
          fax: program.vsd_Fax,
          // build an address
          mailingAddress: {
            city: program.vsd_MailingCity,
            line1: program.vsd_MailingAddressLine1,
            line2: program.vsd_MailingAddressLine2,
            postalCode: program.vsd_MailingCity,
            province: program.vsd_MailingProvinceState,
          },
          phone: program.vsd_PhoneNumber,
          programId: program.vsd_ProgramId,
          programName: program.vsd_Name,
          contactName: programContact
            ? nameAssemble(
                programContact.firstName,
                programContact.middleName,
                programContact.lastName,
              )
            : "",
          contactTitle: programContact ? programContact.jobTitle : "",
          paymentsStatus: this.buildPaymentsStatus(b, program.vsd_ProgramId),
        });
      }
    }
    return programs;
  }
  private buildPaymentsStatus(
    b: CpuOrgContractsDto,
    programId: string,
  ): iPaymentStatus {
    let paymentStatus: iPaymentStatus = {
      Q1: "Pending",
      Q2: "Pending",
      Q3: "Pending",
      Q4: "Pending",
      oneTime: "Pending",
    };

    b.invoices
      .filter((inv) => inv.vsd_ProgramIdValue === programId)
      .forEach((inv) => {
        let thisQuarter = this.findQuarter(inv.vsd_Cpu_ScheduledPaymentDate);
        paymentStatus[thisQuarter] = PaymentStatusDisplay[inv.statusCode];
      });

    return paymentStatus;
  }
  private findQuarter(date): string {
    let thisDate = moment(date);
    let quarter = PAYMENT_QUARTERS.find(
      (q) => q.month == thisDate.month() && q.day == thisDate.date(),
    );
    if (quarter) return quarter.quarter;
    return "oneTime";
  }
  private isCompleted(code: number): boolean {
    if (code === 1 || code === 2) {
      return true; // 1 = completed, 2 = cancelled
    } else {
      return false; // this is not completed
    }
  }
  private buildContracts(b: CpuOrgContractsDto): iContract[] {
    const contracts: iContract[] = [];
    if (b.contracts.length > 0) {
      for (let contract of b.contracts) {
        contracts.push({
          fiscalYearStart: contract.vsd_FiscalStartDate
            ? new Date(contract.vsd_FiscalStartDate).getFullYear()
            : 0,
          contractId: contract.vsd_ContractId,
          contractNumber: contract.vsd_Name,
          programs: this.buildPrograms(b, contract.vsd_ContractId),
          status: contractStatus[contract.statusCode] || "No Status",
          tasks:
            this.buildTasks(b, contract.vsd_ContractId).filter(
              (t) => !t.isCompleted,
            ) || [],
          completedTasks:
            this.buildTasks(b, contract.vsd_ContractId).filter(
              (t) => t.isCompleted,
            ) || [],
        });
      }
    }
    return contracts;
  }
  private buildMinistryContact(b: CpuOrgContractsDto): iMinistryUser {
    let mc = {
      firstName: b.ministryUser.firstName,
      lastName: b.ministryUser.lastName,
      email: b.ministryUser.internalEmailAddress,
      phone: b.ministryUser.address1_Telephone1,
    };
    mc.phone = mc.phone ? mc.phone.replace(/[\s()-]/g, "") : "";
    return mc;
  }
  private buildContactInformation(b: CpuOrgContractsDto): iContactInformation {
    // collect the organization meta and structure it into a new shape
    const ci: iContactInformation = {
      phoneNumber: b.organization.telephone1 || null,
      emailAddress: b.organization.emailAddress1 || null,
      faxNumber: b.organization.fax || null,
      mainAddress: {
        city: b.organization.address1City || null,
        line1: b.organization.address1Line1 || null,
        line2: b.organization.address1Line2 || null,
        postalCode: b.organization.address1PostalCode || null,
        province: b.organization.address1StateOrProvince || null,
        country: "Canada",
      },
    } as iContactInformation;

    // if there are any values in the returned data for the
    if (
      b.organization &&
      (b.organization.address2City ||
        b.organization.address2Line1 ||
        b.organization.address2Line2 ||
        b.organization.address2PostalCode ||
        b.organization.address2StateOrProvince)
    ) {
      ci.mailingAddress = {
        city: b.organization.address2City || null,
        line1: b.organization.address2Line1 || null,
        line2: b.organization.address2Line2 || null,
        postalCode: b.organization.address2PostalCode || null,
        province: b.organization.address2StateOrProvince || null,
        country: "Canada",
      };
      // ci.mailingAddressSameAsMainAddress = true;
    } else {
      ci.mailingAddress = {
        city: null,
        line1: null,
        line2: null,
        postalCode: null,
        province: null,
        country: "Canada",
      };
      // ci.hasMailingAddress = false;
    }
    ci.mailingAddressSameAsMainAddress = _.isEqual(
      ci.mainAddress,
      ci.mailingAddress,
    );
    if (ci.mailingAddressSameAsMainAddress) ci.mailingAddress = ci.mainAddress;

    if (b.organization.executiveContactIdValue)
      if (b.executiveContact)
        ci.executiveContact = {
          email: b.executiveContact.emailAddress1 || null,
          fax: b.executiveContact.fax || null,
          firstName: b.executiveContact.firstName || null,
          lastName: b.executiveContact.lastName || null,
          middleName: b.executiveContact.middleName || null,
          personId: b.executiveContact.contactId || null,
          phone: b.executiveContact.mobilePhone || null,
          title: b.executiveContact.jobTitle || null,
          address: {
            city: b.executiveContact.address1City || null,
            line1: b.executiveContact.address1Line1 || null,
            line2: b.executiveContact.address1Line2 || null,
            postalCode: b.executiveContact.address1PostalCode || null,
            province: b.executiveContact.address1StateOrProvince || null,
          },
        };

    // if there is a contact bound to this organization
    if (b.organization.boardContactIdValue) {
      ci.boardContact = {
        email: b.boardContact.emailAddress1 || null,
        fax: b.boardContact.fax || null,
        firstName: b.boardContact.firstName || null,
        lastName: b.boardContact.lastName || null,
        middleName: b.boardContact.middleName || null,
        personId: b.boardContact.contactId || null,
        phone: b.boardContact.mobilePhone || null,
        title: b.boardContact.jobTitle || null,
        address: {
          city: b.boardContact.address1City || null,
          line1: b.boardContact.address1Line1 || null,
          line2: b.boardContact.address1Line2 || null,
          postalCode: b.boardContact.address1PostalCode || null,
          province: b.boardContact.address1StateOrProvince || null,
        },
      };
      // save that this exists
      ci.hasBoardContact = true;
    } else {
      ci.hasBoardContact = false;
    }
    return ci;
  }
  private buildPersons(b: CpuOrgContractsDto): iPerson[] {
    const personList: iPerson[] = [];
    for (let p of b.staff) {
      const person: iPerson = {
        address: {
          city: p.address1City || null,
          line1: p.address1Line1 || null,
          line2: p.address1Line2 || null,
          postalCode: p.address1PostalCode || null,
          province: p.address1StateOrProvince || null,
          country: this.contactInformation.mainAddress.country || null,
        },
        email: p.emailAddress1 || null,
        fax: p.fax || null,
        firstName: p.firstName || null,
        lastName: p.lastName || null,
        middleName: p.middleName || null,
        personId: p.contactId || null,
        userId: p.vsd_BceId || null,
        phone: p.mobilePhone || null,
        phoneExtension: p.vsd_MainPhoneExtension || null,
        phone2: p.telephone2 || null,
        phone2Extension: p.vsd_HomePhoneExtension || null,
        title: p.jobTitle || null,
        employmentStatus:
          employmentStatusTypeDict[p.vsd_EmploymentStatus] || null,
        // if this person has the right value it is me.
        me: p.vsd_BceId ? true : false,
        // if the state code is zero or null the user is active
        deactivated: !p.stateCode || p.stateCode === 0 ? false : true || null,
      };
      if (_.isEqual(person.address, this.contactInformation.mainAddress)) {
        person.addressSameAsAgency = true;
      }
      personList.push(person);
    }
    return personList.sort((a: iPerson, b: iPerson) => {
      // same last name? sort by first name
      if (a.lastName === b.lastName) {
        // same first name? sort by middle name
        if (a.firstName === b.firstName) {
          // same middle name? just give up.
          if (a.middleName === b.middleName) {
            return 0;
          }
          // sort by middle name
          if (a.middleName < b.middleName) {
            return -1;
          }
          if (a.middleName > a.middleName) {
            return 1;
          }
        }
        // sort by first name
        if (a.firstName < b.firstName) {
          return -1;
        }
        if (a.firstName > b.firstName) {
          return 1;
        }
      }
      // sort by last name
      if (a.lastName < b.lastName) {
        return -1;
      }
      if (a.lastName > b.lastName) {
        return 1;
      }
      // if there is an edge case return 0 so nothing breaks.
      return 0;
    });
  }
}
