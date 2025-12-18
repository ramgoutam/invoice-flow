import { formatCurrency, formatDate } from '../utils/helpers';

// Template 1: Classic (current design)
export function ClassicTemplate({ formData, settings, selectedClient, selectedBank, totals, documentType = 'invoice' }) {
    const isQuotation = documentType === 'quotation';
    const docNumber = isQuotation ? formData.quotationNumber : formData.invoiceNumber;
    const dateLabel = isQuotation ? 'Valid Until' : 'Due';
    const dateValue = isQuotation ? formData.validUntil : formData.dueDate;

    return (
        <div className="invoice-template classic">
            <div className="invoice-main-content">
                <div className="preview-header">
                    <div className="preview-logo-section">
                        {settings.businessLogo && (
                            <img src={settings.businessLogo} alt="Logo" className="preview-logo" />
                        )}
                    </div>
                    <div className="preview-invoice-info">
                        <h1 className="preview-invoice-title">{isQuotation ? 'QUOTATION' : 'INVOICE'}</h1>
                        <p><strong>{docNumber}</strong></p>
                        <p className="text-muted">Date: {formatDate(formData.issueDate)}</p>
                        <p className="text-muted">{dateLabel}: {formatDate(dateValue)}</p>
                    </div>
                </div>

                <div className="preview-addresses">
                    <div className="preview-from">
                        <h4>From:</h4>
                        <p><strong>{settings.businessName}</strong></p>
                        <p>{settings.businessEmail}</p>
                        <p>{settings.businessPhone}</p>
                        <p>{settings.businessAddress}</p>
                    </div>
                    <div className="preview-to">
                        <h4>Bill To:</h4>
                        {selectedClient ? (
                            <>
                                <p><strong>{selectedClient.name}</strong></p>
                                <p>{selectedClient.email}</p>
                                <p>{selectedClient.address}</p>
                            </>
                        ) : (
                            <p className="text-muted">Select a client</p>
                        )}
                    </div>
                </div>

                <table className="preview-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>{formData.billingType === 'hourly' ? 'Hours' : 'Qty'}</th>
                            <th>{formData.billingType === 'hourly' ? 'Rate/Hr' : 'Rate'}</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.items.map(item => (
                            <tr key={item.id}>
                                <td>{item.description || '-'}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.rate, formData.currency)}</td>
                                <td>{formatCurrency(item.quantity * item.rate, formData.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="preview-totals">
                    <div className="preview-totals-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totals.subtotal, formData.currency)}</span>
                    </div>
                    {formData.enableDiscount && formData.discount > 0 && (
                        <div className="preview-totals-row">
                            <span>Discount ({formData.discount}%)</span>
                            <span>-{formatCurrency(totals.discountAmount, formData.currency)}</span>
                        </div>
                    )}
                    {formData.enableTax && (
                        <div className="preview-totals-row">
                            <span>Tax ({formData.taxRate}%)</span>
                            <span>{formatCurrency(totals.taxAmount, formData.currency)}</span>
                        </div>
                    )}
                    <div className="preview-totals-row total">
                        <span>Total Due</span>
                        <span>{formatCurrency(totals.total, formData.currency)}</span>
                    </div>
                </div>
            </div>

            <div className="invoice-footer">
                {formData.notes && (
                    <div className="preview-notes">
                        <h4>Notes</h4>
                        <p>{formData.notes}</p>
                    </div>
                )}

                {selectedBank && (
                    <div className="preview-payment-details">
                        <h4>Bank Details</h4>
                        <div className="bank-detail"><label>Bank</label>{selectedBank.bankName}</div>
                        <div className="bank-detail"><label>Account Name</label>{selectedBank.accountName}</div>
                        <div className="bank-detail"><label>Account No.</label>{selectedBank.accountNumber}</div>
                        {selectedBank.routingNumber && <div className="bank-detail"><label>Routing No.</label>{selectedBank.routingNumber}</div>}
                        {selectedBank.swiftCode && <div className="bank-detail"><label>SWIFT</label>{selectedBank.swiftCode}</div>}
                        {selectedBank.iban && <div className="bank-detail"><label>IBAN</label>{selectedBank.iban}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

// Template selector component
export const invoiceTemplates = [
    { id: 'classic', name: 'Standard', description: 'Professional invoice layout' },
];

export function getTemplateComponent(templateId) {
    return ClassicTemplate;
}
