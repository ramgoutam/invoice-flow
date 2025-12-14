import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Plus, Search, Calendar, Trash2, Edit2, X, DollarSign } from 'lucide-react';
import { formatDate, formatCurrency, getCategoryByValue, expenseCategories } from '../utils/helpers';
import './Expenses.css';

function Expenses() {
    const { state, dispatch } = useApp();
    const { expenses } = state;
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'software',
        date: new Date().toISOString().split('T')[0],
    });

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, searchQuery, categoryFilter]);

    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [filteredExpenses]);

    const expensesByCategory = useMemo(() => {
        const grouped = {};
        expenses.forEach(exp => {
            if (!grouped[exp.category]) {
                grouped[exp.category] = 0;
            }
            grouped[exp.category] += exp.amount;
        });
        return Object.entries(grouped).map(([category, total]) => ({
            category,
            total,
            ...getCategoryByValue(category),
        })).sort((a, b) => b.total - a.total);
    }, [expenses]);

    const openModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
            });
        } else {
            setEditingExpense(null);
            setFormData({
                description: '',
                amount: '',
                category: 'software',
                date: new Date().toISOString().split('T')[0],
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const expenseData = {
            ...formData,
            amount: parseFloat(formData.amount),
        };

        if (editingExpense) {
            dispatch({ type: 'UPDATE_EXPENSE', payload: { id: editingExpense.id, ...expenseData } });
        } else {
            dispatch({ type: 'ADD_EXPENSE', payload: expenseData });
        }
        closeModal();
    };

    const handleDelete = (expenseId) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
        }
    };

    return (
        <div className="expenses-page">
            <Header title="Expenses" />

            <div className="page-container">
                <div className="page-header">
                    <h2 className="page-title">Expenses</h2>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Expense
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="expenses-summary">
                    <div className="glass-card summary-card total-card">
                        <div className="summary-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="summary-content">
                            <p className="summary-value">{formatCurrency(totalExpenses)}</p>
                            <p className="summary-label">Total Expenses</p>
                        </div>
                    </div>

                    <div className="category-breakdown">
                        {expensesByCategory.slice(0, 4).map(cat => (
                            <div key={cat.category} className="glass-card category-card">
                                <span className="category-icon">{cat.icon}</span>
                                <div className="category-info">
                                    <p className="category-label">{cat.label}</p>
                                    <p className="category-value">{formatCurrency(cat.total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="expenses-toolbar">
                    <div className="input-icon-wrapper" style={{ maxWidth: '300px' }}>
                        <Search size={18} className="icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="input"
                        style={{ maxWidth: '200px' }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {expenseCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Expenses List */}
                {filteredExpenses.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-state-icon">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="empty-state-title">No expenses found</h3>
                        <p className="empty-state-description">
                            Track your business expenses to get a clearer picture of your finances.
                        </p>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <Plus size={18} />
                            Add Expense
                        </button>
                    </div>
                ) : (
                    <div className="glass-card expenses-list">
                        {filteredExpenses.map(expense => {
                            const cat = getCategoryByValue(expense.category);
                            return (
                                <div key={expense.id} className="expense-item">
                                    <span className="expense-icon">{cat.icon}</span>
                                    <div className="expense-info">
                                        <p className="expense-description">{expense.description}</p>
                                        <p className="expense-meta">
                                            <span className="expense-category">{cat.label}</span>
                                            <span className="expense-date">
                                                <Calendar size={12} />
                                                {formatDate(expense.date)}
                                            </span>
                                        </p>
                                    </div>
                                    <p className="expense-amount">{formatCurrency(expense.amount)}</p>
                                    <div className="expense-actions">
                                        <button className="btn-icon sm" onClick={() => openModal(expense)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon sm" onClick={() => handleDelete(expense.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Expense Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h3>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Description *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="What did you spend on?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Amount *</label>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Date *</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Category *</label>
                                    <select
                                        className="input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        {expenseCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.icon} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Expenses;
