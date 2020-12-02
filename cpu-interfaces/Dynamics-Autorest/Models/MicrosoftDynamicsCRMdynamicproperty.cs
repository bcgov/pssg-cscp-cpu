// <auto-generated>
// Code generated by Microsoft (R) AutoRest Code Generator.
// Changes may cause incorrect behavior and will be lost if the code is
// regenerated.
// </auto-generated>

namespace Gov.Jag.VictimServices.Interfaces.Models
{
    using Newtonsoft.Json;
    using System.Collections;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// dynamicproperty
    /// </summary>
    public partial class MicrosoftDynamicsCRMdynamicproperty
    {
        /// <summary>
        /// Initializes a new instance of the
        /// MicrosoftDynamicsCRMdynamicproperty class.
        /// </summary>
        public MicrosoftDynamicsCRMdynamicproperty()
        {
            CustomInit();
        }

        /// <summary>
        /// Initializes a new instance of the
        /// MicrosoftDynamicsCRMdynamicproperty class.
        /// </summary>
        public MicrosoftDynamicsCRMdynamicproperty(string rootdynamicpropertyid = default(string), string _organizationidValue = default(string), System.DateTimeOffset? createdon = default(System.DateTimeOffset?), string defaultvaluestring = default(string), int? importsequencenumber = default(int?), string _basedynamicpropertyidValue = default(string), bool? isreadonly = default(bool?), int? defaultvalueinteger = default(int?), bool? isrequired = default(bool?), int? dmtimportstate = default(int?), int? statecode = default(int?), string _modifiedonbehalfbyValue = default(string), int? maxvalueinteger = default(int?), double? maxvaluedouble = default(double?), string _modifiedbyValue = default(string), object minvaluedecimal = default(object), string _createdbyValue = default(string), string _createdonbehalfbyValue = default(string), string name = default(string), object defaultvaluedecimal = default(object), int? maxlengthstring = default(int?), string description = default(string), object maxvaluedecimal = default(object), double? defaultvaluedouble = default(double?), string overwrittendynamicpropertyid = default(string), System.DateTimeOffset? overriddencreatedon = default(System.DateTimeOffset?), double? minvaluedouble = default(double?), string _defaultvalueoptionsetValue = default(string), int? statuscode = default(int?), int? precision = default(int?), string dynamicpropertyid = default(string), System.DateTimeOffset? modifiedon = default(System.DateTimeOffset?), string _regardingobjectidValue = default(string), int? minvalueinteger = default(int?), bool? ishidden = default(bool?), long? versionnumber = default(long?), int? datatype = default(int?), MicrosoftDynamicsCRMsystemuser createdonbehalfby = default(MicrosoftDynamicsCRMsystemuser), MicrosoftDynamicsCRMdynamicproperty basedynamicpropertyid = default(MicrosoftDynamicsCRMdynamicproperty), IList<MicrosoftDynamicsCRMdynamicproperty> dynamicpropertyBaseDynamicproperty = default(IList<MicrosoftDynamicsCRMdynamicproperty>), IList<MicrosoftDynamicsCRMdynamicpropertyinstance> dynamicPropertyDynamicPropertyInstance = default(IList<MicrosoftDynamicsCRMdynamicpropertyinstance>), MicrosoftDynamicsCRMsystemuser createdby = default(MicrosoftDynamicsCRMsystemuser), MicrosoftDynamicsCRMproductassociation regardingobjectidProductassociation = default(MicrosoftDynamicsCRMproductassociation), MicrosoftDynamicsCRMproduct regardingobjectidProduct = default(MicrosoftDynamicsCRMproduct), MicrosoftDynamicsCRMsystemuser modifiedonbehalfby = default(MicrosoftDynamicsCRMsystemuser), IList<MicrosoftDynamicsCRMdynamicpropertyassociation> dynamicpropertyDynamicPropertyAssociation = default(IList<MicrosoftDynamicsCRMdynamicpropertyassociation>), MicrosoftDynamicsCRMorganization organizationid = default(MicrosoftDynamicsCRMorganization), IList<MicrosoftDynamicsCRMdynamicpropertyoptionsetitem> dynamicPropertyDynamicPropertyOptionSetItem = default(IList<MicrosoftDynamicsCRMdynamicpropertyoptionsetitem>), MicrosoftDynamicsCRMdynamicpropertyoptionsetitem dynamicpropertyoptionsetvalueid = default(MicrosoftDynamicsCRMdynamicpropertyoptionsetitem), MicrosoftDynamicsCRMsystemuser modifiedby = default(MicrosoftDynamicsCRMsystemuser))
        {
            Rootdynamicpropertyid = rootdynamicpropertyid;
            this._organizationidValue = _organizationidValue;
            Createdon = createdon;
            Defaultvaluestring = defaultvaluestring;
            Importsequencenumber = importsequencenumber;
            this._basedynamicpropertyidValue = _basedynamicpropertyidValue;
            Isreadonly = isreadonly;
            Defaultvalueinteger = defaultvalueinteger;
            Isrequired = isrequired;
            Dmtimportstate = dmtimportstate;
            Statecode = statecode;
            this._modifiedonbehalfbyValue = _modifiedonbehalfbyValue;
            Maxvalueinteger = maxvalueinteger;
            Maxvaluedouble = maxvaluedouble;
            this._modifiedbyValue = _modifiedbyValue;
            Minvaluedecimal = minvaluedecimal;
            this._createdbyValue = _createdbyValue;
            this._createdonbehalfbyValue = _createdonbehalfbyValue;
            Name = name;
            Defaultvaluedecimal = defaultvaluedecimal;
            Maxlengthstring = maxlengthstring;
            Description = description;
            Maxvaluedecimal = maxvaluedecimal;
            Defaultvaluedouble = defaultvaluedouble;
            Overwrittendynamicpropertyid = overwrittendynamicpropertyid;
            Overriddencreatedon = overriddencreatedon;
            Minvaluedouble = minvaluedouble;
            this._defaultvalueoptionsetValue = _defaultvalueoptionsetValue;
            Statuscode = statuscode;
            Precision = precision;
            Dynamicpropertyid = dynamicpropertyid;
            Modifiedon = modifiedon;
            this._regardingobjectidValue = _regardingobjectidValue;
            Minvalueinteger = minvalueinteger;
            Ishidden = ishidden;
            Versionnumber = versionnumber;
            Datatype = datatype;
            Createdonbehalfby = createdonbehalfby;
            Basedynamicpropertyid = basedynamicpropertyid;
            DynamicpropertyBaseDynamicproperty = dynamicpropertyBaseDynamicproperty;
            DynamicPropertyDynamicPropertyInstance = dynamicPropertyDynamicPropertyInstance;
            Createdby = createdby;
            RegardingobjectidProductassociation = regardingobjectidProductassociation;
            RegardingobjectidProduct = regardingobjectidProduct;
            Modifiedonbehalfby = modifiedonbehalfby;
            DynamicpropertyDynamicPropertyAssociation = dynamicpropertyDynamicPropertyAssociation;
            Organizationid = organizationid;
            DynamicPropertyDynamicPropertyOptionSetItem = dynamicPropertyDynamicPropertyOptionSetItem;
            Dynamicpropertyoptionsetvalueid = dynamicpropertyoptionsetvalueid;
            Modifiedby = modifiedby;
            CustomInit();
        }

