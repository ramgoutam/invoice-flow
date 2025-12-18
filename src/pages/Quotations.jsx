import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Plus, Search, Trash2, Eye, Download, ArrowRight, FileText } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { downloadQuotationPDF } from '../components/PDFDownloader';
import ConfirmDialog from '../components/ConfirmDialog';
import './Invoices.css';

function Quotations() {
    const { state, dispatch } = useApp();
    const { quotations, clients, settings } = state;

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, quotationId: null });

    const statuses = [
        { value: 'all', label: 'All' },
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'expired', label: 'Expired' },
    ];

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : 'Unknown Client';
    };

    const filteredQuotations = useMemo(() => {
        return quotations
            .filter(quotation => {
                const matchesSearch = quotation.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    getClientName(quotation.clientId).toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [quotations, searchQuery, statusFilter, clients]);

    const handleDelete = (id) => {
        setDeleteConfirm({ isOpen: true, quotationId: id });
    };

    const confirmDelete = () => {
        if (deleteConfirm.quotationId) {
            dispatch({ type: 'DELETE_QUOTATION', payload: deleteConfirm.quotationId });
        }
    };

    const handleConvertToInvoice = (quotation) => {
        const invoiceData = {
            clientId: quotation.clientId,
            bankAccountId: quotation.bankAccountId || '',
            invoiceNumber: `INV-${settings.invoiceNextNumber}`,
            status: 'draft',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + settings.paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: quotation.items,
            enableTax: quotation.enableTax,
            taxRate: quotation.taxRate,
            enableDiscount: quotation.enableDiscount,
            discount: quotation.discount,
            currency: quotation.currency,
            notes: quotation.notes,
            subtotal: quotation.subtotal,
            taxAmount: quotation.taxAmount,
            discountAmount: quotation.discountAmount,
            total: quotation.total,
        };
        dispatch({ type: 'ADD_INVOICE', payload: invoiceData });
        dispatch({ type: 'UPDATE_QUOTATION', payload: { id: quotation.id, status: 'accepted' } });
        alert('Quotation converted to invoice successfully!');
    };

    const handleDownload = async (quotation) => {
        const client = clients.find(c => c.id === quotation.clientId);
        const bankAccount = state.bankAccounts?.find(b => b.id === quotation.bankAccountId);
        await downloadQuotationPDF(quotation, client, bankAccount, settings);
    };

    return (
        <div className="invoices-page">
            <Header title="">
                <h2 className="header-page-title">Quotations</h2>
                <Link to="/quotations/new" className="btn btn-primary">
                    <Plus size={18} />
                    New Quotation
                </Link>
            </Header>

            <div className="page-container">
                <div className="invoices-toolbar">
                    <div className="input-icon-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
                        <Search size={18} className="icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search quotations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="status-filters">
                        {statuses.map(status => (
                            <button
                                key={status.value}
                                className={`filter-btn filter-${status.value} ${statusFilter === status.value ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status.value)}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredQuotations.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h3 className="empty-state-title">No quotations found</h3>
                        <p className="empty-state-description">
                            {quotations.length === 0
                                ? 'Create your first quotation to get started.'
                                : 'Try adjusting your search or filter.'}
                        </p>
                        {quotations.length === 0 && (
                            <Link to="/quotations/new" className="btn btn-primary">
                                <Plus size={18} />
                                Create Quotation
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Quotation #</th>
                                    <th>Client</th>
                                    <th>Issue Date</th>
                                    <th>Valid Until</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuotations.map(quotation => (
                                    <tr key={quotation.id}>
                                        <td>
                                            <Link to={`/quotations/${quotation.id}`} className="invoice-link">
                                                {quotation.quotationNumber}
                                            </Link>
                                        </td>
                                        <td>{getClientName(quotation.clientId)}</td>
                                        <td>{formatDate(quotation.issueDate)}</td>
                                        <td>{formatDate(quotation.validUntil)}</td>
                                        <td>{formatCurrency(quotation.total, quotation.currency)}</td>
                                        <td>
                                            <span className={`badge badge-${getStatusColor(quotation.status)}`}>
                                                {quotation.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/quotations/${quotation.id}`}
                                                    className="btn-icon"
                                                    title="View quotation"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDownload(quotation)}
                                                    title="Download PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                {quotation.status !== 'accepted' && (
                                                    <button
                                                        className="btn-icon success"
                                                        onClick={() => handleConvertToInvoice(quotation)}
                                                        title="Convert to invoice"
                                                    >
                                                        <ArrowRight size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(quotation.id)}
                                                    title="Delete quotation"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, quotationId: null })}
                onConfirm={confirmDelete}
                title="Delete Quotation"
                message="Are you sure you want to delete this quotation? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

export default Quotations;

