import { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ClassicTemplate } from './InvoiceTemplates';
import { calculateInvoiceTotals } from '../utils/helpers';
import './InvoiceTemplates.css';

export async function downloadInvoicePDF(invoice, client, bankAccount, settings) {
    const html2pdf = (await import('html2pdf.js')).default;

    // Prepare formData for the template
    const formData = {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        items: invoice.items || [],
        enableTax: invoice.enableTax !== false,
        taxRate: invoice.taxRate || 0,
        enableDiscount: invoice.enableDiscount || false,
        discount: invoice.discount || 0,
        currency: invoice.currency || 'USD',
        notes: invoice.notes || '',
        billingType: invoice.billingType || 'quantity',
    };

    // Calculate totals
    const effectiveTaxRate = formData.enableTax ? formData.taxRate : 0;
    const effectiveDiscount = formData.enableDiscount ? formData.discount : 0;
    const totals = calculateInvoiceTotals(formData.items, effectiveTaxRate, effectiveDiscount);

    // Create container with A4 width
    const container = document.createElement('div');
    container.id = 'pdf-render-container';
    container.style.cssText = 'position: fixed; left: 0; top: 0; width: 210mm; background: white; z-index: -9999; visibility: hidden; padding: 20px; box-sizing: border-box;';
    document.body.appendChild(container);

    // Add required styles
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/src/components/InvoiceTemplates.css';
    container.appendChild(styleLink);

    // Create wrapper div for React
    const reactRoot = document.createElement('div');
    reactRoot.className = 'invoice-preview print-mode';
    container.appendChild(reactRoot);

    // Render the template
    const root = ReactDOM.createRoot(reactRoot);
    root.render(
        <ClassicTemplate
            formData={formData}
            settings={settings || {}}
            selectedClient={client}
            selectedBank={bankAccount}
            totals={totals}
            documentType="invoice"
        />
    );

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 800));

    const opt = {
        margin: 5,
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
        await html2pdf().set(opt).from(reactRoot).save();
    } finally {
        root.unmount();
        document.body.removeChild(container);
    }
}

export async function downloadQuotationPDF(quotation, client, bankAccount, settings) {
    const html2pdf = (await import('html2pdf.js')).default;

    // Prepare formData for the template
    const formData = {
        quotationNumber: quotation.quotationNumber,
        issueDate: quotation.issueDate,
        validUntil: quotation.validUntil,
        items: quotation.items || [],
        enableTax: quotation.enableTax !== false,
        taxRate: quotation.taxRate || 0,
        enableDiscount: quotation.enableDiscount || false,
        discount: quotation.discount || 0,
        currency: quotation.currency || 'USD',
        notes: quotation.notes || '',
        billingType: quotation.billingType || 'quantity',
    };

    // Calculate totals
    const effectiveTaxRate = formData.enableTax ? formData.taxRate : 0;
    const effectiveDiscount = formData.enableDiscount ? formData.discount : 0;
    const totals = calculateInvoiceTotals(formData.items, effectiveTaxRate, effectiveDiscount);

    // Create container with A4 width
    const container = document.createElement('div');
    container.id = 'pdf-render-container';
    container.style.cssText = 'position: fixed; left: 0; top: 0; width: 210mm; background: white; z-index: -9999; visibility: hidden; padding: 20px; box-sizing: border-box;';
    document.body.appendChild(container);

    // Create wrapper div for React
    const reactRoot = document.createElement('div');
    reactRoot.className = 'invoice-preview print-mode';
    container.appendChild(reactRoot);

    // Render the template
    const root = ReactDOM.createRoot(reactRoot);
    root.render(
        <ClassicTemplate
            formData={formData}
            settings={settings || {}}
            selectedClient={client}
            selectedBank={bankAccount}
            totals={totals}
            documentType="quotation"
        />
    );

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 800));

    const opt = {
        margin: 5,
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
        await html2pdf().set(opt).from(reactRoot).save();
    } finally {
        root.unmount();
        document.body.removeChild(container);
    }
}
