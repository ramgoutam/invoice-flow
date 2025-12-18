import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Moon, Sun, Menu } from 'lucide-react';
import './Header.css';

function Header({ title, children }) {
    const { state, dispatch } = useApp();
    const [searchOpen, setSearchOpen] = useState(false);

    const toggleTheme = () => {
        dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
    };

    const toggleMobileSidebar = () => {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={toggleMobileSidebar}>
                    <Menu size={24} />
                </button>
                {title && <h1 className="header-title">{title}</h1>}
                {children && Array.isArray(children) ? children[0] : (children && !Array.isArray(children) ? children : null)}
            </div>

            <div className="header-right">
                {children && Array.isArray(children) && children.slice(1)}

                <div className={`search-container ${searchOpen ? 'open' : ''}`}>
                    <button className="btn-icon" onClick={() => setSearchOpen(!searchOpen)}>
                        <Search size={20} />
                    </button>
                    {searchOpen && (
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search..."
                            autoFocus
                            onBlur={() => setSearchOpen(false)}
                        />
                    )}
                </div>

                <button className="btn-icon theme-toggle" onClick={toggleTheme}>
                    {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}

export default Header;
