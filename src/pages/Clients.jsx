import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Plus, Search, Mail, Phone, MapPin, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { formatDate, getInitials, formatCurrency } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDialog from '../components/ConfirmDialog';
import './Clients.css';

function Clients() {
    const { state, dispatch } = useApp();
    const { clients, invoices } = state;
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, clientId: null });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [clients, searchQuery]);

    const getClientStats = (clientId) => {
        const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
        const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const paidAmount = clientInvoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
        return {
            totalInvoices: clientInvoices.length,
            totalBilled,
            paidAmount,
        };
    };

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                name: client.name,
                email: client.email,
                phone: client.phone || '',
                address: client.address || '',
                notes: client.notes || '',
            });
        } else {
            setEditingClient(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            notes: '',
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingClient) {
            dispatch({
                type: 'UPDATE_CLIENT',
                payload: { id: editingClient.id, ...formData },
            });
        } else {
            dispatch({
                type: 'ADD_CLIENT',
                payload: { ...formData, id: uuidv4() },
            });
        }
        closeModal();
    };

    const handleDelete = (clientId) => {
        setDeleteConfirm({ isOpen: true, clientId });
        setDropdownOpen(null);
    };

    const confirmDelete = () => {
        if (deleteConfirm.clientId) {
            dispatch({ type: 'DELETE_CLIENT', payload: deleteConfirm.clientId });
        }
    };

    return (
        <div className="clients-page">
            <Header title="Clients" />

            <div className="page-container">
                <div className="page-header">
                    <div className="page-header-left">
                        <h2 className="page-title">Clients</h2>
                        <span className="client-count">{clients.length} total</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Client
                    </button>
                </div>

                <div className="clients-toolbar">
                    <div className="input-icon-wrapper">
                        <Search size={18} className="icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="clients-grid">
                    {filteredClients.length === 0 ? (
                        <div className="empty-state glass-card">
                            <div className="empty-state-icon">
                                <Plus size={32} />
                            </div>
                            <h3 className="empty-state-title">No clients found</h3>
                            <p className="empty-state-description">
                                {searchQuery
                                    ? "No clients match your search criteria."
                                    : "Get started by adding your first client."}
                            </p>
                            {!searchQuery && (
                                <button className="btn btn-primary" onClick={() => openModal()}>
                                    <Plus size={18} />
                                    Add Client
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredClients.map(client => {
                            const stats = getClientStats(client.id);
                            return (
                                <div key={client.id} className="glass-card client-card">
                                    <div className="client-header">
                                        <div className="avatar lg">{getInitials(client.name)}</div>
                                        <div className="dropdown">
                                            <button
                                                className="btn-icon sm"
                                                onClick={() => setDropdownOpen(dropdownOpen === client.id ? null : client.id)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {dropdownOpen === client.id && (
                                                <div className="dropdown-menu" style={{ opacity: 1, visibility: 'visible', transform: 'translateY(0)' }}>
                                                    <button className="dropdown-item" onClick={() => { openModal(client); setDropdownOpen(null); }}>
                                                        <Edit2 size={16} />
                                                        Edit
                                                    </button>
                                                    <button className="dropdown-item text-error" onClick={() => handleDelete(client.id)}>
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="client-info">
                                        <h3 className="client-name">{client.name}</h3>
                                        <div className="client-details">
                                            <div className="client-detail">
                                                <Mail size={14} />
                                                <span>{client.email}</span>
                                            </div>
                                            {client.phone && (
                                                <div className="client-detail">
                                                    <Phone size={14} />
                                                    <span>{client.phone}</span>
                                                </div>
                                            )}
                                            {client.address && (
                                                <div className="client-detail">
                                                    <MapPin size={14} />
                                                    <span>{client.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="client-stats">
                                        <div className="client-stat">
                                            <span className="stat-number">{stats.totalInvoices}</span>
                                            <span className="stat-name">Invoices</span>
                                        </div>
                                        <div className="client-stat">
                                            <span className="stat-number">{formatCurrency(stats.totalBilled)}</span>
                                            <span className="stat-name">Total Billed</span>
                                        </div>
                                        <div className="client-stat">
                                            <span className="stat-number">{formatCurrency(stats.paidAmount)}</span>
                                            <span className="stat-name">Paid</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Client Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Name *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Client name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Email *</label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="client@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="input"
                                            placeholder="+1 (555) 000-0000"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group full-width">
                                        <label className="input-label">Address</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="123 Main St, City, State"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
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
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingClient ? 'Update Client' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, clientId: null })}
                onConfirm={confirmDelete}
                title="Delete Client"
                message="Are you sure you want to delete this client? All associated data will be lost."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

export default Clients;
