import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar as CalendarIcon, Clock, Users, MapPin, Bell, Trash2, ChevronDown, Filter, DollarSign, CheckCircle, Info, X, ChevronRight, Briefcase } from 'lucide-react';
import { projectStorage } from '../utils/projectStorage';

const ROLES = [
    'Director', 'Co-Director', 'Producer', 'DOP',
    'Art director', 'Production designer', 'Gaffer', 'VFX supervisor'
];

const STATUS_OPTIONS = [
    { id: 'TBC', label: 'TBC', color: '#9ca3af' },
    { id: 'Confirmed', label: 'Confirmed', color: '#10b981' },
    { id: 'Finished', label: 'Finished', color: '#111827' },
    { id: 'In progress', label: 'In progress', color: '#eab308' },
    { id: 'Cancelled', label: 'Cancelled', color: '#ef4444' },
];

const TEMPLATES = [
    'Standard Film Production',
    'Commercial Spot',
    'Documentary Series',
    'Music Video',
    'Social Content'
];

const Projects = () => {
    const [selectedYear, setSelectedYear] = useState(2026);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial state for extra people
    const emptyMember = { name: '', phone: '', email: '', company: '', role: 'Producer' };

    // New Project State
    const [newProject, setNewProject] = useState({
        name: '',
        code: '',
        template: TEMPLATES[0],
        status: 'TBC',
        shootDay: {
            date: new Date().toISOString().split('T')[0],
            isTentative: false,
            duration: '1 Day'
        },
        budget: {
            income: '',
            uncleared: ''
        },
        people: [emptyMember],
        tasks: ''
    });

    // Load projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            const data = await projectStorage.loadProjects();
            // Map CSV structure to UI structure if needed 
            // Our storage saves shootDay as separate fields, let's reconcile
            const reconciled = data.map(p => ({
                id: p.id,
                title: p.name,
                code: p.code,
                year: p.shootDate ? new Date(p.shootDate).getFullYear() : 2026,
                status: p.status,
                color: STATUS_OPTIONS.find(s => s.id === p.status)?.color || '#9ca3af',
                // Keep the rest for internal use
                ...p
            }));
            setProjects(reconciled);
            setIsLoading(false);
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (searchQuery) return matchesSearch;
        return matchesSearch && p.year === selectedYear;
    });

    const handleAddPerson = () => {
        setNewProject({
            ...newProject,
            people: [...newProject.people, { ...emptyMember }]
        });
    };

    const handleRemovePerson = (index) => {
        const updatedPeople = newProject.people.filter((_, i) => i !== index);
        setNewProject({ ...newProject, people: updatedPeople });
    };

    const handlePersonChange = (index, field, value) => {
        const updatedPeople = [...newProject.people];
        updatedPeople[index][field] = value;
        setNewProject({ ...newProject, people: updatedPeople });
    };

    const handleDeleteProject = async (id) => {
        const success = await projectStorage.deleteProject(id);
        if (success) {
            setProjects(projects.filter(p => p.id !== id));
        }
    };

    const handleCreateProject = async () => {
        const projectToSave = {
            name: newProject.name || 'Untitled Project',
            code: newProject.code,
            template: newProject.template,
            status: newProject.status,
            shootDate: newProject.shootDay.date,
            isTentative: newProject.shootDay.isTentative,
            duration: newProject.shootDay.duration,
            income: newProject.budget.income || 0,
            uncleared: newProject.budget.uncleared || 0,
            people: newProject.people,
            tasks: newProject.tasks
        };

        const savedProject = await projectStorage.addProject(projectToSave);

        if (savedProject) {
            const formatted = {
                id: savedProject.id,
                title: savedProject.name,
                code: savedProject.code,
                year: new Date(savedProject.shootDate).getFullYear(),
                status: savedProject.status,
                color: STATUS_OPTIONS.find(s => s.id === savedProject.status)?.color || '#9ca3af',
                ...savedProject
            };
            setProjects([...projects, formatted]);
        }

        setIsAddModalOpen(false);
        // Reset state
        setNewProject({
            name: '',
            code: '',
            template: TEMPLATES[0],
            status: 'TBC',
            shootDay: {
                date: new Date().toISOString().split('T')[0],
                isTentative: false,
                duration: '1 Day'
            },
            budget: {
                income: '',
                uncleared: ''
            },
            people: [{ ...emptyMember }],
            tasks: ''
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Projects</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your cinematic ventures and team schedules.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    <Plus size={20} /> Add Project
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
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Loading projects...
                </div>
            ) : filteredProjects.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No projects found for this year.<br />Create your first project to get started!
                </div>
            ) : (
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
                                    filter: project.year < 2026 ? 'grayscale(0.5)' : 'none',
                                    position: 'relative'
                                }}
                            >
                                <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5 }}
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{project.title}</h3>
                                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{project.code || project.year}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: project.color }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{project.status}</span>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Income</span>
                                        <span style={{ color: 'var(--success)', fontWeight: '600' }}>${Number(project.income).toLocaleString()}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
                                        <div style={{
                                            width: `${Math.min(100, (project.income / (Number(project.income) + Number(project.uncleared) || 1)) * 100)}%`,
                                            height: '100%',
                                            background: 'var(--success)',
                                            borderRadius: '2px'
                                        }}></div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>Control Panel</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Project Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'var(--bg-primary)', position: 'relative' }}
                        >
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Plus size={28} color="var(--accent-color)" /> Create New Project
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                                {/* Section 1: Basic Info */}
                                <section>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px' }}>General Information</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project Name</label>
                                            <input
                                                className="input-base"
                                                value={newProject.name}
                                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                                placeholder="e.g. Neon Shadows"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project Code</label>
                                            <input
                                                className="input-base"
                                                value={newProject.code}
                                                onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                                                placeholder="e.g. NS-2026"
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project Template</label>
                                            <select
                                                className="input-base"
                                                style={{ appearance: 'none' }}
                                                value={newProject.template}
                                                onChange={(e) => setNewProject({ ...newProject, template: e.target.value })}
                                            >
                                                {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: People */}
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px' }}>People Involved</h3>
                                        <button onClick={handleAddPerson} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                                            + Add Member
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {newProject.people.map((person, index) => (
                                            <div key={index} className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-secondary)', position: 'relative', border: '1px solid var(--border-color)' }}>
                                                {newProject.people.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemovePerson(index)}
                                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Name</label>
                                                        <input className="input-base" style={{ padding: '6px 10px' }} value={person.name} onChange={(e) => handlePersonChange(index, 'name', e.target.value)} placeholder="Full Name" />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Role</label>
                                                        <select className="input-base" style={{ padding: '6px 10px' }} value={person.role} onChange={(e) => handlePersonChange(index, 'role', e.target.value)}>
                                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Company</label>
                                                        <input className="input-base" style={{ padding: '6px 10px' }} value={person.company} onChange={(e) => handlePersonChange(index, 'company', e.target.value)} placeholder="Company/Dept" />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                                                        <input className="input-base" style={{ padding: '6px 10px' }} value={person.phone} onChange={(e) => handlePersonChange(index, 'phone', e.target.value)} placeholder="+1..." />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                                                        <input className="input-base" style={{ padding: '6px 10px' }} value={person.email} onChange={(e) => handlePersonChange(index, 'email', e.target.value)} placeholder="email@example.com" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Section 3: Status & Shoot Day */}
                                <section>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px' }}>Status</h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setNewProject({ ...newProject, status: opt.id })}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            background: newProject.status === opt.id ? opt.color : 'var(--bg-tertiary)',
                                                            color: newProject.status === opt.id ? '#fff' : 'var(--text-muted)',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px' }}>Shoot Day</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <input
                                                    type="date"
                                                    className="input-base"
                                                    value={newProject.shootDay.date}
                                                    onChange={(e) => setNewProject({ ...newProject, shootDay: { ...newProject.shootDay, date: e.target.value } })}
                                                />
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <input
                                                        className="input-base"
                                                        style={{ flex: 1 }}
                                                        value={newProject.shootDay.duration}
                                                        onChange={(e) => setNewProject({ ...newProject, shootDay: { ...newProject.shootDay, duration: e.target.value } })}
                                                        placeholder="Duration (e.g. 5 Days)"
                                                    />
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={newProject.shootDay.isTentative}
                                                            onChange={(e) => setNewProject({ ...newProject, shootDay: { ...newProject.shootDay, isTentative: e.target.checked } })}
                                                        /> Tentative
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 4: Budget */}
                                <section>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px' }}>Financials</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Income Received</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={16} color="var(--success)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="number"
                                                    className="input-base"
                                                    style={{ paddingLeft: '36px' }}
                                                    value={newProject.budget.income}
                                                    onChange={(e) => setNewProject({ ...newProject, budget: { ...newProject.budget, income: e.target.value } })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Uncleared / Pending</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={16} color="var(--danger)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="number"
                                                    className="input-base"
                                                    style={{ paddingLeft: '36px' }}
                                                    value={newProject.budget.uncleared}
                                                    onChange={(e) => setNewProject({ ...newProject, budget: { ...newProject.budget, uncleared: e.target.value } })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 5: Initial Tasks */}
                                <section>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-color)', paddingLeft: '10px' }}>Project Phase 1 Tasks</h3>
                                    <textarea
                                        className="input-base"
                                        style={{ minHeight: '100px', resize: 'vertical' }}
                                        value={newProject.tasks}
                                        onChange={(e) => setNewProject({ ...newProject, tasks: e.target.value })}
                                        placeholder="List the first few tasks for this project..."
                                    />
                                </section>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                                <button onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost">Discard Draft</button>
                                <button onClick={handleCreateProject} className="btn btn-primary" style={{ padding: '12px 48px' }}>Create Project</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Projects;
