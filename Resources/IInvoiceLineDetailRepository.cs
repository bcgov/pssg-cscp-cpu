﻿using Manager.Contract;

namespace Resources;

public interface IInvoiceLineDetailRepository
{
    Guid Insert(InvoiceLineDetail invoiceLineDetail);
    bool Delete(Guid id);
}