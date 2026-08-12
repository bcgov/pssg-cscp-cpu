using Database.Model;
using Gov.Cscp.Victims.Public.Models;
using Gov.Cscp.Victims.Public.Services;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Serilog;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace Gov.Cscp.Victims.Public.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class FileController : Controller
    {
        private readonly IOrganizationServiceAsync _organizationService;
        private readonly IDocumentMergeService _documentMergeService;
        private readonly ILogger _logger;

        public FileController(IOrganizationServiceAsync organizationService, IDocumentMergeService documentMergeService)
        {
            _organizationService = organizationService;
            _documentMergeService = documentMergeService;
            _logger = Log.Logger;
        }

        [HttpGet("{businessBceid}/{userBceid}/documents/contract/{contractId}")]
        [ProducesResponseType(typeof(DocumentCollectionResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<DocumentCollectionResponseDto>> GetContractDocuments(
            string businessBceid, string userBceid, string contractId)
        {
            if (string.IsNullOrWhiteSpace(businessBceid))
                return BadRequest("businessBceid parameter is required.");
            if (string.IsNullOrWhiteSpace(userBceid))
                return BadRequest("userBceid parameter is required.");
            if (!Guid.TryParse(contractId, out var contractGuid))
                return BadRequest("contractId must be a valid GUID.");

            try
            {
                var request = new Vsd_GetCpuContractDocumentsRequest
                {
                    Target = new EntityReference("vsd_contract", contractGuid),
                    UserBcEId = userBceid,
                    BusinessBcEId = businessBceid
                };
                var response = (Vsd_GetCpuContractDocumentsResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new DocumentCollectionResponseDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty,
                    Businessbceid = response.BusinessBcEId,
                    Userbceid = response.UserBcEId,
                    DocumentCollection = response.DocumentCollection?.Entities
                        .Select(EntityToDtoMapper.ToDocumentItemDto).ToArray()
                        ?? Array.Empty<DocumentItemDto>()
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, $"Unexpected error while getting contract documents info 'vsd_GetCPUContractDocuments'. contract id = {contractId}. Source = CPU");
                return BadRequest();
            }
        }

        [HttpGet("{businessBceid}/{userBceid}/documents/account/{accountId}")]
        [ProducesResponseType(typeof(DocumentCollectionResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<DocumentCollectionResponseDto>> GetAccountDocuments(
            string businessBceid, string userBceid, string accountId)
        {
            if (string.IsNullOrWhiteSpace(businessBceid))
                return BadRequest("businessBceid parameter is required.");
            if (string.IsNullOrWhiteSpace(userBceid))
                return BadRequest("userBceid parameter is required.");
            if (!Guid.TryParse(accountId, out var accountGuid))
                return BadRequest("accountId must be a valid GUID.");

            try
            {
                var request = new Vsd_GetCpuAccountDocumentsRequest
                {
                    Target = new EntityReference("account", accountGuid),
                    UserBcEId = userBceid,
                    BusinessBcEId = businessBceid
                };
                var response = (Vsd_GetCpuAccountDocumentsResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new DocumentCollectionResponseDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty,
                    Businessbceid = response.BusinessBcEId,
                    Userbceid = response.UserBcEId,
                    DocumentCollection = response.DocumentCollection?.Entities
                        .Select(EntityToDtoMapper.ToDocumentItemDto).ToArray()
                        ?? Array.Empty<DocumentItemDto>()
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, $"Unexpected error while getting account documents info 'vsd_GetCPUAccountDocuments'. account id = {accountId}. Source = CPU");
                return BadRequest();
            }
        }

        [HttpGet("{businessBceid}/{userBceid}/document/{docId}")]
        [ProducesResponseType(typeof(DownloadDocumentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<DownloadDocumentDto>> DownloadDocument(
            string businessBceid, string userBceid, string docId)
        {
            if (string.IsNullOrWhiteSpace(businessBceid))
                return BadRequest("businessBceid parameter is required.");
            if (string.IsNullOrWhiteSpace(userBceid))
                return BadRequest("userBceid parameter is required.");
            if (!Guid.TryParse(docId, out var docGuid))
                return BadRequest("docId must be a valid GUID.");

            try
            {
                var request = new Vsd_DownloadDocumentFromSharePointRequest
                {
                    Target = new EntityReference("vsd_sharepointurl", docGuid)
                };
                var response = (Vsd_DownloadDocumentFromSharePointResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new DownloadDocumentDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty,
                    Body = response.Body,
                    FileName = response.FileName,
                    FileSize = response.FileSize == default ? (decimal?)null : response.FileSize,
                    MimeType = response.MimeType,
                    ReceivedDate = response.ReceivedDate == default ? (DateTime?)null : response.ReceivedDate
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, $"Unexpected error while getting document info 'vsd_DownloadDocumentFromSharePoint'. Document id = {docId}. Source = CPU");
                return BadRequest();
            }
        }

        [HttpGet("contract_package/{businessBceid}/{userBceid}/{taskId}")]
        [ProducesResponseType(typeof(DocumentCollectionResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<DocumentCollectionResponseDto>> GetContractPackage(
            string businessBceid, string userBceid, string taskId)
        {
            if (string.IsNullOrWhiteSpace(businessBceid))
                return BadRequest("businessBceid parameter is required.");
            if (string.IsNullOrWhiteSpace(userBceid))
                return BadRequest("userBceid parameter is required.");
            if (!Guid.TryParse(taskId, out var taskGuid))
                return BadRequest("taskId must be a valid GUID.");

            try
            {
                var request = new Vsd_GetCpuContractPackageRequest
                {
                    Target = new EntityReference("task", taskGuid),
                    UserBcEId = userBceid,
                    BusinessBcEId = businessBceid
                };
                var response = (Vsd_GetCpuContractPackageResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new DocumentCollectionResponseDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty,
                    Businessbceid = response.BusinessBcEId,
                    Userbceid = response.UserBcEId,
                    DocumentCollection = response.DocumentCollection?.Entities
                        .Select(EntityToDtoMapper.ToDocumentItemDto).ToArray()
                        ?? Array.Empty<DocumentItemDto>()
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, $"Unexpected error while getting contract package info 'vsd_GetCPUContractPackage'. Task id = {taskId}. Source = CPU");
                return BadRequest();
            }
        }

        [HttpPost("signed_contract/{taskId}")]
        [ProducesResponseType(typeof(UploadResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<UploadResponseDto>> UploadSignedContract(
            [FromBody] SignedContractPostFromPortal portalModel, string taskId)
        {
            if (!ModelState.IsValid)
            {
                var messages = string.Join("\n", ModelState.Values
                    .SelectMany(x => x.Errors)
                    .Select(x => x.ErrorMessage));
                _logger.Error(new Exception(messages),
                    $"API call to 'UploadSignedContract' made with invalid model state. Error is:\n{messages}\nSource = CPU");
                return BadRequest(ModelState);
            }

            if (!Guid.TryParse(taskId, out var taskGuid))
                return BadRequest("taskId must be a valid GUID.");

            try
            {
                // Stamp the signature page
                int signatureIndex = portalModel.DocumentCollection.Length - 1;
                byte[] signaturePage = Convert.FromBase64String(portalModel.DocumentCollection[signatureIndex].body);
                string signatureString = portalModel.Signature.vsd_authorizedsigningofficersignature;
                int offset = signatureString.IndexOf(',') + 1;
                byte[] signatureImage = Convert.FromBase64String(signatureString.Substring(offset));

                string signedPage = StampSignaturePage(
                    signaturePage,
                    signatureImage,
                    portalModel.Signature.vsd_signingofficersname,
                    portalModel.Signature.vsd_signingofficertitle,
                    portalModel.IsModificationAgreement);

                // Build the merge request
                var docMergeRequest = new DocMergeRequest
                {
                    documents = new JAGDocument[portalModel.DocumentCollection.Length],
                    options = new JAGOptions()
                };

                bool addedSignature = false;
                int insertIndex = 0;

                for (int i = 0; i < portalModel.DocumentCollection.Length - 1; ++i)
                {
                    docMergeRequest.documents[insertIndex] = new JAGDocument(portalModel.DocumentCollection[i].body, insertIndex);
                    ++insertIndex;

                    if (portalModel.DocumentCollection[i].filename.Contains("TUA") && !addedSignature)
                    {
                        docMergeRequest.documents[insertIndex] = new JAGDocument(signedPage, insertIndex);
                        addedSignature = true;
                        ++insertIndex;
                    }
                }

                if (!addedSignature)
                    docMergeRequest.documents[signatureIndex] = new JAGDocument(signedPage, signatureIndex);

                var mergeOptions = new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };
                string mergeString = JsonSerializer.Serialize(docMergeRequest, mergeOptions);

                HttpClientResult mergeResult = await _documentMergeService.Post(mergeString);
                if (mergeResult.statusCode != HttpStatusCode.OK)
                    return StatusCode((int)mergeResult.statusCode);

                string combinedDoc = GetJArrayValue(mergeResult.result, "document");
                string fileName = portalModel.IsModificationAgreement
                    ? "Modification Package Signed by Service Provider.pdf"
                    : "Contract Package Signed by Service Provider.pdf";

                // Build the Dataverse entity for the signed contract attachment
                var signedContractEntity = new Entity("activitymimeattachment");
                signedContractEntity["body"] = combinedDoc;
                signedContractEntity["filename"] = fileName;

                var request = new Vsd_UploadCpuContractPackageRequest
                {
                    Target = new EntityReference("task", taskGuid),
                    BusinessBcEId = portalModel.BusinessBCeID,
                    UserBcEId = portalModel.UserBCeID,
                    SignedContract = signedContractEntity
                };
                var response = (Vsd_UploadCpuContractPackageResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new UploadResponseDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, "Unexpected error while submitting contract package. Source = CPU");
                return BadRequest();
            }
        }

        [HttpPost("account/{accountId}")]
        [ProducesResponseType(typeof(UploadResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<UploadResponseDto>> UploadAccountDocument(
            [FromBody] FilePost model, string accountId)
        {
            if (!ModelState.IsValid)
            {
                var messages = string.Join("\n", ModelState.Values
                    .SelectMany(x => x.Errors)
                    .Select(x => x.ErrorMessage));
                _logger.Error(new Exception(messages),
                    $"API call to 'UploadAccountDocument' made with invalid model state. Error is:\n{messages}\nSource = CPU");
                return BadRequest(ModelState);
            }

            if (!Guid.TryParse(accountId, out var accountGuid))
                return BadRequest("accountId must be a valid GUID.");

            try
            {
                var request = new Vsd_UploadCpuAccountDocumentsRequest
                {
                    Target = new EntityReference("account", accountGuid),
                    BusinessBcEId = model.BusinessBCeID,
                    UserBcEId = model.UserBCeID,
                    DocumentCollection = ToEntityCollection(model.DocumentCollection)
                };
                var response = (Vsd_UploadCpuAccountDocumentsResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new UploadResponseDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, "Unexpected error while uploading account document. Source = CPU");
                return BadRequest();
            }
        }

        [HttpPost("contract/{contractId}")]
        [ProducesResponseType(typeof(UploadResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<UploadResponseDto>> UploadContractDocument(
            [FromBody] FilePost model, string contractId)
        {
            if (!ModelState.IsValid)
            {
                var messages = string.Join("\n", ModelState.Values
                    .SelectMany(x => x.Errors)
                    .Select(x => x.ErrorMessage));
                _logger.Error(new Exception(messages),
                    $"API call to 'UploadContractDocument' made with invalid model state. Error is:\n{messages}\nSource = CPU");
                return BadRequest(ModelState);
            }

            if (!Guid.TryParse(contractId, out var contractGuid))
                return BadRequest("contractId must be a valid GUID.");

            try
            {
                var request = new Vsd_UploadCpuContractDocumentsRequest
                {
                    Target = new EntityReference("vsd_contract", contractGuid),
                    BusinessBcEId = model.BusinessBCeID,
                    UserBcEId = model.UserBCeID,
                    DocumentCollection = ToEntityCollection(model.DocumentCollection)
                };
                var response = (Vsd_UploadCpuContractDocumentsResponse)
                    await _organizationService.ExecuteAsync(request);

                return Ok(new UploadResponseDto
                {
                    IsSuccess = response.IsSuccess,
                    Result = response.Result ?? string.Empty
                });
            }
            catch (Exception e)
            {
                _logger.Error(e, "Unexpected error while uploading contract document. Source = CPU");
                return BadRequest();
            }
        }

        // ── Private helpers ──────────────────────────────────────────────────────

        /// <summary>Converts a portal document array to a Dataverse EntityCollection of activitymimeattachment entities.</summary>
        private static EntityCollection ToEntityCollection(DynamicsDocumentPost[] docs)
        {
            if (docs == null || docs.Length == 0)
                return new EntityCollection();

            var entities = docs.Select(d =>
            {
                var entity = new Entity("activitymimeattachment");
                entity["body"] = d.body;
                entity["filename"] = d.filename;
                entity["subject"] = d.subject;
                return entity;
            }).ToList();

            return new EntityCollection(entities);
        }

        private static string GetJArrayValue(Newtonsoft.Json.Linq.JObject jObject, string key)
        {
            foreach (KeyValuePair<string, Newtonsoft.Json.Linq.JToken> kvp in jObject)
            {
                if (key == kvp.Key)
                    return kvp.Value.ToString();
            }
            return string.Empty;
        }

        private static string StampSignaturePage(
            byte[] signaturePage, byte[] signature,
            string signingOfficerName, string signingOfficerTitle, bool hideSection)
        {
            using (var ms = new MemoryStream())
            {
                PdfReader pdfr = new PdfReader(signaturePage);
                PdfStamper pdfs = new PdfStamper(pdfr, ms);
                PdfContentByte content = pdfs.GetOverContent(1);

                Image image = iTextSharp.text.Image.GetInstance(signature);
                image.SetAbsolutePosition(84.0F, 475.0F);
                image.ScalePercent(29.0F, 25.0F);
                content.AddImage(image);

                if (hideSection)
                {
                    var hideBox = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8/58BAzAOZUEA5OUT9xiCXfgAAAAASUVORK5CYII=");
                    Image box = iTextSharp.text.Image.GetInstance(hideBox);
                    box.SetAbsolutePosition(65.0F, 708.0F);
                    box.ScalePercent(1300.0F, 150.0F);
                    content.AddImage(box);
                }

                PdfLayer layer = new PdfLayer("info-layer", pdfs.Writer);
                content.BeginLayer(layer);

                string[] months = { "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" };
                DateTime today = DateTime.UtcNow;
                string daySuffix = (today.Day % 10 == 1 && today.Day != 11) ? "st"
                    : (today.Day % 10 == 2 && today.Day != 12) ? "nd"
                    : (today.Day % 10 == 3 && today.Day != 13) ? "rd"
                    : "th";

                content.SetColorFill(BaseColor.BLACK);
                content.BeginText();
                content.SetFontAndSize(BaseFont.CreateFont(), 9);
                if (!string.IsNullOrEmpty(signingOfficerName))
                    content.ShowTextAligned(PdfContentByte.ALIGN_LEFT, signingOfficerName, 84.0F, 420.0F, 0.0F);
                if (!string.IsNullOrEmpty(signingOfficerTitle))
                    content.ShowTextAligned(PdfContentByte.ALIGN_LEFT, signingOfficerTitle, 84.0F, 370.0F, 0.0F);
                content.ShowTextAligned(PdfContentByte.ALIGN_LEFT, today.Day.ToString() + daySuffix, 152.0F, 624.0F, 0.0F);
                content.ShowTextAligned(PdfContentByte.ALIGN_RIGHT, months[today.Month - 1], 285.0F, 624.0F, 0.0F);
                content.ShowTextAligned(PdfContentByte.ALIGN_LEFT, today.Year.ToString().Substring(2), 304.0F, 624.5F, 0.0F);
                content.EndText();
                content.EndLayer();

                pdfs.Close();
                return Convert.ToBase64String(ms.ToArray());
            }
        }
    }
}
