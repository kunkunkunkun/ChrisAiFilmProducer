import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Building2, Search } from 'lucide-react';

const TEAM_MEMBERS = [
    {
        id: 1,
        name: 'Sarah Chen',
        role: 'Executive Producer',
        department: 'Production',
        company: 'Stellar Visions',
        email: 'sarah.chen@stellarvisions.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    },
    {
        id: 2,
        name: 'Marcus Thorne',
        role: 'Director of Photography',
        department: 'Cinematography',
        company: 'Lumina Studios',
        email: 'm.thorne@luminastudios.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    {
        id: 3,
        name: 'Elena Rodriguez',
        role: 'VFX Supervisor',
        department: 'Post-Production',
        company: 'Stellar Visions',
        email: 'e.rodriguez@stellarvisions.com',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    },
    {
        id: 4,
        name: 'David Kim',
        role: 'Lead Editor',
        department: 'Post-Production',
        company: 'EditFlow Media',
        email: 'dkim@editflow.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
    {
        id: 5,
        name: 'Aisha Jallow',
        role: 'Location Manager',
        department: 'Logistics',
        company: 'Lumina Studios',
        email: 'ajallow@luminastudios.com',
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150',
    },
    {
        id: 6,
        name: 'Thomas Wright',
        role: 'Sound Designer',
        department: 'Sound',
        company: 'Sonic Arts Lab',
        email: 'twright@sonicarts.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    }
];

const Team = () => {
    // Group members by company
    const groupedMembers = TEAM_MEMBERS.reduce((acc, member) => {
        if (!acc[member.company]) {
            acc[member.company] = [];
        }
        acc[member.company].push(member);
        return acc;
    }, {});

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Team Directory</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Collaborate with project members and partners across organizations.</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {Object.entries(groupedMembers).map(([company, members]) => (
                    <section key={company}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                <Building2 size={20} color="var(--accent-color)" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{company}</h2>
                            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                {members.length} {members.length === 1 ? 'Member' : 'Members'}
                            </div>
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem'
                            }}
                        >
                            {members.map((member) => (
                                <motion.div
                                    key={member.id}
                                    variants={itemVariants}
                                    className="glass-panel"
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        gap: '1.5rem',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid var(--bg-primary)',
                                                boxShadow: 'var(--shadow-md)'
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '2px',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: 'var(--success)',
                                            border: '2px solid var(--bg-primary)'
                                        }} />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '500', marginBottom: '8px' }}>{member.role}</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <MapPin size={12} />
                                                <span>{member.department}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <Mail size={12} />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default Team;
