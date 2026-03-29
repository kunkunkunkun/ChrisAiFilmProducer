import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(undefined);

export const SettingsProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('ai_producer_theme') || 'dark');
    const [workspacePath, setWorkspacePathState] = useState(localStorage.getItem('ai_producer_workspace_path') || null);
    const [geminiKey, setGeminiKey] = useState(localStorage.getItem('ai_producer_gemini_key') || '');
    const [nanoBananaKey, setNanoBananaKey] = useState(localStorage.getItem('ai_producer_nano_banana_key') || '');
    const [googleAccount, setGoogleAccount] = useState(localStorage.getItem('ai_producer_google_account') ? JSON.parse(localStorage.getItem('ai_producer_google_account')) : null);
    
    const storedEndpoints = localStorage.getItem('ai_producer_local_endpoints');
    const parsedEndpoints = storedEndpoints ? JSON.parse(storedEndpoints) : {};
    const [localEndpoints, setLocalEndpoints] = useState({
        text: parsedEndpoints.text || '',
        textModel: parsedEndpoints.textModel || '',
        image: parsedEndpoints.image || '',
        video: parsedEndpoints.video || '',
        audio: parsedEndpoints.audio || ''
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ai_producer_theme', theme);
    }, [theme]);

    const setWorkspacePath = (path) => {
        setWorkspacePathState(path);
        if (path) {
            localStorage.setItem('ai_producer_workspace_path', path);
        } else {
            localStorage.removeItem('ai_producer_workspace_path');
        }
    };

    const saveKeys = (gemini, banana) => {
        setGeminiKey(gemini);
        setNanoBananaKey(banana);
        localStorage.setItem('ai_producer_gemini_key', gemini);
        localStorage.setItem('ai_producer_nano_banana_key', banana);
    };

    const saveLocalEndpoints = (endpoints) => {
        setLocalEndpoints(endpoints);
        localStorage.setItem('ai_producer_local_endpoints', JSON.stringify(endpoints));
    };

    const linkGoogleAccount = (email) => {
        const account = { email, linkedAt: new Date().toISOString() };
        setGoogleAccount(account);
        localStorage.setItem('ai_producer_google_account', JSON.stringify(account));
    };

    const unlinkGoogleAccount = () => {
        setGoogleAccount(null);
        localStorage.removeItem('ai_producer_google_account');
    };

    return (
        <SettingsContext.Provider value={{
            theme, setTheme,
            workspacePath, setWorkspacePath,
            geminiKey, nanoBananaKey, saveKeys,
            localEndpoints, saveLocalEndpoints,
            googleAccount, linkGoogleAccount, unlinkGoogleAccount
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
