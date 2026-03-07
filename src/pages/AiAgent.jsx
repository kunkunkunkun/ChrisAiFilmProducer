import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Image as ImageIcon, Camera, Download, Folder, Upload, UploadCloud, FileText, ChevronRight, User as UserIcon, RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { generateStyleBreakdown, generateSceneBreakdown, generateStoryboardDescription, generateCharacters, extractStoryFromFile } from '../utils/gemini';
import { useSettings } from '../context/SettingsContext';

// Helper to escape CSV strings
const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    return `"${String(str).replace(/"/g, '""')}"`;
};

// Safely require Electron iff running inside Electron
const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const AiAgent = () => {
    const { geminiKey, nanoBananaKey, workspacePath, setWorkspacePath } = useSettings();

    // Wizard State
    // 0: Workspace, 1: Story & Vibe, 2: Characters, 3: Storyboard Grid Editor, 4: Final Output Render
    const [step, setStep] = useState(0);

    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Payload State
    const [story, setStory] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [references, setReferences] = useState([]); // Array of local preview URLs
    const [vibeImages, setVibeImages] = useState([]); // Network fetched images

    const [characters, setCharacters] = useState([]); // [{ name, role, description, imageUrl }]
    const [scenes, setScenes] = useState([]); // [{ sceneNumber, location, action, cameraPrompt, imageUrl }]

    // -------------------------------------------------------------------------------- //
    // NATIVE FILE SYSTEM ACCESS (Electron IPC)
    // -------------------------------------------------------------------------------- //
    const loadWorkspaceData = async (folderPath) => {
        try {
            const csvPath = `${folderPath}/ai_producer_data.csv`;
            const text = await ipcRenderer.invoke('read-file', csvPath);

            if (text) {
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                if (lines.length > 1) {
                    const lastLine = lines[lines.length - 1];
                    const matches = lastLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (matches && matches.length >= 5) {
                        const clean = (str) => str.replace(/^"|"$/g, '').replace(/""/g, '"');
                        const loadedStory = clean(matches[2]);
                        const loadedKeywords = clean(matches[1]).split(';').map(s => s.trim()).filter(Boolean);
                        const loadedChars = JSON.parse(clean(matches[3]) || '[]');
                        const loadedScenes = JSON.parse(clean(matches[4]) || '[]');

                        setStory(loadedStory);
                        setKeywords(loadedKeywords);
                        setCharacters(loadedChars);
                        setScenes(loadedScenes);

                        if (loadedScenes.some(s => s.imageUrl || s.cameraPrompt)) setStep(4);
                        else if (loadedScenes.length > 0) setStep(3);
                        else if (loadedChars.length > 0) setStep(2);
                        else if (loadedKeywords.length > 0) setStep(1);
                        else setStep(1);
                    }
                } else {
                    setStep(1);
                }
            } else {
                setStep(1); // File doesn't exist yet
            }
        } catch (err) {
            console.error(err);
            setStep(1);
        }
    };

    useEffect(() => {
        // If workspacePath already exists globally when component mounts, try to auto-load
        if (workspacePath && step === 0) {
            loadWorkspaceData(workspacePath);
        }
    }, [workspacePath, step]); // Added step to dependencies to re-evaluate if step changes to 0 after mount

    const selectFolder = async () => {
        try {
            if (!ipcRenderer) {
                alert("Native file system requires running the Desktop App via Electron.");
                return;
            }

            const folderPath = await ipcRenderer.invoke('select-folder');
            if (!folderPath) return; // User cancelled

            setWorkspacePath(folderPath);
            await loadWorkspaceData(folderPath);
        } catch (err) {
            console.error("Folder selection failed", err);
        }
    };

    const syncToCsv = async (latestState) => {
        if (!workspacePath || !ipcRenderer) return;
        try {
            const csvPath = `${workspacePath}/ai_producer_data.csv`;
            let content = await ipcRenderer.invoke('read-file', csvPath);

            if (!content) {
                // If it doesn't exist, we send headers first, then the row
                content = "Created Time,Visual Vibe,Story,Characters,Scenes\n";
                await ipcRenderer.invoke('save-file', { filePath: csvPath, data: content, isBuffer: false });
            }

            const row = [
                escapeCsv(new Date().toISOString()),
                escapeCsv((latestState.keywords || keywords).join(';')),
                escapeCsv(latestState.story || story),
                escapeCsv(JSON.stringify(latestState.characters || characters)),
                escapeCsv(JSON.stringify(latestState.scenes || scenes))
            ].join(',');

            await ipcRenderer.invoke('save-file', { filePath: csvPath, data: row + '\n', isBuffer: false });
        } catch (e) {
            console.error("Failed to sync to CSV", e);
        }
    };

    // -------------------------------------------------------------------------------- //
    // STEP 1: STORY & VIBE
    // -------------------------------------------------------------------------------- //
    const processFile = async (file) => {
        if (!file) return;
        setIsExtracting(true);
        setError(null);
        try {
            if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
                const text = await file.text();
                const newStory = story + (story ? '\n\n' : '') + text;
                setStory(newStory);
                await syncToCsv({ story: newStory });
            } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                if (!geminiKey) {
                    throw new Error("Gemini API Key is required for image/pdf OCR extraction.");
                }
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const dataUrl = e.target.result;
                        const base64Data = dataUrl.split(',')[1];
                        const extractedText = await extractStoryFromFile(base64Data, file.type, geminiKey);
                        const newStory = story + (story ? '\n\n' : '') + extractedText;
                        setStory(newStory);
                        await syncToCsv({ story: newStory });
                    } catch (err) {
                        setError("Failed to extract text from file via AI.");
                    } finally {
                        setIsExtracting(false);
                    }
                };
                reader.readAsDataURL(file);
                return; // FileReader is async, handling finally inside onload
            } else {
                setError("Unsupported file type. Please upload TXT, PDF, or Images.");
            }
        } catch (err) {
            setError(err.message || "Failed to parse file.");
        }
        setIsExtracting(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const generateVibe = async () => {
        if (!story.trim() || !geminiKey) return;
        setIsGenerating(true);
        setError(null);
        try {
            const kw = await generateStyleBreakdown(story, geminiKey);
            setKeywords(kw);
            await syncToCsv({ story, keywords: kw });
            searchVibeImages(kw);
        } catch (e) {
            setError("Failed to generate vibe. Check your API key.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            const updated = [...keywords, newKeyword.trim()];
            setKeywords(updated);
            setNewKeyword('');
            syncToCsv({ keywords: updated });
        }
    };

    const handleRemoveKeyword = (indexToRemove) => {
        const updated = keywords.filter((_, i) => i !== indexToRemove);
        setKeywords(updated);
        syncToCsv({ keywords: updated });
    };

    const searchVibeImages = async (kwArray = keywords) => {
        setIsGenerating(true);
        try {
            await new Promise(res => setTimeout(res, 800));
            const mockResults = Array.from({ length: 5 }).map((_, i) => {
                const seed = Math.floor(Math.random() * 1000);
                const query = kwArray.length > 0 ? kwArray[i % kwArray.length] : 'cinematic';
                return `https://source.unsplash.com/random/400x300/?${query},film,${seed}`;
            });
            setVibeImages(mockResults);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveVibeImageLocal = async (url) => {
        if (!workspacePath || !ipcRenderer) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const filename = `vibe_ref_${Date.now()}.jpg`;
            const filePath = `${workspacePath}/${filename}`;

            const result = await ipcRenderer.invoke('save-file', {
                filePath,
                data: Buffer.from(arrayBuffer),
                isBuffer: true
            });

            if (result.success) {
                setReferences(prev => [...prev, url]);
                alert(`Saved as ${filename} to workspace!`);
            } else {
                throw new Error("IPC Save failed");
            }
        } catch (e) {
            console.error("Failed to save vibe image natively", e);
            alert("Failed to save image natively. Check console for details.");
        }
    };

    const handleUploadReference = (e) => {
        const files = Array.from(e.target.files);
        const newRefs = files.map(file => URL.createObjectURL(file));
        setReferences(prev => [...prev, ...newRefs]);
    };

    // -------------------------------------------------------------------------------- //
    // STEP 2: CHARACTER DESIGN
    // -------------------------------------------------------------------------------- //
    const generateInitialCharacters = async () => {
        if (!geminiKey) return;
        setIsGenerating(true);
        try {
            const chars = await generateCharacters(story, keywords, geminiKey);
            const enriched = chars.map(c => ({
                ...c,
                imageUrl: null
            }));
            setCharacters(enriched);
            setStep(2);
            await syncToCsv({ characters: enriched });
        } catch (e) {
            setError("Failed to generate characters.");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateCharacterText = (index, text) => {
        const updated = [...characters];
        updated[index].description = text;
        setCharacters(updated);
    };

    const regenerateCharacterImage = async (index) => {
        const updated = [...characters];
        updated[index].imageUrl = "loading";
        setCharacters([...updated]);

        try {
            if (nanoBananaKey) {
                await new Promise(res => setTimeout(res, 1500));
                updated[index].imageUrl = `https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400&h=400&timestamp=${Date.now()}`;
            } else {
                updated[index].imageUrl = null;
                alert("Please configure Nano Banana API Key in Settings to render images.");
            }
        } catch (e) {
            updated[index].imageUrl = null;
        }

        setCharacters([...updated]);
        await syncToCsv({ characters: updated });
    };

    const saveCharacterToLocal = async (char) => {
        if (!workspacePath || !char.imageUrl || !ipcRenderer) return;
        try {
            const response = await fetch(char.imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const filename = `${char.name.replace(/[^a-z0-9]/gi, '_')}_concept.jpg`;
            const filePath = `${workspacePath}/${filename}`;

            const result = await ipcRenderer.invoke('save-file', {
                filePath,
                data: Buffer.from(arrayBuffer),
                isBuffer: true
            });

            if (result.success) {
                alert(`Saved ${char.name} T-Pose to workspace natively!`);
            } else {
                throw new Error("IPC Save failed");
            }
        } catch (e) {
            console.error("Failed to save character image natively", e);
            alert("Failed to save image natively. Check console for details.");
        }
    };

    // -------------------------------------------------------------------------------- //
    // STEP 3: STORYBOARD GRID (Editable)
    // -------------------------------------------------------------------------------- //
    const generateStoryboardGrid = async () => {
        if (!geminiKey) return;
        setIsGenerating(true);
        setStep(3);
        try {
            const basicScenes = await generateSceneBreakdown(story, keywords, characters, geminiKey);
            setScenes(basicScenes);
            await syncToCsv({ scenes: basicScenes });
        } catch (e) {
            setError("Failed to generate scene grid.");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateSceneField = (index, field, value) => {
        const updated = [...scenes];
        updated[index][field] = value;
        setScenes(updated);
    };

    const addSceneRow = () => {
        const newScene = { sceneNumber: scenes.length + 1, location: "NEW LOCATION", action: "New scene action..." };
        setScenes([...scenes, newScene]);
    };

    const deleteSceneRow = (index) => {
        const updated = scenes.filter((_, i) => i !== index).map((s, i) => ({ ...s, sceneNumber: i + 1 }));
        setScenes(updated);
    };

    // -------------------------------------------------------------------------------- //
    // STEP 4: FINAL STORYBOARD RENDER
    // -------------------------------------------------------------------------------- //
    const approveAndRenderStoryboard = async () => {
        setStep(4);
        setIsGenerating(true);
        const enrichedScenes = [...scenes];

        for (let i = 0; i < enrichedScenes.length; i++) {
            const scene = enrichedScenes[i];
            scene.cameraPrompt = "Generating AI description...";
            scene.imageUrl = null;
            setScenes([...enrichedScenes]); // Trigger UI update for loading state

            try {
                scene.cameraPrompt = await generateStoryboardDescription(scene, keywords, characters, geminiKey);
                if (nanoBananaKey) {
                    await new Promise(res => setTimeout(res, 800));
                    const mockImages = [
                        'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=800'
                    ];
                    scene.imageUrl = mockImages[i % mockImages.length];
                }
            } catch (e) {
                scene.cameraPrompt = "Failed to generate AI camera prompt.";
            }

            setScenes([...enrichedScenes]); // Trigger UI update after generation
        }

        setIsGenerating(false);
        await syncToCsv({ scenes: enrichedScenes });
    };

    // -------------------------------------------------------------------------------- //
    // RENDER HELPERS
    // -------------------------------------------------------------------------------- //
    const renderSteps = () => (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {['Workspace', 'Vibe', 'Characters', 'Shot Grid', 'Storyboard'].map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= i ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step >= i ? '600' : '400' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= i ? 'var(--text-primary)' : 'var(--bg-tertiary)', color: step >= i ? 'var(--bg-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                        {i + 1}
                    </div>
                    {name}
                    {i < 4 && <ChevronRight size={16} color="var(--border-color)" />}
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={32} color="var(--accent-neon)" /> Ideation Wizard
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>A multi-step production pipeline connected directly to your local workspace.</p>
            </header>

            {renderSteps()}

            <AnimatePresence mode="wait">
                {/* ---------- STEP 0: WORKSPACE ---------- */}
                {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <Folder size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Select Local Workspace</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
                            All generated ideas, vibes, characters, and storyboards will be automatically saved and synced to a CSV file in your chosen working folder.
                        </p>
                        <button onClick={selectFolder} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                            <Folder size={18} /> Choose Folder
                        </button>
                    </motion.div>
                )}

                {/* ---------- STEP 1: STORY & VIBE ---------- */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.2rem' }}>Original Story Concept</h3>
                                <label className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <UploadCloud size={16} /> Upload Doc/Img
                                    <input type="file" accept=".txt,.pdf,image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
                                </label>
                            </div>

                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                style={{
                                    position: 'relative',
                                    marginBottom: '1.5rem',
                                    borderRadius: '8px',
                                    border: isDragging ? '2px dashed var(--accent-neon)' : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <textarea
                                    value={story}
                                    onChange={(e) => setStory(e.target.value)}
                                    placeholder="Type your story here, or drag & drop a text file, PDF, or image to extract concepts automatically..."
                                    className="input-base"
                                    style={{ height: '180px', resize: 'vertical', fontSize: '1.1rem', background: 'var(--bg-secondary)', width: '100%', margin: 0 }}
                                />
                                {isExtracting && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--text-primary)', zIndex: 10 }}>
                                        <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px', color: 'var(--accent-neon)' }} />
                                        <div style={{ fontWeight: '500' }}>Extracting Story via AI Vision...</div>
                                    </div>
                                )}
                                {isDragging && !isExtracting && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--accent-neon)', zIndex: 10, pointerEvents: 'none' }}>
                                        <FileText size={48} style={{ marginBottom: '12px' }} />
                                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Drop File to Extract text</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</span>
                                <button onClick={generateVibe} disabled={isGenerating || isExtracting || !story.trim()} className="btn btn-primary">
                                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    Generate Vibe & Style
                                </button>
                            </div>
                        </div>

                        {keywords.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Visual Look & Focus (Editable)</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '2rem', alignItems: 'center' }}>
                                    {keywords.map((kw, i) => (
                                        <span key={i} style={{ padding: '8px 12px 8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            #{kw}
                                            <button onClick={() => handleRemoveKeyword(i)} className="btn-icon" style={{ padding: '2px', borderRadius: '50%', color: 'var(--text-muted)' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </span>
                                    ))}
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '24px', padding: '4px 4px 4px 16px', border: '1px solid var(--border-color)' }}>
                                        <input
                                            type="text"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                            placeholder="Add keyword..."
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '120px', fontSize: '0.9rem' }}
                                        />
                                        <button onClick={handleAddKeyword} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '1rem' }}>Network Vibe References</h4>
                                        <button onClick={() => searchVibeImages(keywords)} disabled={isGenerating} className="btn btn-ghost" style={{ padding: '6px 12px' }}>
                                            <RefreshCw size={14} /> Refetch
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                        {vibeImages.map((url, i) => (
                                            <div key={i} style={{ width: '160px', flexShrink: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <img src={url} alt="Vibe" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', justifyContent: 'center' }}>
                                                    <button onClick={() => saveVibeImageLocal(url)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto', background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                                                        <Save size={12} style={{ marginRight: '4px' }} /> Save Locally
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {isGenerating && vibeImages.length === 0 && (
                                            <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Loader2 className="animate-spin" size={16} /> Fetching visuals...</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>My Workspace References</h4>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {references.map((url, i) => (
                                            <div key={i} style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <img src={url} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                        <label style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleUploadReference} />
                                            <Upload size={24} />
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                    <button onClick={generateInitialCharacters} disabled={isGenerating} className="btn btn-primary" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                                        Proceed to Character Design <ChevronRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ---------- STEP 2: CHARACTER DESIGN ---------- */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Core Cast & T-Pose Generation</h2>
                            <button onClick={generateStoryboardGrid} disabled={isGenerating} className="btn btn-primary">
                                Approve & Proceed to Shot List <ChevronRight size={18} />
                            </button>
                        </div>

                        {characters.map((char, index) => (
                            <div key={index} className="glass-panel" style={{ display: 'flex', gap: '2rem', padding: '1.5rem', background: 'var(--bg-primary)' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <UserIcon size={24} color="var(--text-muted)" />
                                        <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{char.name}</h3>
                                        <span style={{ fontSize: '0.85rem', padding: '4px 10px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>{char.role}</span>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>T-Pose Visual Prompt (Editable):</label>
                                        <textarea
                                            value={char.description}
                                            onChange={(e) => updateCharacterText(index, e.target.value)}
                                            className="input-base"
                                            style={{ height: '120px', resize: 'vertical', fontSize: '0.95rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                        <button onClick={() => regenerateCharacterImage(index)} className="btn btn-ghost" style={{ background: 'var(--bg-tertiary)' }}>
                                            <RefreshCw size={16} /> Nano Banana Render
                                        </button>
                                        {char.imageUrl && char.imageUrl !== 'loading' && (
                                            <button onClick={() => saveCharacterToLocal(char)} className="btn btn-ghost" style={{ color: 'var(--success)', border: '1px solid currentColor' }}>
                                                <Save size={16} /> Save Local
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ width: '300px', flexShrink: 0, height: '300px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {char.imageUrl === 'loading' ? (
                                        <Loader2 size={32} className="animate-spin" color="var(--text-muted)" />
                                    ) : char.imageUrl ? (
                                        <img src={char.imageUrl} alt="T-Pose" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                            <div style={{ fontSize: '0.85rem' }}>Awaiting Nano Banana Render</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ---------- STEP 3: STORYBOARD GRID (Editable) ---------- */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Editable Shot List</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>Review and modify the parsed scene grid before initiating the final batch render.</p>
                            </div>
                            <button onClick={approveAndRenderStoryboard} disabled={isGenerating || scenes.length === 0} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                                Approve & Render Storyboard <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '12px', width: '80px', color: 'var(--text-muted)', fontWeight: '500' }}>Shot</th>
                                        <th style={{ padding: '12px', width: '25%', color: 'var(--text-muted)', fontWeight: '500' }}>Location</th>
                                        <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Action Description</th>
                                        <th style={{ padding: '12px', width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scenes.map((scene, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s', ':hover': { background: 'var(--bg-secondary)' } }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{scene.sceneNumber}</td>
                                            <td style={{ padding: '12px' }}>
                                                <input
                                                    value={scene.location}
                                                    onChange={e => updateSceneField(index, 'location', e.target.value)}
                                                    className="input-base"
                                                    style={{ width: '100%', fontSize: '0.9rem', padding: '8px' }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <textarea
                                                    value={scene.action}
                                                    onChange={e => updateSceneField(index, 'action', e.target.value)}
                                                    className="input-base"
                                                    style={{ width: '100%', fontSize: '0.9rem', padding: '8px', height: '60px', resize: 'vertical' }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button onClick={() => deleteSceneRow(index)} className="btn btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                                <button onClick={addSceneRow} className="btn btn-ghost" style={{ border: '1px dashed var(--border-color)', width: '100%', padding: '12px', color: 'var(--text-muted)' }}>
                                    <Plus size={16} /> Add New Shot
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ---------- STEP 4: FINAL STORYBOARD RENDER ---------- */}
                {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'var(--bg-glass)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                                {!isGenerating ? <Sparkles size={24} color="var(--success)" /> : <Loader2 size={24} className="animate-spin" color="var(--accent-neon)" />}
                                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                                    {isGenerating ? "Rendering Storyboard Images..." : "Final Storyboard Output Saved to CSV"}
                                </span>
                            </div>
                        </div>

                        {scenes.map((scene, i) => (
                            <div key={i} className="glass-panel" style={{ display: 'flex', gap: '2rem', padding: '1.5rem' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                                            {scene.sceneNumber}
                                        </div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{scene.location}</h4>
                                    </div>
                                    <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem', flex: 1 }}>{scene.action}</p>

                                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--text-primary)' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}><Camera size={14} /> Camera Direction</div>
                                        <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>"{scene.cameraPrompt || 'Waiting for AI...'}"</p>
                                    </div>
                                </div>

                                <div style={{ width: '280px', flexShrink: 0, height: '200px', background: 'var(--bg-secondary)', borderRadius: '8px', border: scene.imageUrl ? 'none' : '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} alt="Scene" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : scene.cameraPrompt?.includes("Generating") ? (
                                        <Loader2 className="animate-spin" size={32} color="var(--text-muted)" />
                                    ) : (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Storyboard Frame {scene.sceneNumber}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AiAgent;