        /// <summary>
        /// An initialization method that performs custom operations like setting defaults
        /// </summary>
        partial void CustomInit();

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "rootdynamicpropertyid")]
        public string Rootdynamicpropertyid { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_organizationid_value")]
        public string _organizationidValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "createdon")]
        public System.DateTimeOffset? Createdon { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "defaultvaluestring")]
        public string Defaultvaluestring { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "importsequencenumber")]
        public int? Importsequencenumber { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_basedynamicpropertyid_value")]
        public string _basedynamicpropertyidValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "isreadonly")]
        public bool? Isreadonly { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "defaultvalueinteger")]
        public int? Defaultvalueinteger { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "isrequired")]
        public bool? Isrequired { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "dmtimportstate")]
        public int? Dmtimportstate { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "statecode")]
        public int? Statecode { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_modifiedonbehalfby_value")]
        public string _modifiedonbehalfbyValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "maxvalueinteger")]
        public int? Maxvalueinteger { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "maxvaluedouble")]
        public double? Maxvaluedouble { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_modifiedby_value")]
        public string _modifiedbyValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "minvaluedecimal")]
        public object Minvaluedecimal { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_createdby_value")]
        public string _createdbyValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_createdonbehalfby_value")]
        public string _createdonbehalfbyValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "defaultvaluedecimal")]
        public object Defaultvaluedecimal { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "maxlengthstring")]
        public int? Maxlengthstring { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "description")]
        public string Description { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "maxvaluedecimal")]
        public object Maxvaluedecimal { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "defaultvaluedouble")]
        public double? Defaultvaluedouble { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "overwrittendynamicpropertyid")]
        public string Overwrittendynamicpropertyid { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "overriddencreatedon")]
        public System.DateTimeOffset? Overriddencreatedon { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "minvaluedouble")]
        public double? Minvaluedouble { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_defaultvalueoptionset_value")]
        public string _defaultvalueoptionsetValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "statuscode")]
        public int? Statuscode { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "precision")]
        public int? Precision { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "dynamicpropertyid")]
        public string Dynamicpropertyid { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "modifiedon")]
        public System.DateTimeOffset? Modifiedon { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "_regardingobjectid_value")]
        public string _regardingobjectidValue { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "minvalueinteger")]
        public int? Minvalueinteger { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "ishidden")]
        public bool? Ishidden { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "versionnumber")]
        public long? Versionnumber { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "datatype")]
        public int? Datatype { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "createdonbehalfby")]
        public MicrosoftDynamicsCRMsystemuser Createdonbehalfby { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "basedynamicpropertyid")]
        public MicrosoftDynamicsCRMdynamicproperty Basedynamicpropertyid { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "dynamicproperty_base_dynamicproperty")]
        public IList<MicrosoftDynamicsCRMdynamicproperty> DynamicpropertyBaseDynamicproperty { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "DynamicProperty_DynamicPropertyInstance")]
        public IList<MicrosoftDynamicsCRMdynamicpropertyinstance> DynamicPropertyDynamicPropertyInstance { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "createdby")]
        public MicrosoftDynamicsCRMsystemuser Createdby { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "regardingobjectid_productassociation")]
        public MicrosoftDynamicsCRMproductassociation RegardingobjectidProductassociation { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "regardingobjectid_product")]
        public MicrosoftDynamicsCRMproduct RegardingobjectidProduct { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "modifiedonbehalfby")]
        public MicrosoftDynamicsCRMsystemuser Modifiedonbehalfby { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "Dynamicproperty_DynamicPropertyAssociation")]
        public IList<MicrosoftDynamicsCRMdynamicpropertyassociation> DynamicpropertyDynamicPropertyAssociation { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "organizationid")]
        public MicrosoftDynamicsCRMorganization Organizationid { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "DynamicProperty_DynamicPropertyOptionSetItem")]
        public IList<MicrosoftDynamicsCRMdynamicpropertyoptionsetitem> DynamicPropertyDynamicPropertyOptionSetItem { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "dynamicpropertyoptionsetvalueid")]
        public MicrosoftDynamicsCRMdynamicpropertyoptionsetitem Dynamicpropertyoptionsetvalueid { get; set; }

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "modifiedby")]
        public MicrosoftDynamicsCRMsystemuser Modifiedby { get; set; }

    }
}
