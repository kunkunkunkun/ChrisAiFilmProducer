import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, PieChart, AlertCircle, PlusCircle, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { callGeminiAPI } from '../utils/gemini';
import { taskStorage, projectStorage } from '../utils/projectStorage';

const FloatingAssistant = () => {
    const { geminiKey } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I am your Production AI. Ask me for status updates or tell me to add new tasks.' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef(null);

    const [stats, setStats] = useState({ completion: 0, cost: 0, pending: 0, urgent: 0 });
    const [projectsContext, setProjectsContext] = useState('');

    useEffect(() => {
        if (isOpen) {
            refreshContext();
        }
    }, [isOpen]);

    const refreshContext = async () => {
        const currentStats = await taskStorage.getStats();
        setStats(currentStats);
        
        const projects = await projectStorage.loadProjects();
        const simplified = projects.map(p => `Project ${p.id}: "${p.name}" (Status: ${p.status})`).join(' | ');
        setProjectsContext(simplified);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsThinking(true);

        if (!geminiKey) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Please configure your Gemini API key in settings to use the AI Agent." }]);
            setIsThinking(false);
            return;
        }

        try {
            const systemPrompt = `You are "Production AI", an expert film production assistant.
Your job is to help the user manage their projects and tasks.
Current Projects: ${projectsContext || 'None'}
Stats: ${stats.pending} pending tasks, ${stats.urgent} urgent tasks.

If the user asks you to add, create, or update a task, or do something actionable, include a JSON block formatted exactly like this somewhere in your response:
\`\`\`json
{
  "actions": [
    { "type": "add_task", "description": "task description here", "project_id": null, "urgency": 1 }
  ]
}
\`\`\`
Note: urgency is 1 for urgent, 0 for normal. project_id is an integer (use null if you don't know).
Always reply naturally to the user and confirm what you did. Be concise.`;

            const chatHistory = messages.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.text}`).join('\n');
            const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\nUser: ${userMsg}\nAI:`;

            const aiResponse = await callGeminiAPI(fullPrompt, geminiKey);
            
            let cleanResponse = aiResponse;
            let actionParsed = false;
            
            // Check for JSON action blocks
            const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1]);
                    if (data.actions && Array.isArray(data.actions)) {
                        for (const action of data.actions) {
                            if (action.type === 'add_task') {
                                await taskStorage.addTask({
                                    projectId: action.project_id || null,
                                    description: action.description,
                                    status: 'pending',
                                    urgency: action.urgency || 0
                                });
                                actionParsed = true;
                            }
                        }
                    }
                    // Remove the JSON block from text shown to user
                    cleanResponse = aiResponse.replace(jsonMatch[0], '').trim();
                } catch(e) {
                    console.error("Failed to parse action JSON from AI", e);
                }
            }

            if (actionParsed) {
                await refreshContext();
            }

            setMessages(prev => [...prev, { role: 'assistant', text: cleanResponse || "Action completed." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${e.message}` }]);
        } finally {
            setIsThinking(false);
        }
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
                                    border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                            {isThinking && (
                                <div style={{
                                    alignSelf: 'flex-start',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <Loader2 size={16} className="animate-spin text-muted" />
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                            <input
                                className="input-base"
                                placeholder="Ask me to add a task..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isThinking}
                                style={{ flex: 1, fontSize: '0.85rem' }}
                            />
                            <button onClick={handleSend} disabled={isThinking} className="btn btn-primary" style={{ padding: '8px' }}>
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
