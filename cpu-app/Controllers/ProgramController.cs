﻿using Manager;
using Manager.Contract;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using Gov.Cscp.Victims.Public.Background;
using Microsoft.Extensions.Hosting.Internal;
using Microsoft.Extensions.Hosting;

namespace Gov.Cscp.Victims.Public.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class ProgramController(
        IBackgroundTaskQueue taskQueue, IHostApplicationLifetime applicationLifetime, CurrencyHandlers currencyHandler, ProgramHandlers programHandlers, 
        InvoiceHandlers invoiceHandler, InvoiceLineDetailHandlers invoiceLineDetailHander, PaymentHandlers paymentHandler, ContractHandlers contractHandlers
    ) : Controller
    {
        private readonly CancellationToken _cancellationToken = applicationLifetime.ApplicationStopping;

        // TODO add ErrorHandler ActionFilter that returns 500 status code and logs the exception
        [HttpGet("Approved")]
        public async Task<IActionResult> GetApproved()
        {
            await taskQueue.QueueBackgroundWorkItemAsync(GetApprovedWorkItem);
            return new OkResult();
        }

        private async ValueTask GetApprovedWorkItem(CancellationToken token)
        {
            var provinceBc = new Guid("FDE4DBCA-989A-E811-8155-480FCFF4F6A1");

            // use CurrencyQuery to query "all the currencies that match this one currency code"
            // ok so regrettably I should have thought about what I was porting before porting it, this could probably be optimized e.g. just use the currency code directly?
            var currencyQuery = new FindCurrencyQuery();
            currencyQuery.StateCode = StateCode.Active;
            currencyQuery.IsoCurrencyCode = IsoCurrencyCode.CAD.ToString();
            var currencyResult = await currencyHandler.Handle(currencyQuery, token);
            
            var (quarter, invoiceDate) = GetInvoiceDate();

            var dummy = new GetApprovedCommand();
            var programResult = await programHandlers.Handle(dummy, token);

            var invoices = new List<Invoice>();
            foreach (var program in programResult.Programs) 
            {
                var invoiceQuery = new InvoiceQuery();
                invoiceQuery.ProgramId = program.Id;
                invoiceQuery.InvoiceDate = invoiceDate;
                invoiceQuery.Origin = Origin.AutoGenerated;
                // check if invoice has been already created
                var invoiceResult = await invoiceHandler.Handle(invoiceQuery, token);
                if (invoiceResult.Invoices.Any())
                {
                    continue;
                }

                var paymentQuery = new PaymentQuery();
                paymentQuery.ProgramId = program.Id;
                paymentQuery.ContractId = program.ContractId;
                paymentQuery.ExcludeStatusCodes = new List<PaymentStatusCode> { PaymentStatusCode.Negative, PaymentStatusCode.Canceled };
                var paymentResult = await paymentHandler.Handle(paymentQuery, token);
                var paymentTotal = paymentResult.Payments.Sum(p => p.PaymentTotal);
                var scheduledPaymentAmount = program.Subtotal - paymentTotal / (5 - quarter);
                if (scheduledPaymentAmount == 0)
                {
                    throw new Exception("Line item is zero.");
                }

                var invoice = new Invoice();
                invoice.Id = Guid.NewGuid();
                invoice.Origin = Origin.AutoGenerated;
                var contractQuery = new FindContractQuery();
                contractQuery.Id = program.ContractId;
                var customerResults = await contractHandlers.Handle(contractQuery, token);
                invoice.PayeeId = customerResults.Contract.Id;
                invoice.ContractId = program.ContractId;
                invoice.ProgramId = program.Id;
                invoice.CurrencyId = currencyResult.Currency.Id;
                invoice.ProgramUnit = ProgramUnit.Cpu;
                invoice.CvapInvoiceType = InvoiceType.OtherPayments;
                invoice.OwnerId = program.OwnerId;
                invoice.TaxExemption = TaxExemption.NoTax;
                invoice.InvoiceDate = invoiceDate;
                invoice.CpuScheduledPaymentDate = invoiceDate.AddDays(3);
                invoice.MethodOfPayment = customerResults.Contract.MethodOfPayment;
                invoice.CpuInvoiceType = CpuInvoiceType.ScheduledPayment;
                invoice.ProvinceStateId = provinceBc;
                invoice.PaymentAdviceComments = string.Format("{0}, {1}-{2}-{3}", program.ContractName, invoiceDate.AddDays(3).Day.ToString(), invoiceDate.AddDays(3).Month.ToString(), invoiceDate.AddDays(3).Year.ToString());
                await invoiceHandler.Handle(invoice);

                var invoiceLineDetail = new InvoiceLineDetail();
                invoiceLineDetail.InvoiceId = invoice.Id;
                invoiceLineDetail.OwnerId = program.OwnerId;
                invoiceLineDetail.InvoiceType = InvoiceType.OtherPayments;
                invoiceLineDetail.ProgramUnit = ProgramUnit.Cpu;
                invoiceLineDetail.Approved = YesNo.Yes;
                invoiceLineDetail.AmountSimple = scheduledPaymentAmount;
                invoiceLineDetail.ProvinceStateId = provinceBc;
                invoiceLineDetail.TaxExemption = invoice.TaxExemption;
                var invoiceLineDetailId = await invoiceLineDetailHander.Handle(invoiceLineDetail);

                invoices.Add(invoice);
            }
        }

        // NOTE based from GetInvoiceData method https://jag.gov.bc.ca/jira/secure/attachment/142853/QuarterlyProgramPaymentLogic.cs
        // what happens with dates Oct 16 to Dec 31, should it trigger quarter 1 and use next year's quarter?
        private Tuple<short, DateTime> GetInvoiceDate()
        {
            var firstQuarterDate = new DateTime(DateTime.Today.Year, 1, 15, DateTime.Today.Hour, DateTime.Today.Minute, DateTime.Today.Second, DateTimeKind.Local); //15th January
            var secondQuarterDate = new DateTime(DateTime.Today.Year, 4, 15, DateTime.Today.Hour, DateTime.Today.Minute, DateTime.Today.Second, DateTimeKind.Local); //15th April
            var thirdQuarterDate = new DateTime(DateTime.Today.Year, 7, 15, DateTime.Today.Hour, DateTime.Today.Minute, DateTime.Today.Second, DateTimeKind.Local); //15th July
            var fourthQuarterDate = new DateTime(DateTime.Today.Year, 10, 15, DateTime.Today.Hour, DateTime.Today.Minute, DateTime.Today.Second, DateTimeKind.Local); //15th October
            var fifthQuarterDate = new DateTime(DateTime.Today.Year + 1, 1, 15, DateTime.Today.Hour, DateTime.Today.Minute, DateTime.Today.Second, DateTimeKind.Local); //15th January next year

            if (DateTime.Today > firstQuarterDate && DateTime.Today <= secondQuarterDate)
            {
                return new Tuple<short, DateTime>(1, secondQuarterDate.AddDays(-3));
            }
            else if (DateTime.Today > secondQuarterDate && DateTime.Today <= thirdQuarterDate)
            {
                return new Tuple<short, DateTime>(2, thirdQuarterDate.AddDays(-3));
            }
            else if (DateTime.Today > thirdQuarterDate && DateTime.Today <= fourthQuarterDate)
            {
                return new Tuple<short, DateTime>(3, fourthQuarterDate.AddDays(-3));
            }
            else if (DateTime.Today <= firstQuarterDate)
            {
                return new Tuple<short, DateTime>(4, firstQuarterDate.AddDays(-3));
            }
            else
            {
                //throw new Exception("Invalid quarter number");
                return new Tuple<short, DateTime>(1, fifthQuarterDate.AddDays(-3));
            }
        }
    }
}
