﻿namespace Manager.Contract;

public enum Origin
{
    AutoGenerated = 100000002,
    Email = 100000001,
    Manual = 100000003,
    Web = 100000000,
}

public record InvoiceQuery : IRequest<InvoiceResult>
{
    public Guid? ProgramId { get; set; }
    public Origin? Origin { get; set; }
    public DateTime? InvoiceDate { get; set; }
}

public record InvoiceResult(IEnumerable<Invoice> Invoices);

public record Invoice
{
    public Guid Id { get; set; }
    public StateCode StateCode { get; set; }
    public StatusCode StatusCode { get; set; }
    public string Name { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? OwnerId { get; set; }
}
