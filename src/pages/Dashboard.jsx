import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, Play, Sun, Cloud, CloudRain, CloudLightning, Thermometer, Wind } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MOCK_PROJECTS = [
    { id: 1, title: 'Neon Shadows', type: 'Sci-Fi Feature', status: 'In Production', progress: 65, cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800' },
    { id: 2, title: 'The Silent Echo', type: 'Drama Short', status: 'Pre-Production', progress: 15, cover: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800' },
    { id: 3, title: 'Urban Legend', type: 'Documentary', status: 'Post-Production', progress: 90, cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=800' },
];

const MOCK_TASKS = [
    { id: 101, title: 'Finalize Scene 4 Storyboard', type: 'Task', deadline: new Date(Date.now() + 1000 * 60 * 60 * 2), priority: 'high', status: 'pending' },
    { id: 102, title: 'Location Scouting Meeting', type: 'Event', deadline: new Date(Date.now() + 1000 * 60 * 60 * 5), priority: 'high', status: 'pending' },
    { id: 103, title: 'Review VFX draft 2', type: 'Task', deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), priority: 'medium', status: 'pending' },
    { id: 104, title: 'Submit Budget Proposal', type: 'Task', deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), priority: 'low', status: 'pending' },
];

const MOCK_WEATHER = [
    { day: 'Mon', temp: 24, condition: 'Sunny', icon: Sun, color: '#fbbf24' },
    { day: 'Tue', temp: 22, condition: 'Cloudy', icon: Cloud, color: '#94a3b8' },
    { day: 'Wed', temp: 19, condition: 'Rainy', icon: CloudRain, color: '#60a5fa' },
    { day: 'Thu', temp: 21, condition: 'Storm', icon: CloudLightning, color: '#a855f7' },
    { day: 'Fri', temp: 25, condition: 'Sunny', icon: Sun, color: '#fbbf24' },
    { day: 'Sat', temp: 26, condition: 'Sunny', icon: Sun, color: '#fbbf24' },
    { day: 'Sun', temp: 23, condition: 'Partly Cloudy', icon: Cloud, color: '#94a3b8' },
];

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Sort tasks by deadline
    const sortedTasks = [...MOCK_TASKS].sort((a, b) => a.deadline - b.deadline);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>

            {/* Main Area: Projects */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
                <header>
                    <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Overview</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}. Here's what's happening today.</p>
                </header>

                {/* Weather Forecast Section */}
                <section>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        {MOCK_WEATHER.map((w, i) => (
                            <div key={i} className="glass-panel" style={{ minWidth: '100px', padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{w.day}</div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <w.icon size={24} color={w.color} />
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{w.temp}°C</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{w.condition}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Play size={20} color="var(--accent-color)" /> Active Projects
                        </h2>
                        <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>View All</button>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
                    >
                        {MOCK_PROJECTS.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                                className="glass-panel"
                                onClick={() => navigate(`/dashboard/project/${project.id}`)}
                                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                                    <img src={project.cover} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)', opacity: 0.6 }}></div>
                                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                        <span className={`badge ${project.progress > 80 ? 'badge-success' : 'badge-warning'}`} style={{ background: 'var(--bg-primary)' }}>
                                            {project.status}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{project.type}</div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{project.title}</h3>

                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                            <span>Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${project.progress}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                style={{ height: '100%', background: 'var(--accent-color)', borderRadius: '3px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Calendar Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={20} color="var(--accent-color)" /> Project Calendar
                        </h2>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} style={{ background: 'var(--bg-tertiary)', padding: '10px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    {day}
                                </div>
                            ))}
                            {Array.from({ length: 31 }).map((_, i) => {
                                const dayTasks = MOCK_TASKS.filter(t => t.deadline.getDate() === (i + 1));
                                return (
                                    <div key={i} style={{ background: 'var(--bg-primary)', minHeight: '80px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>{i + 1}</div>
                                        {dayTasks.map(t => (
                                            <div key={t.id} style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                background: t.type === 'Task' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: t.type === 'Task' ? 'var(--danger)' : 'var(--success)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                • {t.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Floating Tab: Tasks & Events (Priority based on deadline) */}
            <aside style={{ width: 'clamp(250px, 22vw, 350px)', flexShrink: 0 }}>
                <div className="glass-panel" style={{ position: 'sticky', top: '0', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: 'none', borderLeft: '1px solid var(--border-color)', borderRadius: '0' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="var(--text-primary)" /> Schedule & Tasks
                        </h3>
                    </div>

                    <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sortedTasks.map((task, idx) => {
                            const hoursLeft = Math.round((task.deadline - Date.now()) / (1000 * 60 * 60));
                            const isUrgent = hoursLeft <= 24;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={task.id}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-tertiary)',
                                        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`,
                                        borderLeft: `4px solid ${isUrgent ? 'var(--danger)' : 'var(--accent-color)'}`,
                                        cursor: 'pointer',
                                        transition: 'var(--transition-fast)'
                                    }}
                                    className="hover:translate-x-1"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: isUrgent ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600' }}>
                                            {task.type}
                                        </span>
                                        {isUrgent && <AlertCircle size={14} color="var(--danger)" />}
                                    </div>

                                    <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', lineHeight: '1.3' }}>
                                        {task.title}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isUrgent ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                        <Clock size={12} />
                                        <span>In {hoursLeft} hours</span>
                                    </div>
                                </motion.div>
                            );
                        })}

                        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 'auto', padding: '12px', color: 'var(--accent-color)' }}>
                            See Calendar <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </aside>

        </div>
    );
};

export default Dashboard;
