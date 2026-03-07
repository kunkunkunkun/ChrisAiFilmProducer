import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';

const MOCK_TEAM = [
    { id: 1, name: 'Alex Wong', role: 'Producer', dept: 'Production', email: 'alex@aiproducer.com', isHOD: true },
    { id: 2, name: 'Sam Taylor', role: 'Director', dept: 'Creative', email: 'sam@aiproducer.com', isHOD: true },
    { id: 3, name: 'Jordan Lee', role: 'Cinematographer', dept: 'Camera', email: 'jordan@aiproducer.com', isHOD: true },
    { id: 4, name: 'Casey Smith', role: 'Gaffer', dept: 'Lighting', email: 'casey@aiproducer.com', isHOD: false },
    { id: 5, name: 'Taylor Doe', role: 'Production Designer', dept: 'Art', email: 'taylor@aiproducer.com', isHOD: true },
    { id: 6, name: 'Morgan Ray', role: 'Prop Master', dept: 'Art', email: 'morgan@aiproducer.com', isHOD: false },
];

const MOCK_MILESTONES = [
    { title: 'Script Lock', date: 'Oct 15, 2026', status: 'completed' },
    { title: 'Location Scouting', date: 'Nov 02, 2026', status: 'completed' },
    { title: 'Casting Finalized', date: 'Nov 20, 2026', status: 'active' },
    { title: 'Principal Photography', date: 'Jan 10, 2027', status: 'upcoming' },
    { title: 'Picture Lock', date: 'Mar 05, 2027', status: 'upcoming' },
];

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mocking data retrieval
    const projectTitle = id === '1' ? 'Neon Shadows' : id === '2' ? 'The Silent Echo' : 'Urban Legend';

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Project Details
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{projectTitle}</h1>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost">Edit Project</button>
                    <button className="btn btn-primary">Share</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left Column: Milestones & Team */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Milestones Card */}
                    <section className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={20} /> Key Milestones
                        </h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1rem', paddingBottom: '1rem' }}>
                            {/* Connecting Line */}
                            <div style={{ position: 'absolute', top: '14px', left: '20px', right: '20px', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>

                            {MOCK_MILESTONES.map((ms, idx) => (
                                <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: ms.status === 'completed' ? 'var(--text-primary)' : ms.status === 'active' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                        border: ms.status === 'active' ? '2px solid var(--text-primary)' : `1px solid ${ms.status === 'completed' ? 'var(--text-primary)' : 'var(--border-color)'}`,
                                        color: ms.status === 'completed' ? 'white' : 'var(--text-muted)',
                                        marginBottom: '12px'
                                    }}>
                                        {ms.status === 'completed' ? <CheckCircle2 size={16} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ms.status === 'active' ? 'var(--text-primary)' : 'transparent' }} />}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: ms.status === 'upcoming' ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.2' }}>{ms.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ms.date}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Team Roster Card */}
                    <section className="glass-panel" style={{ padding: '0' }}>
                        <div style={{ padding: '2rem 2rem 1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={20} /> Team Roster
                            </h2>
                            <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>+ Add Member</button>
                        </div>

                        <table className="table-minimal">
                            <thead>
                                <tr>
                                    <th>Actor/Crew</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Contact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_TEAM.map((member) => (
                                    <tr key={member.id}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{member.name}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {member.role}
                                                {member.isHOD && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>HOD</span>}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{member.dept}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            <a href={`mailto:${member.email}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{member.email}</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                </div>

                {/* Right Column: Budget & Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Budget Card */}
                    <section className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={20} /> Budget Overview
                        </h2>

                        <div style={{ textAlign: 'center', padding: '1rem 0 2rem 0' }}>
                            {/* Fake Donut Chart via CSS Conic Gradient */}
                            <div style={{
                                width: '180px', height: '180px', borderRadius: '50%', margin: '0 auto',
                                background: 'conic-gradient(var(--text-primary) 0% 65%, var(--border-color) 65% 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <div style={{ width: '150px', height: '150px', background: 'var(--bg-primary)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>65%</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Budget</span>
                                <span style={{ fontWeight: '500' }}>$1,250,000</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Spent</span>
                                <span style={{ fontWeight: '500' }}>$812,500</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Remaining</span>
                                <span style={{ fontWeight: '500', color: 'var(--success)' }}>$437,500</span>
                            </div>
                        </div>
                    </section>

                    {/* Quick Actions / Links */}
                    <section className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={20} /> Documents
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['Shooting Schedule.pdf', 'Cast List.xls', 'Call Sheet - Day 1.pdf'].map((doc, i) => (
                                <button key={i} className="btn btn-ghost" style={{ justifyContent: 'space-between', width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    <span>{doc}</span>
                                    <ChevronRight size={16} color="var(--text-muted)" />
                                </button>
                            ))}
                        </div>
                    </section>

                </div>

            </div>
        </div>
    );
};

export default ProjectDetail;
