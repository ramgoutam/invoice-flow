import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Copy, Download, Eye, X } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, generateInvoiceNumber } from '../utils/helpers';
import './Invoices.css';

function Invoices() {
    const { state, dispatch } = useApp();
    const { clients, invoices, settings } = state;
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dropdownOpen, setDropdownOpen] = useState(null);

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
        setDropdownOpen(null);
    };

    const handleDelete = (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            dispatch({ type: 'DELETE_INVOICE', payload: invoiceId });
        }
        setDropdownOpen(null);
    };

    const handleStatusChange = (invoiceId, newStatus) => {
        const updates = { id: invoiceId, status: newStatus };
        if (newStatus === 'paid') {
            updates.paidDate = new Date().toISOString().split('T')[0];
        }
        dispatch({ type: 'UPDATE_INVOICE', payload: updates });
        setDropdownOpen(null);
    };

    const statusOptions = ['all', 'draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'];

    return (
        <div className="invoices-page">
            <Header title="Invoices" />

            <div className="page-container">
                <div className="page-header">
                    <h2 className="page-title">Invoices</h2>
                    <Link to="/invoices/new" className="btn btn-primary">
                        <Plus size={18} />
                        New Invoice
                    </Link>
                </div>

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
                                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredInvoices.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-state-icon">
                            <Plus size={32} />
                        </div>
                        <h3 className="empty-state-title">No invoices found</h3>
                        <p className="empty-state-description">
                            {searchQuery || statusFilter !== 'all'
                                ? "No invoices match your filters."
                                : "Create your first invoice to get started."}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <Link to="/invoices/new" className="btn btn-primary">
                                <Plus size={18} />
                                Create Invoice
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="table-container glass-card" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Client</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th></th>
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
                                        <td className="font-semibold">{formatCurrency(invoice.total, invoice.currency)}</td>
                                        <td>
                                            <span className={`badge badge-${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="dropdown">
                                                <button
                                                    className="btn-icon sm"
                                                    onClick={() => setDropdownOpen(dropdownOpen === invoice.id ? null : invoice.id)}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {dropdownOpen === invoice.id && (
                                                    <div className="dropdown-menu" style={{ opacity: 1, visibility: 'visible', transform: 'translateY(0)' }}>
                                                        <Link to={`/invoices/${invoice.id}`} className="dropdown-item" onClick={() => setDropdownOpen(null)}>
                                                            <Eye size={16} />
                                                            View
                                                        </Link>
                                                        <Link to={`/invoices/${invoice.id}/edit`} className="dropdown-item" onClick={() => setDropdownOpen(null)}>
                                                            <Edit2 size={16} />
                                                            Edit
                                                        </Link>
                                                        <button className="dropdown-item" onClick={() => handleDuplicate(invoice)}>
                                                            <Copy size={16} />
                                                            Duplicate
                                                        </button>
                                                        <div className="dropdown-divider" />
                                                        {invoice.status !== 'paid' && (
                                                            <button className="dropdown-item" onClick={() => handleStatusChange(invoice.id, 'paid')}>
                                                                Mark as Paid
                                                            </button>
                                                        )}
                                                        {invoice.status === 'draft' && (
                                                            <button className="dropdown-item" onClick={() => handleStatusChange(invoice.id, 'sent')}>
                                                                Mark as Sent
                                                            </button>
                                                        )}
                                                        <div className="dropdown-divider" />
                                                        <button className="dropdown-item text-error" onClick={() => handleDelete(invoice.id)}>
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Invoices;
