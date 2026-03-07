import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // null means not logged in
    const [loading, setLoading] = useState(true);

    // Check localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('ai_producer_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (role) => {
        // Generate mock user based on role
        const mockUser = {
            id: `u_${Math.random().toString(36).substr(2, 9)}`,
            name: role === 'producer' ? 'Alex Wong (Producer)' : 'Sam Taylor (Director)',
            role: role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}&backgroundColor=b6e3f4`
        };
        setUser(mockUser);
        localStorage.setItem('ai_producer_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ai_producer_user');
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
