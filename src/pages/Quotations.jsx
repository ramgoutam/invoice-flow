import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Plus, Search, FileText, MoreVertical, Trash2, Edit2, Copy, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import './Invoices.css';

function Quotations() {
    const { state, dispatch } = useApp();
    const { quotations, clients } = state;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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
        return client ? client.name : 'Unknown';
    };

    const filteredQuotations = useMemo(() => {
        return quotations.filter(quotation => {
            const matchesSearch = quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getClientName(quotation.clientId).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [quotations, searchTerm, statusFilter, clients]);

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this quotation?')) {
            dispatch({ type: 'DELETE_QUOTATION', payload: id });
        }
    };

    const handleConvertToInvoice = (quotation) => {
        const invoiceData = {
            clientId: quotation.clientId,
            bankAccountId: quotation.bankAccountId || '',
            invoiceNumber: `INV-${state.settings.invoiceNextNumber}`,
            status: 'draft',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + state.settings.paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    return (
        <div className="invoices-page">
            <Header title="Quotations" />

            <div className="page-container">
                <div className="page-header">
                    <h2 className="page-title">Quotations</h2>
                    <Link to="/quotations/new" className="btn btn-primary">
                        <Plus size={18} />
                        New Quotation
                    </Link>
                </div>

                <div className="invoices-toolbar">
                    <div className="input-icon-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
                        <Search size={18} className="icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search quotations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="status-filters">
                        {statuses.map(status => (
                            <button
                                key={status.value}
                                className={`filter-btn ${statusFilter === status.value ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status.value)}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-card">
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
                                        <th>Date</th>
                                        <th>Valid Until</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th></th>
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
                                                <div className="dropdown">
                                                    <button className="btn-icon">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    <div className="dropdown-menu">
                                                        <Link to={`/quotations/${quotation.id}`} className="dropdown-item">
                                                            <Edit2 size={16} />
                                                            Edit
                                                        </Link>
                                                        {quotation.status !== 'accepted' && (
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => handleConvertToInvoice(quotation)}
                                                            >
                                                                <ArrowRight size={16} />
                                                                Convert to Invoice
                                                            </button>
                                                        )}
                                                        <button
                                                            className="dropdown-item danger"
                                                            onClick={() => handleDelete(quotation.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>
                                                    </div>
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
        </div>
    );
}

export default Quotations;
