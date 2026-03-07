import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Sparkles, FolderKanban, Users, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ onSettingsClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'AI Ideation', icon: <Sparkles size={20} />, path: '/agent' },
        { name: 'Projects', icon: <FolderKanban size={20} />, path: '/projects' },
        { name: 'Team', icon: <Users size={20} />, path: '/team' },
    ];

    return (
        <aside style={{
            width: 'clamp(200px, 15vw, 280px)',
            flexShrink: 0,
            height: '100vh',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem'
        }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px', marginBottom: '2.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={18} color="white" />
                </div>
                <span style={{ fontWeight: '600', fontSize: '1.2rem', color: 'var(--text-primary)' }}>AI Producer</span>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: isActive ? 'var(--bg-primary)' : 'transparent',
                            textDecoration: 'none',
                            fontWeight: isActive ? '500' : '400',
                            transition: 'all var(--transition-fast)'
                        })}
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            {/* User Info & Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    onClick={onSettingsClick}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
                >
                    <Settings size={18} />
                    Settings
                </button>

                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <img src={user?.avatar} alt="User Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-muted)' }}
                >
                    <LogOut size={18} />
                    Sign out
                </button>
            </div>
        </aside>
    );
};


export default Sidebar;
