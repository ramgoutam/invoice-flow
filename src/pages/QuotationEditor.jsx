import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import CustomDatePicker from '../components/CustomDatePicker';
import { ArrowLeft, Save, Send, Plus, Trash2, Download, Printer, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatDate, generateInvoiceNumber, calculateInvoiceTotals } from '../utils/helpers';
import { invoiceTemplates, getTemplateComponent } from '../components/InvoiceTemplates';
import './InvoiceEditor.css';
import '../components/InvoiceTemplates.css';

function QuotationEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { state, dispatch } = useApp();
    const { clients, quotations, settings, bankAccounts } = state;
    const printRef = useRef();
    const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);

    const isEditing = id && id !== 'new';
    const existingQuotation = isEditing ? quotations.find(q => q.id === id) : null;

    const [formData, setFormData] = useState({
        clientId: '',
        bankAccountId: '',
        quotationNumber: generateInvoiceNumber(settings.quotationPrefix, settings.quotationNextNumber),
        status: 'draft',
        issueDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ id: uuidv4(), description: '', quantity: 1, rate: 0 }],
        enableTax: false,
        taxRate: settings.defaultTaxRate,
        enableDiscount: false,
        discount: 0,
        currency: settings.defaultCurrency,
        notes: 'This quotation is valid for 30 days.',
    });

    const [selectedTemplate, setSelectedTemplate] = useState('classic');

    useEffect(() => {
        if (existingQuotation) {
            setFormData({
                clientId: existingQuotation.clientId,
                bankAccountId: existingQuotation.bankAccountId || '',
                quotationNumber: existingQuotation.quotationNumber,
                status: existingQuotation.status,
                issueDate: existingQuotation.issueDate,
                validUntil: existingQuotation.validUntil,
                items: existingQuotation.items,
                enableTax: existingQuotation.enableTax !== false,
                taxRate: existingQuotation.taxRate,
                enableDiscount: existingQuotation.enableDiscount || false,
                discount: existingQuotation.discount,
                currency: existingQuotation.currency,
                notes: existingQuotation.notes || '',
            });
        }
    }, [existingQuotation]);

    // Auto-download PDF when navigating with download=true parameter
    useEffect(() => {
        const shouldDownload = searchParams.get('download') === 'true';
        if (shouldDownload && existingQuotation && !autoDownloadTriggered && printRef.current) {
            setAutoDownloadTriggered(true);
            // Delay to ensure the preview is fully rendered
            const timer = setTimeout(async () => {
                await handleExportPDF();
                navigate('/quotations');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, existingQuotation, autoDownloadTriggered]);
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === formData.clientId);
    }, [clients, formData.clientId]);

    const selectedBank = useMemo(() => {
        return bankAccounts.find(b => b.id === formData.bankAccountId);
    }, [bankAccounts, formData.bankAccountId]);

    const totals = useMemo(() => {
        const effectiveTaxRate = formData.enableTax ? formData.taxRate : 0;
        const effectiveDiscount = formData.enableDiscount ? formData.discount : 0;
        return calculateInvoiceTotals(formData.items, effectiveTaxRate, effectiveDiscount);
    }, [formData.items, formData.taxRate, formData.discount, formData.enableTax, formData.enableDiscount]);

    const updateItem = (itemId, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
            ),
        }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: uuidv4(), description: '', quantity: 1, rate: 0 }],
        }));
    };

    const removeItem = (itemId) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter(item => item.id !== itemId),
            }));
        }
    };

    const handleSave = (status = formData.status) => {
        const quotationData = {
            ...formData,
            status,
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            discountAmount: totals.discountAmount,
            total: totals.total,
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_QUOTATION', payload: { id, ...quotationData } });
        } else {
            const newId = uuidv4();
            dispatch({ type: 'ADD_QUOTATION', payload: { ...quotationData, id: newId } });
        }
        navigate('/quotations');
    };

    const handleExportPDF = async () => {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = printRef.current;

        const opt = {
            margin: 10,
            filename: `${formData.quotationNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="invoice-editor-page">
            <Header title="">
                <Link to="/quotations" className="btn btn-ghost">
                    <ArrowLeft size={18} />
                    Back to Quotations
                </Link>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleExportPDF}>
                        <Download size={18} />
                        Export PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleSave('draft')}>
                        <Save size={18} />
                        Save Draft
                    </button>
                    <button className="btn btn-primary" onClick={() => handleSave('sent')}>
                        <Send size={18} />
                        Send Quotation
                    </button>
                </div>
            </Header>

            <div className="page-container">
                <div className="editor-layout">
                    {/* Form Section */}
                    <div className="editor-form glass-card">
                        <div className="form-section">
                            <h3 className="section-title">Quotation Details</h3>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label className="input-label">Quotation Number *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.quotationNumber}
                                        onChange={(e) => setFormData({ ...formData, quotationNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Client *</label>
                                    <select
                                        className="input"
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <CustomDatePicker
                                        label="Issue Date"
                                        selected={formData.issueDate}
                                        onChange={(date) => setFormData({ ...formData, issueDate: date })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <CustomDatePicker
                                        label="Valid Until"
                                        selected={formData.validUntil}
                                        onChange={(date) => setFormData({ ...formData, validUntil: date })}
                                        required
                                        minDate={new Date(formData.issueDate)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Currency *</label>
                                    <select
                                        className="input"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        required
                                    >
                                        {state.currencies.map(curr => (
                                            <option key={curr.code} value={curr.code}>
                                                {curr.symbol} {curr.code} - {curr.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Bank Account *</label>
                                    <select
                                        className="input"
                                        value={formData.bankAccountId}
                                        onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select bank account</option>
                                        {bankAccounts.map(bank => (
                                            <option key={bank.id} value={bank.id}>
                                                {bank.bankName} - ****{bank.accountNumber.slice(-4)} ({bank.currency})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="section-header">
                                <h3 className="section-title">Line Items</h3>
                                <button className="btn btn-ghost btn-sm" onClick={addItem}>
                                    <Plus size={16} />
                                    Add Item
                                </button>
                            </div>
                            <div className="items-list">
                                {formData.items.map((item) => (
                                    <div key={item.id} className="item-row">
                                        <div className="item-description">
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="item-quantity">
                                            <input
                                                type="number"
                                                className="input"
                                                placeholder="Qty"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="item-rate">
                                            <input
                                                type="number"
                                                className="input"
                                                placeholder="Rate"
                                                min="0"
                                                step="0.01"
                                                value={item.rate}
                                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="item-total">
                                            {formatCurrency(item.quantity * item.rate, formData.currency)}
                                        </div>
                                        <button
                                            className="btn-icon sm"
                                            onClick={() => removeItem(item.id)}
                                            disabled={formData.items.length <= 1}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="form-grid">
                                <div className="input-group">
                                    <div className="toggle-group">
                                        <span className="toggle-label">Apply Tax</span>
                                        <button
                                            type="button"
                                            className={`toggle-switch ${formData.enableTax ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, enableTax: !formData.enableTax })}
                                        >
                                            <span className="toggle-slider"></span>
                                        </button>
                                    </div>
                                    {formData.enableTax && (
                                        <div className="toggle-input-row">
                                            <input
                                                type="number"
                                                className="input"
                                                min="0"
                                                max="100"
                                                placeholder="Tax Rate (%)"
                                                value={formData.taxRate}
                                                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                                            />
                                            <span className="input-suffix">%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="input-group">
                                    <div className="toggle-group">
                                        <span className="toggle-label">Apply Discount</span>
                                        <button
                                            type="button"
                                            className={`toggle-switch ${formData.enableDiscount ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, enableDiscount: !formData.enableDiscount })}
                                        >
                                            <span className="toggle-slider"></span>
                                        </button>
                                    </div>
                                    {formData.enableDiscount && (
                                        <div className="toggle-input-row">
                                            <input
                                                type="number"
                                                className="input"
                                                min="0"
                                                max="100"
                                                placeholder="Discount (%)"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            />
                                            <span className="input-suffix">%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="input-group full-width">
                                    <label className="input-label">Notes</label>
                                    <textarea
                                        className="input"
                                        placeholder="Additional notes..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="totals-section">
                            <div className="totals-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(totals.subtotal, formData.currency)}</span>
                            </div>
                            {formData.enableDiscount && formData.discount > 0 && (
                                <div className="totals-row discount">
                                    <span>Discount ({formData.discount}%)</span>
                                    <span>-{formatCurrency(totals.discountAmount, formData.currency)}</span>
                                </div>
                            )}
                            {formData.enableTax && (
                                <div className="totals-row">
                                    <span>Tax ({formData.taxRate}%)</span>
                                    <span>{formatCurrency(totals.taxAmount, formData.currency)}</span>
                                </div>
                            )}
                            <div className="totals-row total">
                                <span>Total</span>
                                <span>{formatCurrency(totals.total, formData.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="editor-preview glass-card">
                        <div className="preview-header-bar">
                            <h3 className="preview-title">Preview</h3>

                        </div>
                        <div className="invoice-preview" ref={printRef}>
                            {(() => {
                                const TemplateComponent = getTemplateComponent(selectedTemplate);
                                return (
                                    <TemplateComponent
                                        formData={formData}
                                        settings={settings}
                                        selectedClient={selectedClient}
                                        selectedBank={selectedBank}
                                        totals={totals}
                                        documentType="quotation"
                                    />
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuotationEditor;
