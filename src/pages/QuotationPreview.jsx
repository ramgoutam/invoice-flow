import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { ArrowLeft, Download, Edit2, Printer } from 'lucide-react';
import { calculateInvoiceTotals } from '../utils/helpers';
import { ClassicTemplate } from '../components/InvoiceTemplates';
import { downloadQuotationPDF } from '../components/PDFDownloader';
import './InvoicePreview.css';
import '../components/InvoiceTemplates.css';

function QuotationPreview() {
    const { id } = useParams();
    const { state } = useApp();
    const { clients, quotations, settings, bankAccounts } = state;

    const quotation = quotations.find(q => q.id === id);

    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === quotation?.clientId);
    }, [clients, quotation?.clientId]);

    const selectedBank = useMemo(() => {
        return bankAccounts.find(b => b.id === quotation?.bankAccountId);
    }, [bankAccounts, quotation?.bankAccountId]);

    const formData = useMemo(() => {
        if (!quotation) return null;
        return {
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
    }, [quotation]);

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
        if (quotation) {
            await downloadQuotationPDF(quotation, selectedClient, selectedBank, settings);
        }
    };

    if (!quotation) {
        return (
            <div className="invoice-preview-page">
                <Header title="Quotation Preview" />
                <div className="page-container">
                    <div className="empty-state">
                        <h3>Quotation not found</h3>
                        <Link to="/quotations" className="btn btn-primary">
                            Back to Quotations
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="invoice-preview-page">
            <Header title="Quotation Preview" />

            <div className="page-container">
                <div className="preview-header">
                    <Link to="/quotations" className="btn btn-ghost">
                        <ArrowLeft size={18} />
                        Back to Quotations
                    </Link>
                    <div className="preview-actions">
                        <Link to={`/quotations/${id}/edit`} className="btn btn-secondary">
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
                            documentType="quotation"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuotationPreview;
