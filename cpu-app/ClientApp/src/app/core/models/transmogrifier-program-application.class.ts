import { iSignature } from "../../authenticated/subforms/program-authorizer/program-authorizer.component";
import {
  ContactDto,
  ProgramApplicationDto,
  ServiceAreaDto,
} from "../api/models";
import { boolOptionSet } from "../constants/bool-optionset-values";
import { decodeCcseaMemberType } from "../constants/decode-ccsea-member-type";
import { decodeCglInsurance } from "../constants/decode-cgl-insurance-type";
import { decodeToWeekDays } from "../constants/decode-to-week-days";
import { employmentStatusTypeDict } from "../constants/employment-status-types";
import { iAdministrativeInformation } from "./administrative-information.interface";
import { iContactInformation } from "./contact-information.interface";
import { makeViewTimeString } from "./converters/hours-to-dynamics";
import { iHours } from "./hours.interface";
import { Person } from "./person.class";
import { iPerson } from "./person.interface";
import { iProgramApplication } from "./program-application.interface";

export class TransmogrifierProgramApplication {
  accountId: string; // this is the dynamics account
  administrativeInformation: iAdministrativeInformation;
  cglInsurance: string; // commercial general liability insurance detail string picked from options.
  contactInformation: iContactInformation;
  contractId: string;
  contractName: string;
  contractNumber: string;
  organizationId: string;
  organizationName: string;
  programApplications: iProgramApplication[];
  signature: iSignature;
  userId: string;

