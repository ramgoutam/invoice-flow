import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ConfirmDialog from './ConfirmDialog';
import {
    LayoutDashboard,
    Users,
    FileText,
    ClipboardList,
    Receipt,
    Clock,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Zap,
    LogOut,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/quotations', icon: ClipboardList, label: 'Quotations' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/time-tracking', icon: Clock, label: 'Time Tracking' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

function Sidebar() {
    const { state, dispatch } = useApp();
    const location = useLocation();
    const isCollapsed = !state.sidebarOpen;
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const toggleSidebar = () => {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
    };

    const handleSignOut = async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
    };

    return (
        <>
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">
                            <Zap size={24} />
                        </div>
                        {!isCollapsed && <span className="logo-text">InvoiceFlow</span>}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`
                            }
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={20} className="nav-icon" />
                            {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', marginBottom: 'var(--spacing-2)' }}>
                        <button className="sidebar-toggle" onClick={toggleSidebar}>
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>
                    <button
                        onClick={() => setShowSignOutConfirm(true)}
                        className={`nav-item ${isCollapsed ? 'collapsed' : ''}`}
                        style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}
                    >
                        <div className="nav-icon">
                            <LogOut size={20} />
                        </div>
                        {!isCollapsed && <span className="nav-label">Sign Out</span>}
                    </button>

                    <div className={`sidebar-profile ${isCollapsed ? 'collapsed' : ''}`}>
                        <div className="sidebar-avatar">
                            {state.settings?.businessName?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="sidebar-profile-info">
                                <p className="profile-name">{state.settings?.businessName || 'User'}</p>
                                <p className="profile-email">{state.user?.email || ''}</p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="sidebar-credits">
                            Made with ❤️ by <a href="https://www.videctech.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 'bold' }}>VIDEC</a>
                        </div>
                    )}
                </div>
            </aside>

            <ConfirmDialog
                isOpen={showSignOutConfirm}
                onClose={() => setShowSignOutConfirm(false)}
                onConfirm={handleSignOut}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                confirmText="Sign Out"
                confirmVariant="danger"
            />
        </>
    );
}

export default Sidebar;
