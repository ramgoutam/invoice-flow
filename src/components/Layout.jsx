import { Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout() {
    const { state } = useApp();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className={`main-content ${!state.sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
