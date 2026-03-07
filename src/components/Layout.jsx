import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import FloatingAssistant from './FloatingAssistant';
import { useSettings } from '../context/SettingsContext';


const Layout = () => {
    const { geminiKey } = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // If first login and no Gemini key is set, prompt immediately
    useEffect(() => {
        if (!geminiKey) {
            setIsSettingsOpen(true);
        }
    }, [geminiKey]);
    return (
        <div className="layout-container">
            {/* Left Navigation */}
            <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />

            {/* Main Working Area */}
            <main style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '2rem'
            }}>
                {/* Render nested routes here (Dashboard or AiAgent) */}
                <Outlet />
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <FloatingAssistant />
        </div>


    );
};

export default Layout;
