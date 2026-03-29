import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Moon, Sun, Settings as SettingsIcon, ShieldCheck, Mail, Folder } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const SettingsModal = ({ isOpen, onClose }) => {
    const {
        theme, setTheme,
        workspacePath, setWorkspacePath,
        geminiKey, nanoBananaKey, saveKeys,
        localEndpoints, saveLocalEndpoints,
        googleAccount, linkGoogleAccount, unlinkGoogleAccount
    } = useSettings();

    const [tempGemini, setTempGemini] = useState(geminiKey);
    const [tempBanana, setTempBanana] = useState(nanoBananaKey);
    const [tempEmail, setTempEmail] = useState('');
    const [tempLocal, setTempLocal] = useState({ text: '', image: '', video: '', audio: '' });

    useEffect(() => {
        if (isOpen) {
            setTempGemini(geminiKey);
            setTempBanana(nanoBananaKey);
            setTempLocal(localEndpoints || { text: '', image: '', video: '', audio: '' });
        }
    }, [isOpen, geminiKey, nanoBananaKey, localEndpoints]);

    if (!isOpen) return null;

    const handleSave = () => {
        saveKeys(tempGemini, tempBanana);
        saveLocalEndpoints(tempLocal);
        onClose();
    };

    const handleLinkGoogle = () => {
        if (tempEmail.includes('@')) {
            linkGoogleAccount(tempEmail);
            setTempEmail('');
        }
    };

    const handleSelectWorkspace = async () => {
        if (!ipcRenderer) {
            alert("Native file system requires running the Desktop App via Electron.");
            return;
        }
        const folderPath = await ipcRenderer.invoke('select-folder');
        if (folderPath) {
            setWorkspacePath(folderPath);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SettingsIcon size={24} color="var(--text-primary)" /> Application Settings
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Theme Setting */}
                <section>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appearance</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setTheme('light')}
                            className="btn"
                            style={{ flex: 1, padding: '12px', background: theme === 'light' ? 'var(--text-primary)' : 'var(--bg-secondary)', color: theme === 'light' ? 'var(--bg-primary)' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                        >
                            <Sun size={18} /> Light Mode
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className="btn"
                            style={{ flex: 1, padding: '12px', background: theme === 'dark' ? 'var(--text-primary)' : 'var(--bg-secondary)', color: theme === 'dark' ? 'var(--bg-primary)' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                        >
                            <Moon size={18} /> Dark Mode
                        </button>
                    </div>
                </section>

                {/* Workspace Setting */}
                <section>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Workspace</h3>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <Folder size={20} color="var(--accent-neon)" style={{ flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: workspacePath ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {workspacePath || "No Workspace Selected"}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local folder for AI outputs</div>
                            </div>
                        </div>
                        <button onClick={handleSelectWorkspace} className="btn btn-ghost" style={{ padding: '6px 12px', flexShrink: 0 }}>
                            {workspacePath ? "Change" : "Select"}
                        </button>
                    </div>
                </section>

                {/* API Keys */}
                <section>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Configuration</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500' }}>Google Gemini API Key</label>
                            <div style={{ position: 'relative' }}>
                                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    value={tempGemini}
                                    onChange={e => setTempGemini(e.target.value)}
                                    className="input-base"
                                    placeholder="AIzaSyA..."
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500' }}>Nano Banana API Key (Image Gen)</label>
                            <div style={{ position: 'relative' }}>
                                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    value={tempBanana}
                                    onChange={e => setTempBanana(e.target.value)}
                                    className="input-base"
                                    placeholder="nano_banana_pk_..."
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Local API Endpoints */}
                <section>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Local Model Endpoints</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500' }}>Local Text LLM (e.g. Ollama localhost:11434)</label>
                            <input
                                type="text"
                                value={tempLocal.text}
                                onChange={e => setTempLocal(prev => ({ ...prev, text: e.target.value }))}
                                className="input-base"
                                placeholder="http://127.0.0.1:11434/api/generate"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500' }}>Local Image API</label>
                            <input
                                type="text"
                                value={tempLocal.image}
                                onChange={e => setTempLocal(prev => ({ ...prev, image: e.target.value }))}
                                className="input-base"
                                placeholder="http://127.0.0.1:7860/sdapi/v1/txt2img"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500' }}>Local Audio API</label>
                            <input
                                type="text"
                                value={tempLocal.audio}
                                onChange={e => setTempLocal(prev => ({ ...prev, audio: e.target.value }))}
                                className="input-base"
                                placeholder="http://localhost:8000/v1/audio/generations"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '500' }}>Local Video API</label>
                            <input
                                type="text"
                                value={tempLocal.video}
                                onChange={e => setTempLocal(prev => ({ ...prev, video: e.target.value }))}
                                className="input-base"
                                placeholder="http://localhost:8080/generate_video"
                            />
                        </div>
                    </div>
                </section>

                {/* Google Account */}
                <section>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Google Drive Integration</h3>
                    {googleAccount ? (
                        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ShieldCheck size={20} color="var(--success)" />
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{googleAccount.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected for Drive Export</div>
                                </div>
                            </div>
                            <button onClick={unlinkGoogleAccount} className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '6px 12px' }}>Disconnect</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    value={tempEmail}
                                    onChange={e => setTempEmail(e.target.value)}
                                    className="input-base"
                                    placeholder="Enter google email to link..."
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>
                            <button onClick={handleLinkGoogle} disabled={!tempEmail} className="btn btn-primary" style={{ shrink: 0 }}>
                                Connect Drive
                            </button>
                        </div>
                    )}
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 24px' }}>Save Settings</button>
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsModal;
