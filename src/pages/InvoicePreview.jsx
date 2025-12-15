import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { ArrowLeft, Download, Edit2, Printer } from 'lucide-react';
import { calculateInvoiceTotals } from '../utils/helpers';
import { ClassicTemplate } from '../components/InvoiceTemplates';
import { downloadInvoicePDF } from '../components/PDFDownloader';
import './InvoicePreview.css';
import '../components/InvoiceTemplates.css';

function InvoicePreview() {
    const { id } = useParams();
    const { state } = useApp();
    const { clients, invoices, settings, bankAccounts } = state;

    const invoice = invoices.find(inv => inv.id === id);

    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === invoice?.clientId);
    }, [clients, invoice?.clientId]);

    const selectedBank = useMemo(() => {
        return bankAccounts.find(b => b.id === invoice?.bankAccountId);
    }, [bankAccounts, invoice?.bankAccountId]);

    const formData = useMemo(() => {
        if (!invoice) return null;
        return {
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
    }, [invoice]);

    const totals = useMemo(() => {
        if (!formData) return { subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 };
        const effectiveTaxRate = formData.enableTax ? formData.taxRate : 0;
        const effectiveDiscount = formData.enableDiscount ? formData.discount : 0;
        return calculateInvoiceTotals(formData.items, effectiveTaxRate, effectiveDiscount);
    }, [formData]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (invoice) {
            await downloadInvoicePDF(invoice, selectedClient, selectedBank, settings);
        }
    };

    if (!invoice) {
        return (
            <div className="invoice-preview-page">
                <Header title="Invoice Preview" />
                <div className="page-container">
                    <div className="empty-state">
                        <h3>Invoice not found</h3>
                        <Link to="/invoices" className="btn btn-primary">
                            Back to Invoices
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="invoice-preview-page">
            <Header title="Invoice Preview" />

            <div className="page-container">
                <div className="preview-header">
                    <Link to="/invoices" className="btn btn-ghost">
                        <ArrowLeft size={18} />
                        Back to Invoices
                    </Link>
                    <div className="preview-actions">
                        <Link to={`/invoices/${id}/edit`} className="btn btn-secondary">
                            <Edit2 size={18} />
                            Edit
                        </Link>
                        <button className="btn btn-secondary" onClick={handlePrint}>
                            <Printer size={18} />
                            Print
                        </button>
                        <button className="btn btn-primary" onClick={handleDownload}>
                            <Download size={18} />
                            Export PDF
                        </button>
                    </div>
                </div>

                <div className="preview-container">
                    <div className="invoice-preview print-mode">
                        <ClassicTemplate
                            formData={formData}
                            settings={settings}
                            selectedClient={selectedClient}
                            selectedBank={selectedBank}
                            totals={totals}
                            documentType="invoice"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoicePreview;
