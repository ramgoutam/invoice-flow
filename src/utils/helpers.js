import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';

// Format currency with symbol
export function formatCurrency(amount, currencyCode = 'USD') {
    const currencies = {
        USD: { symbol: '$', locale: 'en-US' },
        EUR: { symbol: '€', locale: 'de-DE' },
        GBP: { symbol: '£', locale: 'en-GB' },
        INR: { symbol: '₹', locale: 'en-IN' },
        CAD: { symbol: 'C$', locale: 'en-CA' },
        AUD: { symbol: 'A$', locale: 'en-AU' },
    };

    const currency = currencies[currencyCode] || currencies.USD;

    return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Format date
export function formatDate(date, formatStr = 'MMM dd, yyyy') {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
}

// Get days until due
export function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    return differenceInDays(due, new Date());
}

// Generate invoice number
export function generateInvoiceNumber(prefix, number) {
    return `${prefix}-${String(number).padStart(4, '0')}`;
}

// Calculate invoice totals
export function calculateInvoiceTotals(items, taxRate = 0, discount = 0) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    return {
        subtotal,
        discountAmount,
        taxAmount,
        total,
    };
}

// Get status color
export function getStatusColor(status) {
    const colors = {
        draft: 'default',
        pending: 'warning',
        sent: 'info',
        paid: 'success',
        overdue: 'error',
        partial: 'warning',
        cancelled: 'default',
    };
    return colors[status] || 'default';
}

// Calculate due date
export function calculateDueDate(issueDate, paymentTerms) {
    const date = typeof issueDate === 'string' ? parseISO(issueDate) : issueDate;
    return addDays(date, paymentTerms);
}

// Get initials from name
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Format hours
export function formatHours(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Format time duration
export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Get months array for reports
export function getMonthsArray(count = 6) {
    const months = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            date,
            label: format(date, 'MMM yyyy'),
            start: startOfMonth(date),
            end: endOfMonth(date),
        });
    }

    return months;
}

// Calculate revenue by month
export function calculateMonthlyRevenue(invoices, months) {
    return months.map(month => {
        const monthInvoices = invoices.filter(inv => {
            if (inv.status !== 'paid') return false;
            const paidDate = inv.paidDate ? parseISO(inv.paidDate) : parseISO(inv.createdAt);
            return isWithinInterval(paidDate, { start: month.start, end: month.end });
        });

        const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
        return { ...month, revenue };
    });
}

// Calculate expense summary by category
export function calculateExpensesByCategory(expenses) {
    const categories = {};

    expenses.forEach(expense => {
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }
        categories[expense.category] += expense.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
}

// Get unique values from array of objects
export function getUniqueValues(arr, key) {
    return [...new Set(arr.map(item => item[key]).filter(Boolean))];
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Expense categories
export const expenseCategories = [
    { value: 'software', label: 'Software & Tools', icon: '💻' },
    { value: 'office', label: 'Office Supplies', icon: '📎' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'education', label: 'Education & Training', icon: '📚' },
    { value: 'equipment', label: 'Equipment', icon: '🖥️' },
    { value: 'utilities', label: 'Utilities', icon: '💡' },
    { value: 'meals', label: 'Meals & Entertainment', icon: '🍽️' },
    { value: 'insurance', label: 'Insurance', icon: '🛡️' },
    { value: 'professional', label: 'Professional Services', icon: '👔' },
    { value: 'other', label: 'Other', icon: '📦' },
];

// Get category by value
export function getCategoryByValue(value) {
    return expenseCategories.find(c => c.value === value) || { value: 'other', label: 'Other', icon: '📦' };
}
