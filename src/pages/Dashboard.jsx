import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import {
    DollarSign,
    Clock,
    AlertCircle,
    Users,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowRight,
    FileText,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { formatCurrency, formatDate, getMonthsArray, calculateMonthlyRevenue, getStatusColor } from '../utils/helpers';
import './Dashboard.css';

function Dashboard() {
    const { state } = useApp();
    const { clients, invoices, expenses } = state;

    const stats = useMemo(() => {
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        const pendingAmount = invoices
            .filter(inv => ['pending', 'sent'].includes(inv.status))
            .reduce((sum, inv) => sum + inv.total, 0);

        const overdueAmount = invoices
            .filter(inv => inv.status === 'overdue')
            .reduce((sum, inv) => sum + inv.total, 0);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
            totalRevenue,
            pendingAmount,
            overdueAmount,
            totalClients: clients.length,
            totalExpenses,
            profit: totalRevenue - totalExpenses,
        };
    }, [clients, invoices, expenses]);

    const chartData = useMemo(() => {
        const months = getMonthsArray(6);
        return calculateMonthlyRevenue(invoices, months);
    }, [invoices]);

    const recentInvoices = useMemo(() => {
        return [...invoices]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }, [invoices]);

    const overdueInvoices = useMemo(() => {
        return invoices.filter(inv => inv.status === 'overdue');
    }, [invoices]);

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'Unknown Client';
    };

    return (
        <div className="dashboard-page">
            <Header title="Dashboard" />

            <div className="page-container">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                                <p className="stat-label">Total Revenue</p>
                                <div className="stat-change positive">
                                    <TrendingUp size={14} />
                                    <span>+12.5% from last month</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                <Clock size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(stats.pendingAmount)}</p>
                                <p className="stat-label">Pending</p>
                                <div className="stat-change">
                                    <span className="text-muted">{invoices.filter(i => i.status === 'pending').length} invoices</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                <AlertCircle size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(stats.overdueAmount)}</p>
                                <p className="stat-label">Overdue</p>
                                <div className="stat-change negative">
                                    <span>{overdueInvoices.length} invoices need attention</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#3b82f6' }}>
                                <Users size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{stats.totalClients}</p>
                                <p className="stat-label">Active Clients</p>
                                <div className="stat-change positive">
                                    <TrendingUp size={14} />
                                    <span>+2 this month</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="dashboard-grid">
                    {/* Revenue Chart */}
                    <div className="glass-card chart-card">
                        <div className="glass-card-header">
                            <h3 className="glass-card-title">Revenue Overview</h3>
                            <Link to="/reports" className="btn btn-ghost btn-sm">
                                View Reports <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(26, 26, 37, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }}
                                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card quick-actions-card">
                        <div className="glass-card-header">
                            <h3 className="glass-card-title">Quick Actions</h3>
                        </div>
                        <div className="quick-actions">
                            <Link to="/invoices/new" className="quick-action-btn">
                                <div className="quick-action-icon">
                                    <Plus size={20} />
                                </div>
                                <span>New Invoice</span>
                            </Link>
                            <Link to="/clients" className="quick-action-btn">
                                <div className="quick-action-icon">
                                    <Users size={20} />
                                </div>
                                <span>Add Client</span>
                            </Link>
                            <Link to="/expenses" className="quick-action-btn">
                                <div className="quick-action-icon">
                                    <DollarSign size={20} />
                                </div>
                                <span>Log Expense</span>
                            </Link>
                            <Link to="/time-tracking" className="quick-action-btn">
                                <div className="quick-action-icon">
                                    <Clock size={20} />
                                </div>
                                <span>Track Time</span>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Invoices */}
                    <div className="glass-card recent-invoices-card">
                        <div className="glass-card-header">
                            <h3 className="glass-card-title">Recent Invoices</h3>
                            <Link to="/invoices" className="btn btn-ghost btn-sm">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="invoice-list">
                            {recentInvoices.length === 0 ? (
                                <div className="empty-state-small">
                                    <FileText size={32} />
                                    <p>No invoices yet</p>
                                </div>
                            ) : (
                                recentInvoices.map(invoice => (
                                    <Link to={`/invoices/${invoice.id}`} key={invoice.id} className="invoice-item">
                                        <div className="invoice-item-left">
                                            <p className="invoice-number">{invoice.invoiceNumber}</p>
                                            <p className="invoice-client">{getClientName(invoice.clientId)}</p>
                                        </div>
                                        <div className="invoice-item-right">
                                            <p className="invoice-amount">{formatCurrency(invoice.total)}</p>
                                            <span className={`badge badge-${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Overdue Alerts */}
                    {overdueInvoices.length > 0 && (
                        <div className="glass-card overdue-card">
                            <div className="glass-card-header">
                                <h3 className="glass-card-title">
                                    <AlertCircle size={18} className="text-error" />
                                    Overdue Invoices
                                </h3>
                            </div>
                            <div className="overdue-list">
                                {overdueInvoices.map(invoice => (
                                    <Link to={`/invoices/${invoice.id}`} key={invoice.id} className="overdue-item">
                                        <div>
                                            <p className="font-semibold">{invoice.invoiceNumber}</p>
                                            <p className="text-sm text-muted">{getClientName(invoice.clientId)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-error">{formatCurrency(invoice.total)}</p>
                                            <p className="text-xs text-muted">Due: {formatDate(invoice.dueDate)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
