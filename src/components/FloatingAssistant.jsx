import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, PieChart, Calendar, AlertCircle, PlusCircle } from 'lucide-react';

const FloatingAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I am your Production Assistant. How can I help you manage your projects today?' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    // Mock Stats
    const stats = {
        completion: 68,
        cost: 42,
        pending: 12,
        urgent: 2
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');

        // Basic Command Parsing Logic (Mock)
        setTimeout(() => {
            let response = "I'm not sure how to help with that yet. You can ask me about 'status', 'stats', or to 'add a task'.";

            const lowerMsg = userMsg.toLowerCase();
            if (lowerMsg.includes('status') || lowerMsg.includes('pending')) {
                response = `Currently, you have ${stats.pending} pending tasks, including ${stats.urgent} urgent items. Most are in the "Neon Shadows" project.`;
            } else if (lowerMsg.includes('stats') || lowerMsg.includes('percentage')) {
                response = `Overall project completion is at ${stats.completion}%. Budget utilization is approximately ${stats.cost}%.`;
            } else if (lowerMsg.includes('add') && (lowerMsg.includes('task') || lowerMsg.includes('event'))) {
                response = "I've opened the quick-add shortcut for you! (Feature coming soon: direct natural language entry)";
            }

            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        }, 600);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="glass-panel"
                        style={{
                            width: '350px',
                            height: '500px',
                            marginBottom: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--accent-neon)40'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1rem', background: 'var(--accent-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={18} />
                                <span style={{ fontWeight: '600' }}>Production AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Stats Summary Bar */}
                        <div style={{ display: 'flex', gap: '8px', padding: '0.75rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>
                                <PieChart size={12} color="var(--accent-neon)" /> {stats.completion}% Done
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>
                                <AlertCircle size={12} color="var(--danger)" /> {stats.urgent} Urgent
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>
                                <PlusCircle size={12} color="var(--success)" /> Add Item
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div
                            ref={scrollRef}
                            style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            {messages.map((m, i) => (
                                <div key={i} style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    lineHeight: '1.4',
                                    background: m.role === 'user' ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                                    color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                                    border: m.role === 'user' ? 'none' : '1px solid var(--border-color)'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                            <input
                                className="input-base"
                                placeholder="Ask about tasks or stats..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                style={{ flex: 1, fontSize: '0.85rem' }}
                            />
                            <button onClick={handleSend} className="btn btn-primary" style={{ padding: '8px' }}>
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-primary"
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                }}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </motion.button>
        </div>
    );
};

export default FloatingAssistant;