  constructor(g: ProgramApplicationDto) {
    this.accountId = g.organization.accountId;
    this.contractId = g.contract.vsd_ContractId;
    this.contractName = g.contract.vsd_Name;
    this.contractNumber = g.contract.vsd_Name;
    this.organizationId = g.businessbceid;
    this.organizationName = g.organization.name;
    this.userId = g.userbceid;
    this.administrativeInformation = this.buildAdministrativeInformation(g);
    this.cglInsurance = decodeCglInsurance(g.contract.vsd_Cpu_InsuranceOptions);
    this.contactInformation = this.buildContactInformation(g);
    this.programApplications = this.buildProgramApplications(g);
    this.signature = this.buildSignature(g);
  }
  private buildSignature(b: ProgramApplicationDto): iSignature {
    return {
      signer: undefined,
      signature: "",
      signatureDate: undefined,
      termsConfirmation: false,
    };
  }
  private buildAdministrativeInformation(
    b: ProgramApplicationDto,
  ): iAdministrativeInformation {
    return {
      ccseaMemberType: decodeCcseaMemberType(b.contract.vsd_Cpu_MemberOfCssea),
      compliantEmploymentStandardsAct: b.contract.vsd_Cpu_HumanResourcePolices
        ? b.contract.vsd_Cpu_HumanResourcePolices.includes(100000000)
        : false,
      compliantHumanRights: b.contract.vsd_Cpu_HumanResourcePolices
        ? b.contract.vsd_Cpu_HumanResourcePolices.includes(100000001)
        : false,
      compliantWorkersCompensation: b.contract.vsd_Cpu_HumanResourcePolices
        ? b.contract.vsd_Cpu_HumanResourcePolices.includes(100000002)
        : false,
      awareOfCriminalRecordCheckRequirement: false,
      staffSubcontractedPersons:
        b.staffCollection.map((s: ContactDto): iPerson => {
          return {
            email: s.emailAddress1 || null,
            fax: s.fax || null,
            firstName: s.firstName || null,
            lastName: s.lastName || null,
            middleName: s.middleName || null,
            personId: s.contactId || null,
            phone: s.mobilePhone || null,
            title: s.jobTitle || null,
            userId: s.vsd_BceId || null,
            address: {
              city: s.address1City || null,
              country: s.address1Country || "Canada",
              line1: s.address1Line1 || null,
              line2: s.address1Line2 || null,
              postalCode: s.address1PostalCode || null,
              province: s.address1StateOrProvince || null,
            },
          };
        }) || [],
      staffUnion: b.contract.vsd_Cpu_SpecificUnion,
      staffSubcontracted:
        b.contract.vsd_Cpu_SubcontractedProgramStaff != null
          ? b.contract.vsd_Cpu_SubcontractedProgramStaff ===
            boolOptionSet.isTrue
          : null,
      staffUnionized:
        b.contract.vsd_Cpu_UnionizedStaff != null
          ? b.contract.vsd_Cpu_UnionizedStaff === boolOptionSet.isTrue
          : null,
    };
  }
  private buildContactInformation(
    b: ProgramApplicationDto,
  ): iContactInformation {
    const c: iContactInformation = {
      emailAddress: b.organization.emailAddress1 || null,
      faxNumber: b.organization.fax || null,
      phoneNumber: b.organization.telephone1 || null,
      mainAddress: {
        city: b.organization.address1City || null,
        country: b.organization.address1Country || "Canada",
        line1: b.organization.address1Line1 || null,
        line2: b.organization.address1Line2 || null,
        postalCode: b.organization.address1PostalCode || null,
        province: b.organization.address1StateOrProvince || null,
      },
      mailingAddress: {
        city: b.organization.address2City || null,
        country: b.organization.address2Country || "Canada",
        line1: b.organization.address2Line1 || null,
        line2: b.organization.address2Line2 || null,
        postalCode: b.organization.address2PostalCode || null,
        province: b.organization.address2StateOrProvince || null,
      },
      // if any of the properties besides the country is not null then they have a mailing address (API limitation)
      hasMailingAddress: !!(
        b.organization.address2City ||
        b.organization.address2Line1 ||
        b.organization.address2Line2 ||
        b.organization.address2StateOrProvince ||
        b.organization.address2PostalCode
      ),
    };

    c.mailingAddressSameAsMainAddress =
      JSON.stringify(c.mainAddress) === JSON.stringify(c.mailingAddress);
    if (c.mailingAddressSameAsMainAddress) c.mailingAddress = c.mainAddress;
    // when the board contact and the executive contact are the same person then we simply don't fill in executive contact information and set the flag to false
    if (
      b.boardContact &&
      b.contract.vsd_ContactLookup1IdValue !==
        b.contract.vsd_ContactLookup2IdValue
    ) {
      c.boardContact = {
        userId: b.boardContact.contactId || null,
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
          country: b.boardContact.address1Country || "Canada",
          line1: b.boardContact.address1Line1 || null,
          line2: b.boardContact.address1Line2 || null,
          postalCode: b.boardContact.address1PostalCode || null,
          province: b.boardContact.address1StateOrProvince || null,
        },
      };
    }
    // the board contact's existence determines whether or not this flag is true or false.
    c.hasBoardContact = !!c.boardContact;

