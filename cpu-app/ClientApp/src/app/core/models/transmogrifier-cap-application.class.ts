import { iSignature } from "../../authenticated/subforms/program-authorizer/program-authorizer.component";
import { CAPApplicationDto, ContactDto } from "../api/models";
import { employmentStatusTypeDict } from "../constants/employment-status-types";
import { iCAPProgram } from "./cap-program.interface";
import { iContactInformation } from "./contact-information.interface";
import { iPerson } from "./person.interface";

// Map a numeric Dataverse YesNo option-set value (100000001=yes, 100000000=no) to boolean
function yesNoToBool(value: number | null | undefined): boolean | null {
  if (value === 100000001) return true;
  if (value === 100000000) return false;
  return null;
}

export class TransmogrifierCAPApplication {
  accountId: string; // this is the dynamics account
  applicantInformation: iContactInformation;
  applyingForInsurance: boolean;
  insuranceProvider: string;
  fiscalYear: string;
  contractId: string;
  contractName: string;
  contractNumber: string;
  organizationId: string;
  organizationName: string;
  capPrograms: iCAPProgram[];
  signature: iSignature;
  userId: string;
  collaborationWithKeyStakeholders: boolean;
  complaintProcessForParticipant: boolean;
  criminalRecordChecks: boolean;
  letterOfReference: boolean;
  establishedConfidentialityGuidelines: boolean;

  constructor(g: CAPApplicationDto) {
    const org = g.organization;
    const contract = g.contract;

    this.accountId = org?.accountId ?? "";
    this.contractId = contract?.vsd_ContractId ?? "";
    this.contractName = contract?.vsd_Name ?? "";
    this.contractNumber = contract?.vsd_Name ?? "";
    this.applyingForInsurance = yesNoToBool(contract?.vsd_Cpu_InsuranceOptions);
    this.collaborationWithKeyStakeholders = yesNoToBool(
      contract?.vsd_CollaborationWithKeyStakeholders,
    );
    this.complaintProcessForParticipant = yesNoToBool(
      contract?.vsd_ComplaintAndFeedbackProcessForParticipant,
    );
    this.criminalRecordChecks = contract?.vsd_CriminalRecordChecks ?? false;
    this.letterOfReference = yesNoToBool(
      contract?.vsd_LetterOfReferenceFromReferralSources,
    );
    this.establishedConfidentialityGuidelines = yesNoToBool(
      contract?.vsd_EstablishedConfidentialityGuidelines,
    );
    this.insuranceProvider = "";
    this.organizationId = g.businessbceid ?? "";
    this.organizationName = org?.name ?? "";
    this.userId = g.userbceid ?? "";
    this.fiscalYear = "";
    this.applicantInformation = this.buildApplicantInformation(g);
    this.capPrograms = this.buildPrograms(g);
    this.signature = this.buildSignature();
  }

  private buildSignature(): iSignature {
    return {
      signer: undefined,
      signature: "",
      signatureDate: undefined,
      termsConfirmation: false,
    };
  }

  private buildApplicantInformation(g: CAPApplicationDto): iContactInformation {
    const org = g.organization;
    const contract = g.contract;
    const board = g.boardContact;
    const exec = g.executiveContact;

    const c: iContactInformation = {
      emailAddress: org?.emailAddress1 ?? null,
      faxNumber: org?.fax ?? null,
      phoneNumber: org?.telephone1 ?? null,
      mailingAddress: {
        city: org?.address1City ?? null,
        country: org?.address1Country ?? "Canada",
        line1: org?.address1Line1 ?? null,
        line2: org?.address1Line2 ?? null,
        postalCode: org?.address1PostalCode ?? null,
        province: org?.address1StateOrProvince ?? null,
      },
      mainAddress: {
        city: org?.address2City ?? null,
        country: org?.address2Country ?? "Canada",
        line1: org?.address2Line1 ?? null,
        line2: org?.address2Line2 ?? null,
        postalCode: org?.address2PostalCode ?? null,
        province: org?.address2StateOrProvince ?? null,
      },
      hasMailingAddress: !!(
        org?.address2City ||
        org?.address2Line1 ||
        org?.address2Line2 ||
        org?.address2StateOrProvince ||
        org?.address2PostalCode
      ),
    };

    c.mailingAddressSameAsMainAddress = JSON.stringify(c.mainAddress) === JSON.stringify(c.mailingAddress);
    if (c.mailingAddressSameAsMainAddress) c.mailingAddress = c.mainAddress;

    if (
      board &&
      contract?.vsd_ContactLookup1IdValue !==
        contract?.vsd_ContactLookup2IdValue
    ) {
      c.boardContact = {
        userId: board.contactId ?? null,
        email: board.emailAddress1 ?? null,
        fax: board.fax ?? null,
        firstName: board.firstName ?? null,
        lastName: board.lastName ?? null,
        middleName: board.middleName ?? null,
        personId: board.contactId ?? null,
        phone: board.mobilePhone ?? null,
        title: board.jobTitle ?? null,
        address: {
          city: board.address1City ?? null,
          country: board.address1Country ?? "Canada",
          line1: board.address1Line1 ?? null,
          line2: board.address1Line2 ?? null,
          postalCode: board.address1PostalCode ?? null,
          province: board.address1StateOrProvince ?? null,
        },
      };
    }
    c.hasBoardContact = !!c.boardContact;

    if (exec) {
      c.executiveContact = {
        userId: exec.contactId ?? null,
        email: exec.emailAddress1 ?? null,
        fax: exec.fax ?? null,
        firstName: exec.firstName ?? null,
        lastName: exec.lastName ?? null,
        middleName: exec.middleName ?? null,
        personId: exec.contactId ?? null,
        phone: exec.mobilePhone ?? null,
        title: exec.jobTitle ?? null,
        address: {
          city: exec.address1City ?? null,
          country: exec.address1Country ?? "Canada",
          line1: exec.address1Line1 ?? null,
          line2: exec.address1Line2 ?? null,
          postalCode: exec.address1PostalCode ?? null,
          province: exec.address1StateOrProvince ?? null,
        },
      };
    }
    return c;
  }

