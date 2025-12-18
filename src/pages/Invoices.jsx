import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Plus, Search, Trash2, Eye, Download, CheckCircle } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, generateInvoiceNumber } from '../utils/helpers';
import { downloadInvoicePDF } from '../components/PDFDownloader';
import ConfirmDialog from '../components/ConfirmDialog';
import './Invoices.css';

function Invoices() {
    const { state, dispatch } = useApp();
    const { clients, invoices, settings } = state;

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, invoiceId: null });

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(invoice => {
                const client = clients.find(c => c.id === invoice.clientId);
                const matchesSearch =
                    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    client?.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [invoices, clients, searchQuery, statusFilter]);

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'Unknown Client';
    };

    const handleDuplicate = (invoice) => {
        const newInvoice = {
            ...invoice,
            invoiceNumber: generateInvoiceNumber(settings.invoicePrefix, settings.invoiceNextNumber),
            status: 'draft',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + settings.paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paidDate: null,
        };
        delete newInvoice.id;
        delete newInvoice.createdAt;
        dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
    };

    const handleDelete = (invoiceId) => {
        setDeleteConfirm({ isOpen: true, invoiceId });
    };

    const confirmDelete = () => {
        if (deleteConfirm.invoiceId) {
            dispatch({ type: 'DELETE_INVOICE', payload: deleteConfirm.invoiceId });
        }
    };

    const handleStatusChange = (invoiceId, newStatus) => {
        const updates = { id: invoiceId, status: newStatus };
        if (newStatus === 'paid') {
            updates.paidDate = new Date().toISOString().split('T')[0];
        }
        dispatch({ type: 'UPDATE_INVOICE', payload: updates });
    };

    const handleDownload = async (invoice) => {
        const client = clients.find(c => c.id === invoice.clientId);
        const bankAccount = state.bankAccounts?.find(b => b.id === invoice.bankAccountId);
        await downloadInvoicePDF(invoice, client, bankAccount, settings);
    };

    const statusOptions = ['all', 'draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'];

    return (
        <div className="invoices-page">
            <Header title="">
                <h2 className="header-page-title">Invoices</h2>
                <Link to="/invoices/new" className="btn btn-primary">
                    <Plus size={18} />
                    New Invoice
                </Link>
            </Header>

            <div className="page-container">
                <div className="invoices-toolbar">
                    <div className="input-icon-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
                        <Search size={18} className="icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="status-filters">
                        {statusOptions.map(status => (
                            <button
                                key={status}
                                className={`filter-btn filter-${status} ${statusFilter === status ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredInvoices.length === 0 ? (
                    <div className="empty-state">
                        <Plus size={48} />
                        <h3 className="empty-state-title">No invoices found</h3>
                        <p className="empty-state-description">
                            {invoices.length === 0
                                ? 'Create your first invoice to get started.'
                                : 'Try adjusting your search or filter.'}
                        </p>
                        {invoices.length === 0 && (
                            <Link to="/invoices/new" className="btn btn-primary">
                                <Plus size={18} />
                                Create Invoice
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td>
                                            <Link to={`/invoices/${invoice.id}`} className="invoice-link">
                                                {invoice.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td>{getClientName(invoice.clientId)}</td>
                                        <td>{formatDate(invoice.issueDate)}</td>
                                        <td>{formatDate(invoice.dueDate)}</td>
                                        <td>{formatCurrency(invoice.total, invoice.currency)}</td>
                                        <td>
                                            <span className={`badge badge-${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/invoices/${invoice.id}`}
                                                    className="btn-icon"
                                                    title="View invoice"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDownload(invoice)}
                                                    title="Download PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        className="btn-icon success"
                                                        onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                        title="Mark as paid"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(invoice.id)}
                                                    title="Delete invoice"
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
                onClose={() => setDeleteConfirm({ isOpen: false, invoiceId: null })}
                onConfirm={confirmDelete}
                title="Delete Invoice"
                message="Are you sure you want to delete this invoice? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

export default Invoices;
