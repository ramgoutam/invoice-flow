import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Download, Calendar, DollarSign, TrendingUp, Users, Receipt } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import { formatCurrency, formatDate, getMonthsArray, calculateMonthlyRevenue, calculateExpensesByCategory, getCategoryByValue } from '../utils/helpers';
import './Reports.css';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#84cc16'];

function Reports() {
    const { state } = useApp();
    const { clients, invoices, expenses } = state;
    const [dateRange, setDateRange] = useState('6months');

    const monthsCount = dateRange === '3months' ? 3 : dateRange === '6months' ? 6 : 12;
    const months = useMemo(() => getMonthsArray(monthsCount), [monthsCount]);

    const revenueData = useMemo(() => calculateMonthlyRevenue(invoices, months), [invoices, months]);

    const expensesByCategory = useMemo(() => calculateExpensesByCategory(expenses), [expenses]);

    const totalStats = useMemo(() => {
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = totalRevenue - totalExpenses;
        const pendingRevenue = invoices
            .filter(inv => ['pending', 'sent'].includes(inv.status))
            .reduce((sum, inv) => sum + inv.total, 0);

        return { totalRevenue, totalExpenses, netProfit, pendingRevenue };
    }, [invoices, expenses]);

    const clientRevenue = useMemo(() => {
        const clientTotals = {};
        invoices
            .filter(inv => inv.status === 'paid')
            .forEach(inv => {
                if (!clientTotals[inv.clientId]) {
                    clientTotals[inv.clientId] = 0;
                }
                clientTotals[inv.clientId] += inv.total;
            });

        return Object.entries(clientTotals)
            .map(([clientId, total]) => {
                const client = clients.find(c => c.id === clientId);
                return { name: client?.name || 'Unknown', value: total };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [invoices, clients]);

    const taxSummary = useMemo(() => {
        return invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
    }, [invoices]);

    const handleExportCSV = () => {
        // Create CSV content
        let csv = 'Type,Date,Description,Amount,Status\n';

        invoices.forEach(inv => {
            const client = clients.find(c => c.id === inv.clientId);
            csv += `Invoice,${inv.issueDate},"${inv.invoiceNumber} - ${client?.name || 'Unknown'}",${inv.total},${inv.status}\n`;
        });

        expenses.forEach(exp => {
            csv += `Expense,${exp.date},"${exp.description}",${exp.amount},Paid\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="reports-page">
            <Header title="Reports" />

            <div className="page-container">
                <div className="page-header">
                    <h2 className="page-title">Reports & Analytics</h2>
                    <div className="report-actions">
                        <select
                            className="input"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="3months">Last 3 Months</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="12months">Last 12 Months</option>
                        </select>
                        <button className="btn btn-primary" onClick={handleExportCSV}>
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="stats-grid reports-stats">
                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(totalStats.totalRevenue)}</p>
                                <p className="stat-label">Total Revenue</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                <Receipt size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(totalStats.totalExpenses)}</p>
                                <p className="stat-label">Total Expenses</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#3b82f6' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(totalStats.netProfit)}</p>
                                <p className="stat-label">Net Profit</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card stat-card-wrapper">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                <Calendar size={24} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{formatCurrency(taxSummary)}</p>
                                <p className="stat-label">Tax Collected</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="reports-grid">
                    {/* Revenue Chart */}
                    <div className="glass-card revenue-chart">
                        <div className="glass-card-header">
                            <h3 className="glass-card-title">Revenue Over Time</h3>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="revenueGradient2" x1="0" y1="0" x2="0" y2="1">
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
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient2)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Expenses by Category */}
                    <div className="glass-card expenses-chart">
                        <div className="glass-card-header">
                            <h3 className="glass-card-title">Expenses by Category</h3>
                        </div>
                        <div className="chart-container pie-chart">
                            {expensesByCategory.length === 0 ? (
                                <div className="empty-state-small">
                                    <Receipt size={32} />
                                    <p>No expense data</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={expensesByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {expensesByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(26, 26, 37, 0.95)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                            }}
                                            formatter={(value) => [formatCurrency(value)]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="pie-legend">
                            {expensesByCategory.map((item, index) => {
                                const cat = getCategoryByValue(item.name);
                                return (
                                    <div key={item.name} className="legend-item">
                                        <span className="legend-color" style={{ background: COLORS[index % COLORS.length] }} />
                                        <span className="legend-label">{cat.icon} {cat.label}</span>
                                        <span className="legend-value">{formatCurrency(item.value)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div className="glass-card clients-chart">
                        <div className="glass-card-header">
                            <h3 className="glass-card-title">Top Clients by Revenue</h3>
                        </div>
                        {clientRevenue.length === 0 ? (
                            <div className="empty-state-small">
                                <Users size={32} />
                                <p>No client revenue data</p>
                            </div>
                        ) : (
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={clientRevenue} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} width={100} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(26, 26, 37, 0.95)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                            }}
                                            formatter={(value) => [formatCurrency(value), 'Revenue']}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reports;