  private buildPrograms(g: CAPApplicationDto): iCAPProgram[] {
    const programs: iCAPProgram[] = [];
    const staff = g.staffCollection ?? [];
    const programContacts = g.programContactCollection ?? [];
    const programTypes = g.programTypeCollection ?? [];

    for (const p of g.programCollection ?? []) {
      const programContact =
        staff
          .filter((s) => p.vsd_ContactLookupValue === s.contactId)
          .map((s) => this.makePersonFromContact(s))[0] ?? null;

      const additionalStaff = programContacts
        .filter((pc) => pc.vsd_ProgramId === p.vsd_ProgramId)
        .map((pc) => staff.find((s) => s.contactId === pc.contactId))
        .filter(Boolean)
        .map((s) => this.makePersonFromContact(s));

      const programType = programTypes.find(
        (pt) => pt.vsd_ProgramTypeId === p.vsd_ProgramTypeValue,
      );

      const temp: iCAPProgram = {
        contractId: p.vsd_ContractIdValue,
        formState: "untouched",
        name: p.vsd_Name,
        programId: p.vsd_ProgramId,
        programContact,
        maxAmount: p.vsd_Cpu_EstimatedSubtotalComponentValue,
        maxAmountMask: p.vsd_Cpu_EstimatedSubtotalComponentValue
          ? p.vsd_Cpu_EstimatedSubtotalComponentValue.toFixed(2)
          : "",
        applicationAmount: p.vsd_Cpu_FoundingAmountRequested,
        applicationAmountMask: p.vsd_Cpu_FoundingAmountRequested
          ? p.vsd_Cpu_FoundingAmountRequested.toFixed(2)
          : "",
        typesOfModels: p.vsd_Cpu_ProgramModelTypes ?? "",
        otherModel: null,
        evaluation: null,
        evaluationDescription: null,
        additionalStaff,
        removedStaff: [],
        programLocation: p.vsd_Cpu_Program_Location,
        programTypeName: programType?.vsd_Name ?? "",
        additionalComments: p.vsd_Cpu_CapProgramOperationsComments ?? "",
      } as iCAPProgram;

      programs.push(temp);
    }
    return programs;
  }

  private makePersonFromContact(c: ContactDto): iPerson {
    return {
      email: c.emailAddress1 ?? null,
      fax: c.fax ?? null,
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
      middleName: c.middleName ?? null,
      personId: c.contactId ?? null,
      phone: c.mobilePhone ?? null,
      phoneExtension: c.vsd_MainPhoneExtension ?? null,
      phone2: c.telephone2 ?? null,
      phone2Extension: c.vsd_HomePhoneExtension ?? null,
      title: c.jobTitle ?? null,
      userId: c.vsd_BceId ?? null,
      employmentStatus:
        employmentStatusTypeDict[c.vsd_EmploymentStatus] ?? null,
      address: {
        line1: c.address1Line1 ?? null,
        line2: c.address1Line2 ?? null,
        city: c.address1City ?? null,
        postalCode: c.address1PostalCode ?? null,
        province: c.address1StateOrProvince ?? null,
        country: c.address1Country ?? "Canada",
      },
    };
  }
}
