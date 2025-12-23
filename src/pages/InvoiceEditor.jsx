import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import CustomDatePicker from '../components/CustomDatePicker';
import { ArrowLeft, Save, Send, Plus, Trash2, Download, Printer, Settings, X } from 'lucide-react';
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
        paymentTerms: 30, // Days until due
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ id: uuidv4(), description: '', quantity: 1, rate: 0 }],
        enableTax: false,
        taxRate: settings.defaultTaxRate,
        enableDiscount: false,
        discount: 0,
        currency: settings.defaultCurrency,
        notes: 'Thank you for your business!',
        billingType: 'quantity', // 'quantity' or 'hourly'
    });

    // New Client Modal State
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        secondaryPhone: '',
        address: '',
        notes: ''
    });

    const handleClientChange = (e) => {
        const value = e.target.value;
        if (value === 'add_new') {
            setIsClientModalOpen(true);
        } else {
            setFormData({ ...formData, clientId: value });
        }
    };

    const handleCreateClient = (e) => {
        e.preventDefault();
        const newClientId = uuidv4();
        const clientPayload = { ...newClient, id: newClientId };
        dispatch({ type: 'ADD_CLIENT', payload: clientPayload });
        setFormData({ ...formData, clientId: newClientId });
        setIsClientModalOpen(false);
        setNewClient({
            name: '',
            email: '',
            phone: '',
            secondaryPhone: '',
            address: '',
            notes: ''
        });
    };

    // New Bank Modal State
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [newBank, setNewBank] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
        iban: '',
        currency: settings.defaultCurrency
    });

    const handleBankChange = (e) => {
        const value = e.target.value;
        if (value === 'add_new') {
            setIsBankModalOpen(true);
        } else {
            setFormData({ ...formData, bankAccountId: value });
        }
    };

    const handleCreateBank = (e) => {
        e.preventDefault();
        const newBankId = uuidv4();
        const bankPayload = { ...newBank, id: newBankId };
        dispatch({ type: 'ADD_BANK_ACCOUNT', payload: bankPayload });
        setFormData({ ...formData, bankAccountId: newBankId });
        setIsBankModalOpen(false);
        setNewBank({
            bankName: '',
            accountName: '',
            accountNumber: '',
            routingNumber: '',
            swiftCode: '',
            iban: '',
            currency: settings.defaultCurrency
        });
    };

    const paymentTermsOptions = [
        { value: 0, label: 'Due on Receipt' },
        { value: 7, label: 'Net 7 (7 days)' },
        { value: 15, label: 'Net 15 (15 days)' },
        { value: 30, label: 'Net 30 (30 days)' },
        { value: 45, label: 'Net 45 (45 days)' },
        { value: 60, label: 'Net 60 (60 days)' },
        { value: 90, label: 'Net 90 (90 days)' },
        { value: -1, label: 'Custom' },
    ];

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

    const handlePaymentTermsChange = (days) => {
        const termsValue = parseInt(days);
        if (termsValue === -1) {
            // Custom - don't auto-calculate due date
            setFormData(prev => ({ ...prev, paymentTerms: termsValue }));
        } else {
            const issueDate = new Date(formData.issueDate);
            const dueDate = new Date(issueDate.getTime() + termsValue * 24 * 60 * 60 * 1000);
            setFormData(prev => ({
                ...prev,
                paymentTerms: termsValue,
                dueDate: dueDate.toISOString().split('T')[0]
            }));
        }
    };

    const handleIssueDateChange = (newIssueDate) => {
        if (formData.paymentTerms !== -1) {
            const issueDate = new Date(newIssueDate);
            const dueDate = new Date(issueDate.getTime() + formData.paymentTerms * 24 * 60 * 60 * 1000);
            setFormData(prev => ({
                ...prev,
                issueDate: newIssueDate,
                dueDate: dueDate.toISOString().split('T')[0]
            }));
        } else {
            setFormData(prev => ({ ...prev, issueDate: newIssueDate }));
        }
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
            <Header title="">
                <Link to="/invoices" className="btn btn-ghost">
                    <ArrowLeft size={18} />
                    Back to Invoices
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
                        Send Invoice
                    </button>
                </div>
            </Header>

            <div className="page-container">
                <div className="editor-layout">
                    {/* Form Section */}
                    <div className="editor-form glass-card">
                        <div className="form-section">
                            <h3 className="section-title">Invoice Details</h3>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label className="input-label">Invoice Number *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.invoiceNumber}
                                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Client *</label>
                                    <select
                                        className="input"
                                        value={formData.clientId}
                                        onChange={handleClientChange}
                                        required
                                    >
                                        <option value="">Select a client</option>
                                        <option value="add_new" className="text-primary font-medium">+ Add New Client</option>
                                        <option disabled>----------------</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <CustomDatePicker
                                        label="Issue Date"
                                        selected={formData.issueDate}
                                        onChange={handleIssueDateChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Payment Terms *</label>
                                    <select
                                        className="input"
                                        value={formData.paymentTerms}
                                        onChange={(e) => handlePaymentTermsChange(e.target.value)}
                                        required
                                    >
                                        {paymentTermsOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <CustomDatePicker
                                        label="Due Date"
                                        selected={formData.dueDate}
                                        onChange={(date) => setFormData({ ...formData, dueDate: date, paymentTerms: -1 })}
                                        required
                                        disabled={formData.paymentTerms !== -1}
                                        minDate={new Date(formData.issueDate)}
                                    />
                                    {formData.paymentTerms !== -1 && (
                                        <small className="input-hint">Auto-calculated based on payment terms</small>
                                    )}
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
                                        onChange={handleBankChange}
                                        required
                                    >
                                        <option value="">Select bank account</option>
                                        <option value="add_new" className="text-primary font-medium">+ Add New Bank Account</option>
                                        <option disabled>----------------</option>
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
                                    />
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
            {/* New Client Modal */}
            {isClientModalOpen && (
                <div className="modal-overlay" onClick={() => setIsClientModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Client</h3>
                            <button className="btn-icon" onClick={() => setIsClientModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClient}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Name *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Client name"
                                            value={newClient.name}
                                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Email *</label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="client@example.com"
                                            value={newClient.email}
                                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            placeholder="+1 (555) 000-0000"
                                            value={newClient.phone}
                                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Secondary Phone</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            placeholder="+1 (555) 000-0000"
                                            value={newClient.secondaryPhone}
                                            onChange={(e) => setNewClient({ ...newClient, secondaryPhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group full-width">
                                        <label className="input-label">Address</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="123 Main St, City, State"
                                            value={newClient.address}
                                            onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group full-width">
                                        <label className="input-label">Notes</label>
                                        <textarea
                                            className="input"
                                            placeholder="Additional notes..."
                                            value={newClient.notes}
                                            onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsClientModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Bank Modal */}
            {isBankModalOpen && (
                <div className="modal-overlay" onClick={() => setIsBankModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Bank Account</h3>
                            <button className="btn-icon" onClick={() => setIsBankModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBank}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Bank Name *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Bank Name"
                                            value={newBank.bankName}
                                            onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Account Name *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Account Holder Name"
                                            value={newBank.accountName}
                                            onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Account Number *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Account Number"
                                            value={newBank.accountNumber}
                                            onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Routing Number</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Routing Number"
                                            value={newBank.routingNumber}
                                            onChange={(e) => setNewBank({ ...newBank, routingNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">SWIFT / BIC</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="SWIFT Code"
                                            value={newBank.swiftCode}
                                            onChange={(e) => setNewBank({ ...newBank, swiftCode: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">IBAN</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="IBAN"
                                            value={newBank.iban}
                                            onChange={(e) => setNewBank({ ...newBank, iban: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Currency *</label>
                                        <select
                                            className="input"
                                            value={newBank.currency}
                                            onChange={(e) => setNewBank({ ...newBank, currency: e.target.value })}
                                            required
                                        >
                                            {state.currencies.map(curr => (
                                                <option key={curr.code} value={curr.code}>
                                                    {curr.symbol} {curr.code} - {curr.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsBankModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Bank Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InvoiceEditor;
