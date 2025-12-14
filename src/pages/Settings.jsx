import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { Save, Moon, Sun, Building, CreditCard, FileText, Upload, X, Image, Plus, Trash2, Edit2, Wallet, Loader2 } from 'lucide-react';
import './Settings.css';

function Settings() {
    const { state, dispatch } = useApp();
    const { settings, theme, bankAccounts, currencies } = state;
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Initialize with settings from context
    const [formData, setFormData] = useState({
        businessName: settings.businessName || '',
        businessEmail: settings.businessEmail || '',
        businessPhone: settings.businessPhone || '',
        businessAddress: settings.businessAddress || '',
        businessLogo: settings.businessLogo || null,
        defaultCurrency: settings.defaultCurrency || 'USD',
        defaultTaxRate: settings.defaultTaxRate || 0,
        invoicePrefix: settings.invoicePrefix || 'INV',
        invoiceNextNumber: settings.invoiceNextNumber || 1001,
        paymentTerms: settings.paymentTerms || 30,
    });

    // Update local form data when context settings load/change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            businessName: settings.businessName || '',
            businessEmail: settings.businessEmail || '',
            businessPhone: settings.businessPhone || '',
            businessAddress: settings.businessAddress || '',
            businessLogo: settings.businessLogo || null,
            defaultCurrency: settings.defaultCurrency || 'USD',
            defaultTaxRate: settings.defaultTaxRate || 0,
            invoicePrefix: settings.invoicePrefix || 'INV',
            invoiceNextNumber: settings.invoiceNextNumber || 1001,
            paymentTerms: settings.paymentTerms || 30,
        }));
    }, [settings]);

    const [activeTab, setActiveTab] = useState('business');

    const [saved, setSaved] = useState(false);
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [bankFormData, setBankFormData] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
        iban: '',
        currency: 'USD',
    });

    const handleSave = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: formData });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleTheme = () => {
        dispatch({ type: 'SET_THEME', payload: theme === 'dark' ? 'light' : 'dark' });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${state.user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, businessLogo: publicUrl }));
            dispatch({ type: 'UPDATE_SETTINGS', payload: { businessLogo: publicUrl } });

        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Error uploading logo!');
        } finally {
            setUploading(false);
        }
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, businessLogo: null }));
        dispatch({ type: 'UPDATE_SETTINGS', payload: { businessLogo: null } });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Bank Account Functions
    const openBankModal = (bank = null) => {
        if (bank) {
            setEditingBank(bank);
            setBankFormData({
                bankName: bank.bankName,
                accountName: bank.accountName,
                accountNumber: bank.accountNumber,
                routingNumber: bank.routingNumber || '',
                swiftCode: bank.swiftCode || '',
                iban: bank.iban || '',
                currency: bank.currency,
            });
        } else {
            setEditingBank(null);
            setBankFormData({
                bankName: '',
                accountName: '',
                accountNumber: '',
                routingNumber: '',
                swiftCode: '',
                iban: '',
                currency: 'USD',
            });
        }
        setBankModalOpen(true);
    };

    const closeBankModal = () => {
        setBankModalOpen(false);
        setEditingBank(null);
    };

    const handleBankSubmit = (e) => {
        e.preventDefault();
        if (editingBank) {
            dispatch({ type: 'UPDATE_BANK_ACCOUNT', payload: { id: editingBank.id, ...bankFormData } });
        } else {
            const newId = crypto.randomUUID();
            dispatch({ type: 'ADD_BANK_ACCOUNT', payload: { id: newId, ...bankFormData } });
        }
        closeBankModal();
    };

    const handleDeleteBank = (bankId) => {
        if (window.confirm('Are you sure you want to delete this bank account?')) {
            dispatch({ type: 'DELETE_BANK_ACCOUNT', payload: bankId });
        }
    };

    const tabs = [
        { id: 'business', label: 'Business Profile', icon: Building },
        { id: 'invoices', label: 'Invoice Settings', icon: FileText },
        { id: 'banking', label: 'Bank Accounts', icon: CreditCard },
        { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun },
    ];

    return (
        <div className="settings-page">
            <Header title="Settings">
                <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={18} />
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </Header>

            <div className="settings-container">
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="settings-content">

                    {/* Business Profile */}
                    {activeTab === 'business' && (
                        <div className="settings-section fade-in">
                            <div className="section-header">
                                <div>
                                    <h3 className="section-title">Business Profile</h3>
                                    <p className="section-description">Manage your company details and branding</p>
                                </div>
                            </div>

                            <div className="settings-form">
                                {/* Logo Upload */}
                                <div className="logo-upload-area">
                                    <label className="input-label">Business Logo</label>
                                    {formData.businessLogo ? (
                                        <div className="logo-preview">
                                            <img src={formData.businessLogo} alt="Business Logo" />
                                            <button className="remove-logo-btn" onClick={removeLogo}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className="logo-upload-placeholder"
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            <Image size={24} />
                                            <span>Click to upload logo</span>
                                            <span className="upload-hint">Max 2MB. JPG, PNG</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                    />
                                    {uploading && <div className="text-sm text-primary flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Uploading...</div>}
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Company Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="input"
                                            value={formData.businessEmail}
                                            onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            value={formData.businessPhone}
                                            onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Address</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={formData.businessAddress}
                                        onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoice Settings */}
                    {activeTab === 'invoices' && (
                        <div className="settings-section fade-in">
                            <div className="section-header">
                                <div>
                                    <h3 className="section-title">Invoice Settings</h3>
                                    <p className="section-description">Configure defaults for your invoices</p>
                                </div>
                            </div>

                            <div className="settings-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Invoice Prefix</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.invoicePrefix}
                                            onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Next Number</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={formData.invoiceNextNumber}
                                            onChange={(e) => setFormData({ ...formData, invoiceNextNumber: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Default Currency</label>
                                        <select
                                            className="input"
                                            value={formData.defaultCurrency}
                                            onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                                        >
                                            {currencies.map(curr => (
                                                <option key={curr.code} value={curr.code}>
                                                    {curr.symbol} {curr.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Default Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={formData.defaultTaxRate}
                                            onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Payment Terms (Days)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.paymentTerms}
                                        onChange={(e) => setFormData({ ...formData, paymentTerms: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bank Accounts */}
                    {activeTab === 'banking' && (
                        <div className="settings-section fade-in">
                            <div className="section-header">
                                <div>
                                    <h3 className="section-title">Bank Accounts</h3>
                                    <p className="section-description">Manage accounts for receiving payments</p>
                                </div>
                            </div>

                            <div className="bank-accounts-list">
                                {bankAccounts.length === 0 ? (
                                    <div className="empty-bank-state" onClick={() => openBankModal()}>
                                        <Wallet size={32} />
                                        <p>No bank accounts added</p>
                                        <span>Click to add your first bank account</span>
                                    </div>
                                ) : (
                                    <>
                                        {bankAccounts.map(bank => (
                                            <div key={bank.id} className="bank-account-card">
                                                <div className="bank-info">
                                                    <span className="bank-name">{bank.bankName}</span>
                                                    <div className="bank-details">
                                                        <span>{bank.accountName}</span>
                                                        <span>•</span>
                                                        <span>{bank.accountNumber}</span>
                                                    </div>
                                                </div>
                                                <div className="bank-actions">
                                                    <span className="bank-currency">{bank.currency}</span>
                                                    <button className="btn-icon sm" onClick={() => openBankModal(bank)}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button className="btn-icon sm" onClick={() => handleDeleteBank(bank.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="btn btn-secondary btn-sm" onClick={() => openBankModal()}>
                                            <Plus size={16} /> Add Another Account
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Appearance */}
                    {activeTab === 'appearance' && (
                        <div className="settings-section fade-in">
                            <div className="section-header">
                                <div>
                                    <h3 className="section-title">Appearance</h3>
                                    <p className="section-description">Customize the interface look and feel</p>
                                </div>
                            </div>

                            <div className="appearance-options">
                                <div className="theme-option">
                                    <button
                                        className={`theme-preview ${theme === 'light' ? 'active' : ''}`}
                                        onClick={() => dispatch({ type: 'SET_THEME', payload: 'light' })}
                                    >
                                        <Sun size={24} />
                                        <span>Light Mode</span>
                                    </button>
                                    <button
                                        className={`theme-preview ${theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => dispatch({ type: 'SET_THEME', payload: 'dark' })}
                                    >
                                        <Moon size={24} />
                                        <span>Dark Mode</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Bank Account Modal (Unchanged) */}
            {bankModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h3>{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</h3>
                            <button className="btn-icon" onClick={closeBankModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleBankSubmit}>
                            <div className="form-grid">
                                <div className="input-group full-width">
                                    <label className="input-label">Bank Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        value={bankFormData.bankName}
                                        onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                                        placeholder="e.g. Chase Bank"
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Account Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        value={bankFormData.accountName}
                                        onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                                        placeholder="e.g. John Doe Business"
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Account Number</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        value={bankFormData.accountNumber}
                                        onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Routing Number</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={bankFormData.routingNumber}
                                        onChange={(e) => setBankFormData({ ...bankFormData, routingNumber: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">SWIFT / BIC</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={bankFormData.swiftCode}
                                        onChange={(e) => setBankFormData({ ...bankFormData, swiftCode: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Currency</label>
                                    <select
                                        className="input"
                                        value={bankFormData.currency}
                                        onChange={(e) => setBankFormData({ ...bankFormData, currency: e.target.value })}
                                    >
                                        {currencies.map(curr => (
                                            <option key={curr.code} value={curr.code}>{curr.code}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={closeBankModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingBank ? 'Update Account' : 'Add Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
