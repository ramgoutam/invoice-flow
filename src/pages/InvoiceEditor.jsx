import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { ArrowLeft, Save, Send, Plus, Trash2, Download, Printer, Settings } from 'lucide-react';
import { formatCurrency, formatDate, generateInvoiceNumber, calculateInvoiceTotals, getInitials } from '../utils/helpers';
import { invoiceTemplates, getTemplateComponent } from '../components/InvoiceTemplates';
import { v4 as uuidv4 } from 'uuid';
import './InvoiceEditor.css';
import '../components/InvoiceTemplates.css';

function InvoiceEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { state, dispatch } = useApp();
    const { clients, invoices, settings, bankAccounts } = state;
    const printRef = useRef();
    const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);

    const isEditing = id && id !== 'new';
    const existingInvoice = isEditing ? invoices.find(inv => inv.id === id) : null;

    const [formData, setFormData] = useState({
        clientId: '',
        bankAccountId: '',
        invoiceNumber: generateInvoiceNumber(settings.invoicePrefix, settings.invoiceNextNumber),
        status: 'draft',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + settings.paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ id: uuidv4(), description: '', quantity: 1, rate: 0 }],
        enableTax: true,
        taxRate: settings.defaultTaxRate,
        enableDiscount: false,
        discount: 0,
        currency: settings.defaultCurrency,
        notes: 'Thank you for your business!',
        billingType: 'quantity', // 'quantity' or 'hourly'
    });

    const [selectedTemplate, setSelectedTemplate] = useState('classic');

    useEffect(() => {
        if (existingInvoice) {
            setFormData({
                clientId: existingInvoice.clientId,
                bankAccountId: existingInvoice.bankAccountId || '',
                invoiceNumber: existingInvoice.invoiceNumber,
                status: existingInvoice.status,
                issueDate: existingInvoice.issueDate,
                dueDate: existingInvoice.dueDate,
                items: existingInvoice.items,
                enableTax: existingInvoice.enableTax !== false,
                taxRate: existingInvoice.taxRate,
                enableDiscount: existingInvoice.enableDiscount || false,
                discount: existingInvoice.discount,
                currency: existingInvoice.currency,
                notes: existingInvoice.notes || '',
                billingType: existingInvoice.billingType || 'quantity',
            });
        }
    }, [existingInvoice]);

    // Auto-download PDF when navigating with download=true parameter
    useEffect(() => {
        const shouldDownload = searchParams.get('download') === 'true';
        if (shouldDownload && existingInvoice && !autoDownloadTriggered && printRef.current) {
            setAutoDownloadTriggered(true);
            // Delay to ensure the preview is fully rendered
            const timer = setTimeout(async () => {
                await handleExportPDF();
                navigate('/invoices');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, existingInvoice, autoDownloadTriggered]);

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
        const invoiceData = {
            ...formData,
            status,
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            discountAmount: totals.discountAmount,
            total: totals.total,
        };

        if (isEditing) {
            dispatch({ type: 'UPDATE_INVOICE', payload: { id, ...invoiceData } });
        } else {
            const newId = uuidv4();
            dispatch({ type: 'ADD_INVOICE', payload: { ...invoiceData, id: newId } });
        }
        navigate('/invoices');
    };

    const handleExportPDF = async () => {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = printRef.current;

        const opt = {
            margin: 10,
            filename: `${formData.invoiceNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="invoice-editor-page">
            <Header title={isEditing ? 'Edit Invoice' : 'New Invoice'} />

            <div className="page-container">
                <div className="editor-header">
                    <Link to="/invoices" className="btn btn-ghost">
                        <ArrowLeft size={18} />
                        Back to Invoices
                    </Link>
                    <div className="editor-actions">
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
                            Send Invoice
                        </button>
                    </div>
                </div>

                <div className="editor-layout">
                    {/* Form Section */}
                    <div className="editor-form glass-card">
                        <div className="form-section">
                            <h3 className="section-title">Invoice Details</h3>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label className="input-label">Invoice Number</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.invoiceNumber}
                                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
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
                                    <label className="input-label">Issue Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.issueDate}
                                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Due Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Currency</label>
                                    <select
                                        className="input"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        {state.currencies.map(curr => (
                                            <option key={curr.code} value={curr.code}>
                                                {curr.symbol} {curr.code} - {curr.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Bank Account</label>
                                    <select
                                        className="input"
                                        value={formData.bankAccountId}
                                        onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                    >
                                        <option value="">Select bank account (optional)</option>
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
                                <div className="billing-type-toggle">
                                    <label className={`toggle-option ${formData.billingType === 'quantity' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="billingType"
                                            value="quantity"
                                            checked={formData.billingType === 'quantity'}
                                            onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                                            style={{ display: 'none' }}
                                        />
                                        Quantity
                                    </label>
                                    <label className={`toggle-option ${formData.billingType === 'hourly' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="billingType"
                                            value="hourly"
                                            checked={formData.billingType === 'hourly'}
                                            onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                                            style={{ display: 'none' }}
                                        />
                                        Hourly
                                    </label>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={addItem}>
                                    <Plus size={16} />
                                    Add Item
                                </button>
                            </div>
                            <div className="items-list">
                                {formData.items.map((item, index) => (
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
                                                placeholder={formData.billingType === 'hourly' ? "Hrs" : "Qty"}
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="item-rate">
                                            <input
                                                type="number"
                                                className="input"
                                                placeholder={formData.billingType === 'hourly' ? "Rate/Hr" : "Rate"}
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
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.enableTax}
                                            onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                                        />
                                        Apply Tax
                                    </label>
                                    {formData.enableTax && (
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            max="100"
                                            placeholder="Tax Rate (%)"
                                            value={formData.taxRate}
                                            onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                                            style={{ marginTop: '8px' }}
                                        />
                                    )}
                                </div>
                                <div className="input-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.enableDiscount}
                                            onChange={(e) => setFormData({ ...formData, enableDiscount: e.target.checked })}
                                        />
                                        Apply Discount
                                    </label>
                                    {formData.enableDiscount && (
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            max="100"
                                            placeholder="Discount (%)"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            style={{ marginTop: '8px' }}
                                        />
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

export default InvoiceEditor;