    if (b.executiveContact)
      c.executiveContact = {
        userId: b.executiveContact.contactId || null,
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
          country: b.executiveContact.address1Country || "Canada",
          line1: b.executiveContact.address1Line1 || null,
          line2: b.executiveContact.address1Line2 || null,
          postalCode: b.executiveContact.address1PostalCode || null,
          province: b.executiveContact.address1StateOrProvince || null,
        },
      };
    return c;
  }
  private buildProgramApplications(
    g: ProgramApplicationDto,
  ): iProgramApplication[] {
    const applications: iProgramApplication[] = [];
    for (let p of g.programCollection) {
      let temp: iProgramApplication = {
        contractId: p.vsd_ContractIdValue,
        emailAddress:
          p.vsd_EmailAddress || g.organization.emailAddress1 || null, // fallback to organization email address
        faxNumber: p.vsd_Fax,
        formState: "untouched",
        name: p.vsd_Name,
        phoneNumber: p.vsd_PhoneNumber,
        programId: p.vsd_ProgramId,
        governmentFunder: p.vsd_GovernmentFunderAgency,
        estimatedContractValue: p.vsd_Cpu_EstimatedSubtotalComponentValue,
        estimatedContractValueMask: p.vsd_Cpu_EstimatedSubtotalComponentValue
          ? p.vsd_Cpu_EstimatedSubtotalComponentValue.toFixed(2)
          : "",
        isTransitionHouse: p.vsd_AddressTransitionOrSafeHome,
        mainAddress: {
          line1: p.vsd_AddressLine1 || null,
          line2: p.vsd_AddressLine2 || null,
          city: p.vsd_City || null,
          postalCode: p.vsd_PostalCodeZip || null,
          province: p.vsd_ProvinceState || null,
          country: p.vsd_Country || "Canada",
        },
        mailingAddress: {
          city: p.vsd_MailingCity || null,
          line1: p.vsd_MailingAddressLine1 || null,
          line2: p.vsd_MailingAddressLine2 || null,
          postalCode: p.vsd_MailingPostalCodeZip || null,
          province: p.vsd_MailingProvinceState || null,
          country: p.vsd_MailingCountry || "Canada",
        },
        serviceAreas: g.serviceAreaCollection
          .filter(
            (sa: ServiceAreaDto): boolean =>
              p.vsd_ProgramId === sa.vsd_ProgramId,
          )
          .map(
            (sa) =>
              g.regionDistrictCollection.find(
                (r) => r.vsd_RegionDistrictId === sa.vsd_RegionDistrictId,
              ).vsd_Name,
          ),
        programContact:
          g.staffCollection
            .filter(
              (c: ContactDto): boolean =>
                p.vsd_ContactLookupValue === c.contactId,
            )
            .map((s) => this.makePerson(g, s.contactId))[0] || null,

        policeContact:
          g.staffCollection
            .filter(
              (c: ContactDto): boolean =>
                p.vsd_ContactLookup2Value === c.contactId,
            )
            .map((s) => this.makePerson(g, s.contactId))[0] || new Person(),

        sharedCostContact:
          g.staffCollection
            .filter(
              (c: ContactDto): boolean =>
                p.vsd_ContactLookup3Value === c.contactId,
            )
            .map((s) => this.makePerson(g, s.contactId))[0] || new Person(),

        hasSharedCostContact: p.vsd_CostShare || false,
        hasSubContractedStaff: p.vsd_Cpu_ProgramStaffSubcontracted || false,
        // revenueSources: [],//iRevenueSource[];
        additionalStaff:
          g.programContactCollection
            .filter((c) => c.vsd_ProgramId === p.vsd_ProgramId)
            .map((s) => this.makePerson(g, s.contactId)) || null, // iPerson[];
        subContractedStaff:
          g.programSubcontractorCollection
            .filter((c) => c.vsd_ProgramId === p.vsd_ProgramId)
            .map((s) => this.makePerson(g, s.contactId)) || null, // iPerson[];
        operationHours: [],
        standbyHours: [],
        numberOfHours: p.vsd_Cpu_NumberOfHours || 0,
        scheduledHours: p.vsd_TotalScheduledHours || 0,
        onCallHours: p.vsd_TotalOnCallStandbyHours || 0,
        perType: p.vsd_Cpu_Per || 100000000,
        removedStaff: [],
        removedSubContractedStaff: [],
        currentTab: "Program Information", //make this more general - set to tabs[0] instead of hardcoded
      } as iProgramApplication;

      if (
        JSON.stringify(temp.mailingAddress) === JSON.stringify(temp.mainAddress)
      ) {
        temp.mailingAddressSameAsMainAddress = true;
        temp.mailingAddress = temp.mainAddress;
      }

      if (
        JSON.stringify(temp.policeContact.address) ===
        JSON.stringify(this.contactInformation.mainAddress)
      ) {
        temp.policeContact.addressSameAsAgency = true;
      }

      if (
        JSON.stringify(temp.sharedCostContact.address) ===
        JSON.stringify(this.contactInformation.mainAddress)
      ) {
        temp.sharedCostContact.addressSameAsAgency = true;
      }

      let programType = g.programTypeCollection.find(
        (pt) => pt.vsd_ProgramTypeId === p.vsd_ProgramTypeValue,
      );
      temp.isPoliceBased = programType
        ? programType.vsd_ProgramCategory === 100000000
        : false;
      temp.assignmentArea =
        g.regionDistrictCollection
          .filter(
            (x) => p.vsd_Cpu_RegionDistrictValue === x.vsd_RegionDistrictId,
          )
          .map((a) => a.vsd_Name)[0] || "Unknown";
      temp.programLocation = p.vsd_Cpu_Program_Location;
      temp.hasPoliceContact =
        temp.policeContact &&
        temp.policeContact.personId &&
        temp.policeContact.firstName &&
        temp.policeContact.lastName
          ? true
          : false;
      // temp.hasSharedCostContact = temp.sharedCostContact ? true : false;
      temp.programTypeName = programType ? programType.vsd_Name || "" : "";

      if (!temp.policeContact) temp.policeContact = new Person();
      // if (!temp.hasSharedCostContact) temp.sharedCostContact = new Person();

      // add operation and standby hours
      for (let sched of g.scheduleCollection) {
        // if the schedule matches this program collect it.
        if (sched.vsd_ProgramIdValue === p.vsd_ProgramId) {
          // split the times into something that we can turn into moment
          const hours: iHours = {
            //save the hours into moment format.
            open: makeViewTimeString(sched.vsd_ScheduledStartTime),
            isAMOpen: sched.vsd_ScheduledStartTime.includes("am"),
            openMask: makeViewTimeString(sched.vsd_ScheduledStartTime),
            closed: makeViewTimeString(sched.vsd_ScheduledEndTime),
            isAMClosed: sched.vsd_ScheduledEndTime.includes("am"),
            closedMask: makeViewTimeString(sched.vsd_ScheduledEndTime),
            // save the identifier for the post back to dynamics
            hoursId: sched.vsd_ScheduleId,
            // convert the nasty comma seperated string version to useful week day boolean
            ...decodeToWeekDays(sched.vsd_Days),
            isActive: true,
          };
          // check for which collection of hours this is
          if (sched.vsd_Cpu_ScheduleType === 100000000) {
            // The type is active hours
            temp.operationHours.push(hours);
          } else if (sched.vsd_Cpu_ScheduleType === 100000001) {
            // the type is standby hours
            temp.standbyHours.push(hours);
          }
        }
      }
      // add to the collection of program applications
      applications.push(temp);
    }
    return applications;
  }
  private makePerson(g: ProgramApplicationDto, personId: string): iPerson {
    // return whole person
    return g.staffCollection
      .filter((p: ContactDto) => p.contactId === personId)
      .map((p: ContactDto): iPerson => {
        return {
          email: p.emailAddress1 || null,
          fax: p.fax || null,
          firstName: p.firstName || null,
          lastName: p.lastName || null,
          middleName: p.middleName || null,
          personId: p.contactId || null,
          phone: p.mobilePhone || null,
          phoneExtension: p.vsd_MainPhoneExtension || null,
          phone2: p.telephone2 || null,
          phone2Extension: p.vsd_HomePhoneExtension || null,
          title: p.jobTitle || null,
          userId: p.vsd_BceId || null,
          employmentStatus:
            employmentStatusTypeDict[p.vsd_EmploymentStatus] || null,
          address: {
            line1: p.address1Line1 || null,
            line2: p.address1Line2 || null,
            city: p.address1City || null,
            postalCode: p.address1PostalCode || null,
            province: p.address1StateOrProvince || null,
            country: p.address1Country || "Canada",
          },
        };
      })[0];
  }
}
