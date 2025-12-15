import { formatCurrency, formatDate } from './helpers';

export async function exportInvoicePDF(invoice, client, bankAccount, settings) {
    const html2pdf = (await import('html2pdf.js')).default;

    const html = generateInvoiceHTML(invoice, client, bankAccount, settings);

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.background = 'white';
    container.style.zIndex = '-1000';
    container.style.visibility = 'hidden';
    document.body.appendChild(container);

    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const opt = {
        margin: 10,
        filename: `${invoice.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(container).save();
    } finally {
        document.body.removeChild(container);
    }
}

export async function exportQuotationPDF(quotation, client, bankAccount, settings) {
    const html2pdf = (await import('html2pdf.js')).default;

    const html = generateQuotationHTML(quotation, client, bankAccount, settings);

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.background = 'white';
    container.style.zIndex = '-1000';
    container.style.visibility = 'hidden';
    document.body.appendChild(container);

    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const opt = {
        margin: 10,
        filename: `${quotation.quotationNumber || 'quotation'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(container).save();
    } finally {
        document.body.removeChild(container);
    }
}

function generateInvoiceHTML(invoice, client, bankAccount, settings) {
    const items = invoice.items || [];
    const currency = invoice.currency || 'USD';

    let itemsHTML = '';
    items.forEach(item => {
        const qty = item.quantity || 0;
        const rate = item.rate || 0;
        const amount = qty * rate;
        itemsHTML += `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.description || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${qty}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(rate, currency)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(amount, currency)}</td>
            </tr>
        `;
    });

    if (items.length === 0) {
        itemsHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No items</td></tr>`;
    }

    const subtotal = invoice.subtotal || 0;
    const discountAmount = invoice.discountAmount || 0;
    const taxAmount = invoice.taxAmount || 0;
    const total = invoice.total || 0;

    const logoHTML = settings?.businessLogo
        ? `<img src="${settings.businessLogo}" alt="Logo" style="max-height: 60px; max-width: 200px; margin-bottom: 10px; object-fit: contain;">`
        : '';

    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white; color: #1f2937;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div style="flex: 1;">
                    ${logoHTML}
                    <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 20px;">${settings?.businessName || 'Your Business'}</h2>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${settings?.businessEmail || ''}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${settings?.businessPhone || ''}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px; white-space: pre-line;">${settings?.businessAddress || ''}</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="margin: 0 0 12px 0; font-size: 36px; color: #3b82f6; font-weight: 700;">INVOICE</h1>
                    <p style="margin: 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${invoice.invoiceNumber || 'INV-0001'}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">Issue Date: ${formatDate(invoice.issueDate)}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">Due Date: ${formatDate(invoice.dueDate)}</p>
                    <span style="display: inline-block; margin-top: 8px; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: ${invoice.status === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${invoice.status === 'paid' ? '#166534' : '#92400e'};">${invoice.status || 'draft'}</span>
                </div>
            </div>

            <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Bill To</h3>
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 15px;">${client?.name || 'Client Name'}</p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${client?.email || ''}</p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 13px; white-space: pre-line;">${client?.address || ''}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 13px;">Description</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; font-size: 13px;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Rate</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                <div style="width: 280px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280; font-size: 14px;">Subtotal</span>
                        <span style="font-weight: 600; color: #1f2937;">${formatCurrency(subtotal, currency)}</span>
                    </div>
                    ${invoice.enableDiscount && discountAmount > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 14px;">Discount (${invoice.discount || 0}%)</span>
                            <span style="color: #ef4444;">-${formatCurrency(discountAmount, currency)}</span>
                        </div>
                    ` : ''}
                    ${invoice.enableTax && taxAmount > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 14px;">Tax (${invoice.taxRate || 0}%)</span>
                            <span style="color: #1f2937;">${formatCurrency(taxAmount, currency)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 14px 0; font-size: 18px; font-weight: 700; color: #1f2937;">
                        <span>Total</span>
                        <span>${formatCurrency(total, currency)}</span>
                    </div>
                </div>
            </div>

            ${bankAccount ? `
                <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Payment Details</h3>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 13px;"><strong style="color: #374151;">Bank:</strong> ${bankAccount.bankName}</p>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 13px;"><strong style="color: #374151;">Account Name:</strong> ${bankAccount.accountName}</p>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 13px;"><strong style="color: #374151;">Account No:</strong> ${bankAccount.accountNumber}</p>
                    ${bankAccount.swiftCode ? `<p style="margin: 5px 0; color: #6b7280; font-size: 13px;"><strong style="color: #374151;">SWIFT:</strong> ${bankAccount.swiftCode}</p>` : ''}
                </div>
            ` : ''}

            ${invoice.notes ? `
                <div style="padding: 16px; background: #fefce8; border-radius: 8px; border-left: 4px solid #eab308;">
                    <p style="margin: 0; color: #713f12; font-size: 13px;">${invoice.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function generateQuotationHTML(quotation, client, bankAccount, settings) {
    const items = quotation.items || [];
    const currency = quotation.currency || 'USD';

    let itemsHTML = '';
    items.forEach(item => {
        const qty = item.quantity || 0;
        const rate = item.rate || 0;
        const amount = qty * rate;
        itemsHTML += `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.description || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${qty}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(rate, currency)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(amount, currency)}</td>
            </tr>
        `;
    });

    if (items.length === 0) {
        itemsHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No items</td></tr>`;
    }

    const subtotal = quotation.subtotal || 0;
    const discountAmount = quotation.discountAmount || 0;
    const taxAmount = quotation.taxAmount || 0;
    const total = quotation.total || 0;

    const logoHTML = settings?.businessLogo
        ? `<img src="${settings.businessLogo}" alt="Logo" style="max-height: 60px; max-width: 200px; margin-bottom: 10px; object-fit: contain;">`
        : '';

    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white; color: #1f2937;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div style="flex: 1;">
                    ${logoHTML}
                    <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 20px;">${settings?.businessName || 'Your Business'}</h2>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${settings?.businessEmail || ''}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${settings?.businessPhone || ''}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px; white-space: pre-line;">${settings?.businessAddress || ''}</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="margin: 0 0 12px 0; font-size: 36px; color: #8b5cf6; font-weight: 700;">QUOTATION</h1>
                    <p style="margin: 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${quotation.quotationNumber || 'QUO-0001'}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">Issue Date: ${formatDate(quotation.issueDate)}</p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">Valid Until: ${formatDate(quotation.validUntil)}</p>
                    <span style="display: inline-block; margin-top: 8px; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: #e0e7ff; color: #3730a3;">${quotation.status || 'draft'}</span>
                </div>
            </div>

            <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Prepared For</h3>
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 15px;">${client?.name || 'Client Name'}</p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${client?.email || ''}</p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 13px; white-space: pre-line;">${client?.address || ''}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 13px;">Description</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; font-size: 13px;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Rate</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                <div style="width: 280px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280; font-size: 14px;">Subtotal</span>
                        <span style="font-weight: 600; color: #1f2937;">${formatCurrency(subtotal, currency)}</span>
                    </div>
                    ${quotation.enableDiscount && discountAmount > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 14px;">Discount (${quotation.discount || 0}%)</span>
                            <span style="color: #ef4444;">-${formatCurrency(discountAmount, currency)}</span>
                        </div>
                    ` : ''}
                    ${quotation.enableTax && taxAmount > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 14px;">Tax (${quotation.taxRate || 0}%)</span>
                            <span style="color: #1f2937;">${formatCurrency(taxAmount, currency)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 14px 0; font-size: 18px; font-weight: 700; color: #1f2937;">
                        <span>Total</span>
                        <span>${formatCurrency(total, currency)}</span>
                    </div>
                </div>
            </div>

            ${quotation.notes ? `
                <div style="padding: 16px; background: #fefce8; border-radius: 8px; border-left: 4px solid #eab308;">
                    <p style="margin: 0; color: #713f12; font-size: 13px;">${quotation.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
}
