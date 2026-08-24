using Database.Model;
using Microsoft.Xrm.Sdk;
using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace Gov.Cscp.Victims.Public.Models
{
    public static class ProgramApplicationRequestMapper
    {
        public static Vsd_SetCpuOrgContractsRequest ToRequest(ProgramApplicationPost model)
        {
            var request = new Vsd_SetCpuOrgContractsRequest
            {
                BusinessBcEId = model.BusinessBCeID,
                UserBcEId = model.UserBCeID
            };

            if (model.Organization != null)
                request.Organization = MapOrganization(model.Organization);

            if (model.ContactCollection != null)
                request.ContactCollection = new EntityCollection(
                    model.ContactCollection.Select(MapContact).ToList());

            if (model.ContractCollection != null)
                request.ContractCollection = new EntityCollection(
                    model.ContractCollection.Select(MapContract).ToList());

            if (model.ProgramCollection != null)
                request.ProgramCollection = new EntityCollection(
                    model.ProgramCollection.Select(MapProgram).ToList());

            if (model.ScheduleCollection != null)
                request.ScheduleCollection = new EntityCollection(
                    model.ScheduleCollection.Select(MapSchedule).ToList());

            if (model.AddProgramContactCollection != null)
                request.AddProgramContactCollection = new EntityCollection(
                    model.AddProgramContactCollection.Select(MapProgramContact).Cast<Entity>().ToList());

            if (model.RemoveProgramContactCollection != null)
                request.RemoveProgramContactCollection = new EntityCollection(
                    model.RemoveProgramContactCollection.Select(MapProgramContact).Cast<Entity>().ToList());

            if (model.AddProgramSubContractorCollection != null)
                request.AddProgramSubcontractorCollection = new EntityCollection(
                    model.AddProgramSubContractorCollection.Select(MapProgramContact).Cast<Entity>().ToList());

            if (model.RemoveProgramSubContractorCollection != null)
                request.RemoveProgramSubcontractorCollection = new EntityCollection(
                    model.RemoveProgramSubContractorCollection.Select(MapProgramContact).Cast<Entity>().ToList());

            return request;
        }

        private static Entity MapOrganization(DynamicsProgramApplicationOrganizationPost org)
        {
            var entity = new Account();

            if (Guid.TryParse(org.accountid, out var accountId))
                entity.Id = accountId;

            if (org.name != null) entity.Name = org.name;
            if (org.telephone1 != null) entity.Telephone1 = org.telephone1;
            if (org.emailaddress1 != null) entity.EmailAddress1 = org.emailaddress1;
            if (org.fax != null) entity.Fax = org.fax;
            if (org.address1_city != null) entity.Address1_City = org.address1_city;
            if (org.address1_line1 != null) entity.Address1_Line1 = org.address1_line1;
            if (org.address1_line2 != null) entity.Address1_Line2 = org.address1_line2;
            if (org.address1_postalcode != null) entity.Address1_PostalCode = org.address1_postalcode;
            if (org.address1_stateorprovince != null) entity.Address1_StateOrProvince = org.address1_stateorprovince;
            if (org.address1_country != null) entity.Address1_Country = org.address1_country;
            if (org.address2_city != null) entity.Address2_City = org.address2_city;
            if (org.address2_line1 != null) entity.Address2_Line1 = org.address2_line1;
            if (org.address2_line2 != null) entity.Address2_Line2 = org.address2_line2;
            if (org.address2_postalcode != null) entity.Address2_PostalCode = org.address2_postalcode;
            if (org.address2_stateorprovince != null) entity.Address2_StateOrProvince = org.address2_stateorprovince;
            if (org.address2_country != null) entity.Address2_Country = org.address2_country;

            SetEntityReference(entity, "vsd_executivecontactid", "contact", org.vsd_ExecutiveContactIdfortunecookiebind);
            SetEntityReference(entity, "vsd_boardcontactid", "contact", org.vsd_BoardContactIdfortunecookiebind);

            return entity;
        }

        private static Entity MapContact(DynamicsProgramApplicationContactPost c)
        {
            var entity = new Contact();

            if (Guid.TryParse(c.contactid, out var contactId))
                entity.Id = contactId;

            if (c.firstname != null) entity.FirstName = c.firstname;
            if (c.lastname != null) entity.LastName = c.lastname;
            if (c.middlename != null) entity.MiddleName = c.middlename;
            if (c.jobtitle != null) entity.JobTitle = c.jobtitle;
            if (c.emailaddress1 != null) entity.EmailAddress1 = c.emailaddress1;
            if (c.mobilephone != null) entity.MobilePhone = c.mobilephone;
            if (c.fax != null) entity.Fax = c.fax;
            if (c.telephone2 != null) entity.Telephone2 = c.telephone2;
            if (c.address1_line1 != null) entity.Address1_Line1 = c.address1_line1;
            if (c.address1_line2 != null) entity.Address1_Line2 = c.address1_line2;
            if (c.address1_city != null) entity.Address1_City = c.address1_city;
            if (c.address1_postalcode != null) entity.Address1_PostalCode = c.address1_postalcode;
            if (c.address1_stateorprovince != null) entity.Address1_StateOrProvince = c.address1_stateorprovince;
            if (c.vsd_bceid != null) entity.Vsd_BcEId = c.vsd_bceid;
            if (c.vsd_mainphoneextension != null) entity.Vsd_MainPhoneExtension = c.vsd_mainphoneextension;
            if (c.vsd_homephoneextension != null) entity.Vsd_HomePhoneExtension = c.vsd_homephoneextension;
            if (c.vsd_portalfield != null) entity.Vsd_PortalField = c.vsd_portalfield;

            if (c._parentcustomerid_value != null && Guid.TryParse(c._parentcustomerid_value, out var accountId))
                entity.ParentCustomerId = new EntityReference("account", accountId);

            if (c.vsd_employmentstatus.HasValue)
                entity.Vsd_EmploymentStatus = (Contact_Vsd_EmploymentStatus)c.vsd_employmentstatus.Value;

            if (c.statecode.HasValue)
                entity.StateCode = (Contact_StateCode)c.statecode.Value;

            return entity;
        }

        private static Entity MapContract(DynamicsProgramApplicationContractPost c)
        {
            var entity = new Vsd_Contract();

            if (Guid.TryParse(c.vsd_contractid, out var contractId))
                entity.Id = contractId;

            if (c.vsd_name != null) entity.Vsd_Name = c.vsd_name;

            // vsd_cpu_humanresourcepolices is a multi-select optionset; the DTO carries it as a            
            // convert to an OptionSetValueCollection, as required by Dataverse for multi-select optionset attributes.
            SetEnumArray(entity, "vsd_cpu_humanresourcepolices", c.vsd_cpu_humanresourcepolices);

            if (c.vsd_cpu_specificunion != null) entity.Vsd_Cpu_SpecificUnion = c.vsd_cpu_specificunion;
            if (c.vsd_authorizedsigningofficersignature != null) entity.Vsd_AuthorizedSigningOfficerSignature = c.vsd_authorizedsigningofficersignature;
            if (c.vsd_signingofficersname != null) entity.Vsd_SigningOfficersName = c.vsd_signingofficersname;
            if (c.vsd_signingofficertitle != null) entity.Vsd_SigningOfficerTitle = c.vsd_signingofficertitle;

            if (c.vsd_cpu_subcontractedprogramstaff.HasValue)
                entity.Vsd_Cpu_SubcontractedProgramStaff = (Vsd_YesNo)c.vsd_cpu_subcontractedprogramstaff.Value;
            if (c.vsd_cpu_unionizedstaff.HasValue)
                entity.Vsd_Cpu_UnionizedStaff = (Vsd_YesNo)c.vsd_cpu_unionizedstaff.Value;
            if (c.vsd_cpu_insuranceoptions.HasValue)
                entity.Vsd_Cpu_InsuranceOptions = (Vsd_Contract_Vsd_Cpu_InsuranceOptions)c.vsd_cpu_insuranceoptions.Value;
            if (c.vsd_cpu_memberofcssea.HasValue)
                entity.Vsd_Cpu_MemberOfCSSea = (Vsd_Contract_Vsd_Cpu_MemberOfCSSea)c.vsd_cpu_memberofcssea.Value;

            SetEntityReference(entity, "vsd_contactlookup1", "contact", c.vsd_ContactLookup1fortunecookiebind);
            SetEntityReference(entity, "vsd_contactlookup2", "contact", c.vsd_ContactLookup2fortunecookiebind);

            return entity;
        }

        private static Entity MapProgram(DynamicsProgramApplicationProgramPost p)
        {
            var entity = new Vsd_Program();

            if (Guid.TryParse(p.vsd_programid, out var programId))
                entity.Id = programId;

            if (p.vsd_addressline1 != null) entity.Vsd_AddressLine1 = p.vsd_addressline1;
            if (p.vsd_addressline2 != null) entity.Vsd_AddressLine2 = p.vsd_addressline2;
            if (p.vsd_city != null) entity.Vsd_City = p.vsd_city;
            if (p.vsd_country != null) entity.Vsd_Country = p.vsd_country;
            if (p.vsd_emailaddress != null) entity.Vsd_EmailAddress = p.vsd_emailaddress;
            if (p.vsd_fax != null) entity.Vsd_Fax = p.vsd_fax;
            if (p.vsd_governmentfunderagency != null) entity.Vsd_GovernmentFunderAgency = p.vsd_governmentfunderagency;
            if (p.vsd_mailingaddressline1 != null) entity.Vsd_MailingAddressLine1 = p.vsd_mailingaddressline1;
            if (p.vsd_mailingaddressline2 != null) entity.Vsd_MailingAddressLine2 = p.vsd_mailingaddressline2;
            if (p.vsd_mailingcity != null) entity.Vsd_MailingCity = p.vsd_mailingcity;
            if (p.vsd_mailingcountry != null) entity.Vsd_MailingCountry = p.vsd_mailingcountry;
            if (p.vsd_mailingpostalcodezip != null) entity.Vsd_MailingPostalCodeZip = p.vsd_mailingpostalcodezip;
            if (p.vsd_mailingprovincestate != null) entity.Vsd_MailingProvinceState = p.vsd_mailingprovincestate;
            if (p.vsd_phonenumber != null) entity.Vsd_PhoneNumber = p.vsd_phonenumber;
            if (p.vsd_postalcodezip != null) entity.Vsd_PostalCodeZip = p.vsd_postalcodezip;
            if (p.vsd_provincestate != null) entity.Vsd_ProvinceState = p.vsd_provincestate;

            entity.Vsd_CostShare = p.vsd_costshare;
            entity.Vsd_Cpu_ProgramStaffSubcontracted = p.vsd_cpu_programstaffsubcontracted;
            entity.Vsd_AddressTransitionOrSafeHome = p.vsd_addresstransitionorsafehome;

            if (p.vsd_cpu_per.HasValue)
                entity.Vsd_Cpu_Per = (Vsd_Program_Vsd_Cpu_Per)p.vsd_cpu_per.Value;
            if (p.vsd_totaloncallstandbyhours.HasValue)
                entity.Vsd_ToTalonCallStandbyHours = p.vsd_totaloncallstandbyhours.Value;
            if (p.vsd_totalscheduledhours.HasValue)
                entity.Vsd_TotalScheduledHours = p.vsd_totalscheduledhours.Value;

            SetEntityReference(entity, "vsd_contactlookup", "contact", p.vsd_ContactLookupfortunecookiebind);
            SetEntityReference(entity, "vsd_contactlookup2", "contact", p.vsd_ContactLookup2fortunecookiebind);
            SetEntityReference(entity, "vsd_contactlookup3", "contact", p.vsd_ContactLookup3fortunecookiebind);

            return entity;
        }

        private static Entity MapSchedule(DynamicsProgramApplicationSchedulePost s)
        {
            var entity = new Vsd_Schedule();

            if (Guid.TryParse(s.vsd_scheduleid, out var scheduleId))
                entity.Id = scheduleId;

            // convert the comma-separated string of option-set values (e.g. "100000000,100000001") into
            SetEnumArray(entity, "vsd_days", s.vsd_days);
            if (s.vsd_scheduledstarttime != null) entity.Vsd_ScheduledStartTime = s.vsd_scheduledstarttime;
            if (s.vsd_scheduledendtime != null) entity.Vsd_ScheduledEndTime = s.vsd_scheduledendtime;

            entity.Vsd_Cpu_ScheduleType = (Vsd_Schedule_Vsd_Cpu_ScheduleType)s.vsd_cpu_scheduletype;

            if (s.statecode.HasValue)
                entity.StateCode = (Vsd_Schedule_StateCode)s.statecode.Value;

            SetEntityReference(entity, "vsd_programid", "vsd_program", s.vsd_ProgramIdfortunecookiebind);

            return entity;
        }

        private static Vsd_Contact_Vsd_Program MapProgramContact(DynamicsProgramApplicationProgramContactPost pc)
        {
            var entity = new Vsd_Contact_Vsd_Program();

            if (Guid.TryParse(pc.contactid, out var contactId))
                entity["contactid"] = new EntityReference("contact", contactId);

            if (Guid.TryParse(pc.vsd_programid, out var programId))
                entity["vsd_programid"] = new EntityReference("vsd_program", programId);

            return entity;
        }

        // Extracts a GUID from an OData bind string like "/contacts(guid)" or "/vsd_programs(guid)"
        private static Guid? ExtractGuidFromBind(string bindValue)
        {
            if (string.IsNullOrWhiteSpace(bindValue)) return null;

            var match = Regex.Match(bindValue, @"\(([0-9a-fA-F\-]{36})\)");
            if (match.Success && Guid.TryParse(match.Groups[1].Value, out var guid))
                return guid;

            return null;
        }

        private static void SetString(Entity entity, string attributeName, string value)
        {
            if (value != null)
                entity[attributeName] = value;
        }

        // Converts a comma-separated string of option-set values (e.g. "100000000,100000001") into
        // an OptionSetValueCollection, as required by Dataverse for multi-select optionset attributes.
        private static void SetEnumArray(Entity entity, string attributeName, string value)
        {
            if (value == null) return;

            var options = value
                .Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .Select(s => new OptionSetValue(int.Parse(s)))
                .ToList();

            entity[attributeName] = new OptionSetValueCollection(options);
        }

        private static void SetEntityReference(Entity entity, string attributeName, string logicalName, string bindValue)
        {
            var guid = ExtractGuidFromBind(bindValue);
            if (guid.HasValue)
                entity[attributeName] = new EntityReference(logicalName, guid.Value);
        }


    }
}
