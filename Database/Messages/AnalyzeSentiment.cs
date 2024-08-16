#pragma warning disable CS1591
//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Database.Model
{
	
	
	[System.Runtime.Serialization.DataContractAttribute(Namespace="http://schemas.microsoft.com/xrm/2011//")]
	[Microsoft.Xrm.Sdk.Client.RequestProxyAttribute("AnalyzeSentiment")]
	public partial class AnalyzeSentimentRequest : Microsoft.Xrm.Sdk.OrganizationRequest
	{
		
		public static class Fields
		{
			public const string Text = "Text";
			public const string ModelId = "ModelId";
			public const string Language = "Language";
		}
		
		public const string ActionLogicalName = "AnalyzeSentiment";
		
		public string Text
		{
			get
			{
				if (this.Parameters.Contains("text"))
				{
					return ((string)(this.Parameters["text"]));
				}
				else
				{
					return default(string);
				}
			}
			set
			{
				this.Parameters["text"] = value;
			}
		}
		
		public string ModelId
		{
			get
			{
				if (this.Parameters.Contains("modelId"))
				{
					return ((string)(this.Parameters["modelId"]));
				}
				else
				{
					return default(string);
				}
			}
			set
			{
				this.Parameters["modelId"] = value;
			}
		}
		
		public string Language
		{
			get
			{
				if (this.Parameters.Contains("language"))
				{
					return ((string)(this.Parameters["language"]));
				}
				else
				{
					return default(string);
				}
			}
			set
			{
				this.Parameters["language"] = value;
			}
		}
		
		public AnalyzeSentimentRequest()
		{
			this.RequestName = "AnalyzeSentiment";
			this.Text = default(string);
		}
	}
	
	[System.Runtime.Serialization.DataContractAttribute(Namespace="http://schemas.microsoft.com/xrm/2011//")]
	[Microsoft.Xrm.Sdk.Client.ResponseProxyAttribute("AnalyzeSentiment")]
	public partial class AnalyzeSentimentResponse : Microsoft.Xrm.Sdk.OrganizationResponse
	{
		
		public static class Fields
		{
			public const string DocumentsCores = "DocumentsCores";
			public const string Sentences = "Sentences";
			public const string Sentiment = "Sentiment";
		}
		
		public const string ActionLogicalName = "AnalyzeSentiment";
		
		public AnalyzeSentimentResponse()
		{
		}
		
		public Microsoft.Xrm.Sdk.Entity DocumentsCores
		{
			get
			{
				if (this.Results.Contains("documentScores"))
				{
					return ((Microsoft.Xrm.Sdk.Entity)(this.Results["documentScores"]));
				}
				else
				{
					return default(Microsoft.Xrm.Sdk.Entity);
				}
			}
			set
			{
				this.Results["DocumentsCores"] = value;
			}
		}
		
		public Microsoft.Xrm.Sdk.EntityCollection Sentences
		{
			get
			{
				if (this.Results.Contains("sentences"))
				{
					return ((Microsoft.Xrm.Sdk.EntityCollection)(this.Results["sentences"]));
				}
				else
				{
					return default(Microsoft.Xrm.Sdk.EntityCollection);
				}
			}
			set
			{
				this.Results["Sentences"] = value;
			}
		}
		
		public string Sentiment
		{
			get
			{
				if (this.Results.Contains("sentiment"))
				{
					return ((string)(this.Results["sentiment"]));
				}
				else
				{
					return default(string);
				}
			}
			set
			{
				this.Results["Sentiment"] = value;
			}
		}
	}
}
#pragma warning restore CS1591