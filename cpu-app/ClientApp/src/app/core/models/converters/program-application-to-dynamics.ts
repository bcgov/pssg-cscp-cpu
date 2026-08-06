import {
  DynamicsProgramApplicationContactPost,
  DynamicsProgramApplicationProgramContactPost,
  DynamicsProgramApplicationProgramPost,
  ProgramApplicationPost,
} from "../../api/models";
import { boolOptionSet } from "../../constants/bool-optionset-values";
import { encodeCcseaMemberType } from "../../constants/encode-ccsea-member-type";
import { encodeCglInsurance } from "../../constants/encode-cgl-insurance-type";
import { encodeHrPolicies } from "../../constants/encode-hr-policies";
import { nameAssemble } from "../../constants/name-assemble";
import { iHours } from "../hours.interface";
import { iPerson } from "../person.interface";
import { iProgramApplication } from "../program-application.interface";
import { TransmogrifierProgramApplication } from "../transmogrifier-program-application.class";
import { convertHoursToDynamics } from "./hours-to-dynamics";
import { convertPersonToDynamics } from "./person-to-dynamics";

export function convertProgramApplicationToDynamics(
  trans: TransmogrifierProgramApplication,
  isSubmit: boolean = false,
): ProgramApplicationPost {
  const post: ProgramApplicationPost = {
    businessBCeID: trans.organizationId,
    userBCeID: trans.userId,
    contractCollection: [
      {
        vsd_ContactLookup1fortunecookiebind: trans.contactInformation
          .executiveContact
          ? trans.contactInformation.executiveContact.personId
          : null,
        // if the user has requested not to have a board contact we simply duplicate the link to the the executive contact
        vsd_ContactLookup2fortunecookiebind:
          trans.contactInformation.hasBoardContact &&
          trans.contactInformation.boardContact
            ? trans.contactInformation.boardContact.personId
            : trans.contactInformation.executiveContact
              ? trans.contactInformation.executiveContact.personId
              : null,
        vsd_cpu_subcontractedprogramstaff: trans.administrativeInformation
          .staffSubcontracted
          ? boolOptionSet.isTrue
          : boolOptionSet.isFalse,
        vsd_cpu_unionizedstaff: trans.administrativeInformation.staffUnionized
          ? boolOptionSet.isTrue
          : boolOptionSet.isFalse,
        vsd_cpu_insuranceoptions: encodeCglInsurance(trans.cglInsurance),
        vsd_cpu_memberofcssea: encodeCcseaMemberType(
          trans.administrativeInformation.ccseaMemberType,
        ),
        vsd_contractid: trans.contractId,
        vsd_cpu_humanresourcepolices: encodeHrPolicies(
          trans.administrativeInformation,
        ),
        vsd_cpu_specificunion: trans.administrativeInformation.staffUnion,
        vsd_name: trans.contractNumber,
        vsd_authorizedsigningofficersignature:
          trans.signature.signature && isSubmit
            ? trans.signature.signature
            : null,
        vsd_signingofficersname:
          trans.signature.signer && isSubmit
            ? nameAssemble(
                trans.signature.signer.firstName,
                trans.signature.signer.middleName,
                trans.signature.signer.lastName,
              )
            : null,
        vsd_signingofficertitle:
          trans.signature.signer && isSubmit
            ? trans.signature.signer.title
            : null,
      },
    ],
    organization: {
      accountid: trans.accountId,
      address1_city: trans.contactInformation.mainAddress.city,
      address1_country: trans.contactInformation.mainAddress.country,
      address1_line1: trans.contactInformation.mainAddress.line1,
      address1_line2: trans.contactInformation.mainAddress.line2,
      address1_postalcode: trans.contactInformation.mainAddress.postalCode,
      address1_stateorprovince: trans.contactInformation.mainAddress.province,
      // if the mailing address is false we set all mailing address info to blank to copy over the existing non-null values in Dynamics.
      // there is no procedure to request "remove mailing address from organization"
      address2_city: trans.contactInformation.mailingAddress.city || "",
      address2_country: trans.contactInformation.mailingAddress.country || "",
      address2_line1: trans.contactInformation.mailingAddress.line1 || "",
      address2_line2: trans.contactInformation.mailingAddress.line2 || "",
      address2_postalcode:
        trans.contactInformation.mailingAddress.postalCode || "",
      address2_stateorprovince:
        trans.contactInformation.mailingAddress.province || "",
      emailaddress1: trans.contactInformation.emailAddress,
      fax: trans.contactInformation.faxNumber,
      name: trans.organizationName,
      telephone1: trans.contactInformation.phoneNumber,
    },
  };
  // if there is no board contact we should remove the board contact before submitting.

  const programContactCollection: DynamicsProgramApplicationProgramContactPost[] =
    [];
  const removeProgramContactCollection: DynamicsProgramApplicationProgramContactPost[] =
    [];
  const programSubContractorCollection: DynamicsProgramApplicationProgramContactPost[] =
    [];
  const removeSubContractorCollection: DynamicsProgramApplicationProgramContactPost[] =
    [];
  trans.programApplications.forEach((pa: iProgramApplication) => {
    // in each program add the list of staff by their id
    pa.additionalStaff.forEach((s: iPerson): void => {
      // if (!pa.programId) console.log('Missing program id!', pa);
      const contact: DynamicsProgramApplicationProgramContactPost = {
        contactid: s.personId,
        vsd_programid: pa.programId,
      };
      // add the contact
      programContactCollection.push(contact);
    });

    pa.removedStaff.forEach((s: iPerson): void => {
      // if (!pa.programId) console.log('Missing program id!', pa);
      const contact: DynamicsProgramApplicationProgramContactPost = {
        contactid: s.personId,
        vsd_programid: pa.programId,
      };
      // add the contact
      removeProgramContactCollection.push(contact);
    });

    pa.subContractedStaff.forEach((s: iPerson): void => {
      // if (!pa.programId) console.log('Missing program id!', pa);
      const contact: DynamicsProgramApplicationProgramContactPost = {
        contactid: s.personId,
        vsd_programid: pa.programId,
      };
      // add the contact
      programSubContractorCollection.push(contact);
    });

    pa.removedSubContractedStaff.forEach((s: iPerson): void => {
      // if (!pa.programId) console.log('Missing program id!', pa);
      const contact: DynamicsProgramApplicationProgramContactPost = {
        contactid: s.personId,
        vsd_programid: pa.programId,
      };
      // add the contact
      removeSubContractorCollection.push(contact);
    });
  });
  // if there are elements in the array add the item.
  if (programContactCollection.length)
    post.addProgramContactCollection = programContactCollection;
  if (removeProgramContactCollection.length)
    post.removeProgramContactCollection = removeProgramContactCollection;
  if (programSubContractorCollection.length)
    post.addProgramSubContractorCollection = programSubContractorCollection;
  if (removeSubContractorCollection.length)
    post.removeProgramSubContractorCollection = removeSubContractorCollection;

  const programCollection: DynamicsProgramApplicationProgramPost[] = [];
  trans.programApplications.forEach((p: iProgramApplication) => {
    // push programs into program collection
    programCollection.push({
      vsd_ContactLookup2fortunecookiebind:
        p.policeContact && p.hasPoliceContact
          ? p.policeContact.personId || ""
          : null,
      vsd_ContactLookup3fortunecookiebind:
        p.sharedCostContact && p.hasPoliceContact && p.hasSharedCostContact
          ? p.sharedCostContact.personId || ""
          : null,
      vsd_ContactLookupfortunecookiebind: p.programContact
        ? p.programContact.personId
        : null,
      vsd_addressline1: p.mainAddress.line1,
      vsd_addressline2: p.mainAddress.line2,
      vsd_city: p.mainAddress.city,
      vsd_costshare: p.hasSharedCostContact,
      vsd_country: p.mainAddress.country,
      vsd_cpu_per: p.perType,
      vsd_cpu_programstaffsubcontracted: p.hasSubContractedStaff,
      vsd_emailaddress: p.emailAddress,
      vsd_fax: p.faxNumber,
      vsd_governmentfunderagency: p.governmentFunder,
      vsd_mailingaddressline1: p.mailingAddress.line1,
      vsd_mailingaddressline2: p.mailingAddress.line2,
      vsd_mailingcity: p.mailingAddress.city,
      vsd_mailingcountry: p.mailingAddress.country,
      vsd_mailingpostalcodezip: p.mailingAddress.postalCode,
      vsd_mailingprovincestate: p.mailingAddress.province,
      vsd_phonenumber: p.phoneNumber,
      vsd_postalcodezip: p.mainAddress.postalCode,
      vsd_programid: p.programId,
      vsd_provincestate: p.mainAddress.province,
      vsd_totaloncallstandbyhours: p.onCallHours,
      vsd_totalscheduledhours: p.scheduledHours,
      vsd_addresstransitionorsafehome: p.isTransitionHouse,
    });
    // if there are elements in the array add the item.
    if (programCollection.length) post.programCollection = programCollection;

    const contactCollection: DynamicsProgramApplicationContactPost[] = [];

    trans.programApplications.forEach((p: iProgramApplication) => {
      let policeContact = convertPersonToDynamics(p.policeContact);
      if (policeContact && Object.keys(policeContact).length > 0 && p.hasPoliceContact) {
        policeContact.vsd_portalfield = "vsd_contactlookup2=" + p.programId;
        contactCollection.push(policeContact);
      }

      let sharedCostContact = convertPersonToDynamics(p.sharedCostContact);
      if (
        sharedCostContact && Object.keys(sharedCostContact).length > 0 &&
        p.hasPoliceContact &&
        p.hasSharedCostContact
      ) {
        sharedCostContact.vsd_portalfield = "vsd_contactlookup3=" + p.programId;
        contactCollection.push(sharedCostContact);
      }
    });

    if (contactCollection.length) post.contactCollection = contactCollection;
    // push hours into schedule collection
    const scheduleCollection = [];

    let opHours = p.operationHours.filter((h) => !isEmptyHours(h));
    let stdHours = p.standbyHours.filter((h) => !isEmptyHours(h));
    opHours
      .map((h: iHours) => convertHoursToDynamics(h, p.programId))
      .forEach((d) => scheduleCollection.push(d));
    stdHours
      .map((h: iHours) => convertHoursToDynamics(h, p.programId, true))
      .forEach((d) => scheduleCollection.push(d));
    // if there are elements in the schedule collection then add them to the post
    if (scheduleCollection.length) post.scheduleCollection = scheduleCollection;
  });
  return post;
}

function isEmptyHours(obj) {
  for (var key in obj) {
    if (key == "isAMClosed" || key == "isAMOpen" || key == "isActive") continue;
    if (obj[key] != null && obj[key] != "") return false;
  }
  return true;
}
