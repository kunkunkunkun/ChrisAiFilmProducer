import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, MonitorPlay, Sparkles } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(null);

    const handleLogin = (role) => {
        login(role);
        navigate('/dashboard');
    };

    return (
        <div className="layout-container" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>

            {/* Background Ornaments Removed for Minimalist Look */}


            <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                    <Sparkles size={36} color="var(--text-primary)" />
                </div>

                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>AI Producer</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                    Next-generation intelligent film production management and ideation system.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <button
                        className="glass-panel"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1.25rem', cursor: 'pointer', background: isHovered === 'producer' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                            borderColor: isHovered === 'producer' ? 'var(--text-primary)' : 'var(--border-color)',
                            transform: isHovered === 'producer' ? 'translateY(-2px)' : 'none',
                        }}
                        onMouseEnter={() => setIsHovered('producer')}
                        onMouseLeave={() => setIsHovered(null)}
                        onClick={() => handleLogin('producer')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                <MonitorPlay size={24} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Login as Producer</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full access to projects & budgets</div>
                            </div>
                        </div>
                        <div style={{ color: 'var(--text-primary)', opacity: isHovered === 'producer' ? 1 : 0, transition: 'var(--transition-fast)' }}>→</div>
                    </button>

                    <button
                        className="glass-panel"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1.25rem', cursor: 'pointer', background: isHovered === 'director' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                            borderColor: isHovered === 'director' ? 'var(--text-primary)' : 'var(--border-color)',
                            transform: isHovered === 'director' ? 'translateY(-2px)' : 'none',
                        }}
                        onMouseEnter={() => setIsHovered('director')}
                        onMouseLeave={() => setIsHovered(null)}
                        onClick={() => handleLogin('director')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                <Clapperboard size={24} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Login as Director</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Focus on creative AI & storyboards</div>
                            </div>
                        </div>
                        <div style={{ color: 'var(--text-primary)', opacity: isHovered === 'director' ? 1 : 0, transition: 'var(--transition-fast)' }}>→</div>
                    </button>
                </div>

                <div style={{ marginTop: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Hackathon Prototype Mode v1.0
                </div>
            </div>
        </div>
    );
};

export default Login;
