import Layout from "./Layout.jsx";

import Home from "./Home";

import Tasks from "./Tasks";

import Goals from "./Goals";

import Achievements from "./Achievements";

import Profile from "./Profile";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthForm from '@/components/auth/AuthForm';

const PAGES = {
    
    Home: Home,
    
    Tasks: Tasks,
    
    Goals: Goals,
    
    Achievements: Achievements,
    
    Profile: Profile,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Goals" element={<Goals />} />
                
                <Route path="/Achievements" element={<Achievements />} />
                
                <Route path="/Profile" element={<Profile />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    const { isAuthenticated, loading, login } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthForm onLogin={login} />;
    }

    return (
        <ThemeProvider>
            <Router>
                <PagesContent />
            </Router>
        </ThemeProvider>
    );
}