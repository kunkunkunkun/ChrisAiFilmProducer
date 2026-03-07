import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar as CalendarIcon, Clock, Users, MapPin, Bell, Trash2, ChevronDown, Filter } from 'lucide-react';

const MOCK_PROJECTS = [
    { id: 1, title: 'Neon Shadows', year: 2026, status: 'Active', color: 'var(--accent-color)' },
    { id: 2, title: 'The Silent Echo', year: 2026, status: 'Active', color: 'var(--accent-color)' },
    { id: 3, title: 'Old Records', year: 2025, status: 'Archived', color: 'var(--text-muted)' },
    { id: 4, title: 'Past Venture', year: 2024, status: 'Archived', color: 'var(--text-muted)' },
];

const ITEM_TYPES = [
    { id: 'task', name: 'Task', color: '#f97316', defaultNotify: '1hr' },
    { id: 'urgent', name: 'Urgent Task', color: '#ef4444', defaultNotify: '1hr' },
    { id: 'event', name: 'Event', color: '#eab308', defaultNotify: '3 days' },
    { id: 'announcement', name: 'Announcement', color: '#3b82f6', defaultNotify: '20 mins' },
];

const Projects = () => {
    const [selectedYear, setSelectedYear] = useState(2026);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({
        type: 'task',
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        isWholeDay: true,
        attendee: '',
        travelTime: '0',
    });

    // Sort: Newest years first
    const sortedAllProjects = [...MOCK_PROJECTS].sort((a, b) => b.year - a.year);

    // Filter Logic:
    // 1. If searching, ignore year filter
    // 2. Otherwise, filter by selected year
    const filteredProjects = sortedAllProjects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (searchQuery) return matchesSearch;
        return matchesSearch && p.year === selectedYear;
    });


    const handleAddItem = () => {
        console.log("Adding item:", newItem);
        setIsAddModalOpen(false);
        // In a real app, we'd add this to a shared state or database
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Projects</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your cinematic ventures and team schedules.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    <Plus size={20} /> Add Item
                </button>
            </header>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
                    {[2026, 2025, 2024].map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                background: selectedYear === year ? 'var(--bg-primary)' : 'transparent',
                                color: selectedYear === year ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontWeight: selectedYear === year ? '600' : '400',
                                boxShadow: selectedYear === year ? 'var(--shadow-sm)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search projects by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-base"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            {/* Project List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <AnimatePresence mode="popLayout">
                    {filteredProjects.map(project => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                borderLeft: `4px solid ${project.color}`,
                                opacity: project.year < 2026 ? 0.6 : 1,
                                filter: project.year < 2026 ? 'grayscale(0.5)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{project.title}</h3>
                                <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{project.year}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Long-term feature production with international crew and high-budget VFX requirements.
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>Control Panel</button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Item Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="glass-panel"
                            style={{ width: '90%', maxWidth: '550px', padding: '2rem', background: 'var(--bg-primary)' }}
                        >
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CalendarIcon size={24} /> Schedule New Entry
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Type Selection */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Entry Type</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        {ITEM_TYPES.map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setNewItem({ ...newItem, type: type.id })}
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: `2px solid ${newItem.type === type.id ? type.color : 'var(--border-color)'}`,
                                                    background: newItem.type === type.id ? `${type.color}10` : 'transparent',
                                                    color: newItem.type === type.id ? type.color : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Title</label>
                                    <input
                                        className="input-base"
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="Meeting with VFX supervisor..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Date</label>
                                        <input
                                            type="date"
                                            className="input-base"
                                            value={newItem.date}
                                            onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Start Time</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="time"
                                                className="input-base"
                                                disabled={newItem.isWholeDay}
                                                value={newItem.time}
                                                onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                                            />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newItem.isWholeDay}
                                                    onChange={(e) => setNewItem({ ...newItem, isWholeDay: e.target.checked })}
                                                /> Whole Day
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Attendee</label>
                                        <div style={{ position: 'relative' }}>
                                            <Users size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                className="input-base"
                                                style={{ paddingLeft: '36px' }}
                                                value={newItem.attendee}
                                                onChange={(e) => setNewItem({ ...newItem, attendee: e.target.value })}
                                                placeholder="Name or Email..."
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Travel Time (min)</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="number"
                                                className="input-base"
                                                style={{ paddingLeft: '36px' }}
                                                value={newItem.travelTime}
                                                onChange={(e) => setNewItem({ ...newItem, travelTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notification Preview */}
                                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Bell size={16} color="var(--accent-neon)" />
                                    <span>
                                        Default Notification: <strong>{ITEM_TYPES.find(t => t.id === newItem.type)?.defaultNotify}</strong> before,
                                        plus a generic reminder <strong>20 mins</strong> in advance.
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '2.5rem' }}>
                                <button onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost">Cancel</button>
                                <button onClick={handleAddItem} className="btn btn-primary" style={{ padding: '8px 32px' }}>Confirm Entry</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Projects;
