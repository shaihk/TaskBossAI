
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  CheckSquare, 
  Target, 
  Trophy, 
  User, 
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/common/LanguageSelector";
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import UsageInstructions from '@/components/common/UsageInstructions';

const getNavigationItems = (t) => [
  { name: t("nav.home"), url: createPageUrl("Home"), icon: Home },
  { name: t("nav.goals"), url: createPageUrl("Goals"), icon: Target },
  { name: t("nav.tasks"), url: createPageUrl("Tasks"), icon: CheckSquare },
  { name: t("nav.achievements"), url: createPageUrl("Achievements"), icon: Trophy },
  { name: t("nav.profile"), url: createPageUrl("Profile"), icon: User },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showUsageInstructions, setShowUsageInstructions] = React.useState(false);
  
  const navigationItems = getNavigationItems(t);

  const handleLogout = () => {
    logout();
  };
  
  // Set document direction based on language
  React.useEffect(() => {
    document.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900/30 to-indigo-900/50' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50'}`} dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          :root {
            --primary-blue: #1e40af;
            --primary-purple: #8b5cf6;
            --secondary-blue: #3b82f6;
            --accent-gold: #f59e0b;
            --accent-emerald: #10b981;
            --accent-rose: #f43f5e;
            --success-green: #059669;
            --warning-orange: #ea580c;
            --neutral-50: #f8fafc;
            --neutral-100: #f1f5f9;
            --neutral-200: #e2e8f0;
            --neutral-300: #cbd5e1;
            --neutral-400: #94a3b8;
            --neutral-500: #64748b;
            --neutral-600: #475569;
            --neutral-700: #334155;
            --neutral-800: #1e293b;
            --neutral-900: #0f172a;
            
            /* Light mode variables */
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-tertiary: #f1f5f9;
            --text-primary: #1e293b;
            --text-secondary: #475569;
            --text-tertiary: #64748b;
            --border-primary: #e2e8f0;
            --border-secondary: #cbd5e1;
            --glass-bg: rgba(255, 255, 255, 0.80);
            --glass-bg-strong: rgba(255, 255, 255, 0.95);
            --glass-border: rgba(255, 255, 255, 0.125);
            --glass-border-strong: rgba(255, 255, 255, 0.2);
          }
          
          .dark {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-tertiary: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-tertiary: #94a3b8;
            --border-primary: #334155;
            --border-secondary: #475569;
            --glass-bg: rgba(15, 23, 42, 0.80);
            --glass-bg-strong: rgba(15, 23, 42, 0.95);
            --glass-border: rgba(255, 255, 255, 0.05);
            --glass-border-strong: rgba(255, 255, 255, 0.1);
          }
          
          * {
            font-feature-settings: "cv11", "ss01";
            font-variant: normal;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            font-weight: 400;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .glass-effect {
            background: var(--glass-bg);
            backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid var(--glass-border);
            box-shadow: 
              0 8px 32px 0 rgba(31, 38, 135, 0.37),
              0 0 0 1px var(--glass-border) inset;
          }
          
          .glass-effect-strong {
            background: var(--glass-bg-strong);
            backdrop-filter: blur(40px) saturate(200%);
            border: 1px solid var(--glass-border-strong);
            box-shadow: 
              0 20px 40px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px var(--glass-border-strong) inset;
          }
          
          .gradient-text {
            background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple), var(--secondary-blue));
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient-shift 3s ease infinite;
          }
          
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          .floating-animation {
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-8px) rotate(1deg); }
            66% { transform: translateY(-4px) rotate(-1deg); }
          }
          
          .slide-in {
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          .scale-in {
            animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          
          .glow-effect {
            position: relative;
          }
          
          .glow-effect::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: inherit;
            background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple));
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
            filter: blur(20px);
          }
          
          .glow-effect:hover::before {
            opacity: 0.4;
          }
          
          .mesh-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
            pointer-events: none;
            transition: opacity 0.5s ease;
          }
          
          .dark .mesh-background {
            background-image: 
              radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
          }
          
          .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-hover:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          }
          
          .button-glow {
            position: relative;
            overflow: hidden;
          }
          
          .button-glow::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.5s;
          }
          
          .button-glow:hover::before {
            left: 100%;
          }
        `}
      </style>
      
      {/* Mesh Background */}
      <div className="mesh-background"></div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div className="flex grow flex-col gap-y-6 overflow-y-auto glass-effect-strong px-6 pb-6 m-4 rounded-2xl scale-in">
          <div className="flex h-24 shrink-0 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center floating-animation shadow-lg glow-effect">
                <Sparkles className="w-7 h-7 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 blur-lg"></div>
              </div>
              {!sidebarCollapsed && (
                <div className="text-right">
                  <h1 className="text-xl font-bold gradient-text tracking-tight">TaskMaster AI</h1>
                  <p className={`text-xs font-medium mt-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>{t('home.smartTaskManager')}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2.5 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-gray-800/20' : 'hover:bg-white/20'
              }`}
            >
              {sidebarCollapsed ? 
                <ChevronLeft className={`h-5 w-5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} /> : 
                <ChevronRight className={`h-5 w-5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              }
            </Button>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-3">
              {navigationItems.map((item, index) => (
                <li key={item.name}>
                  <Link
                    to={item.url}
                    className={`group flex gap-x-4 rounded-2xl p-4 text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                      location.pathname === item.url
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl glow-effect'
                        : isDarkMode 
                          ? 'text-gray-200 hover:text-white hover:bg-gray-800/60 hover:shadow-md card-hover'
                          : 'text-gray-700 hover:text-blue-700 hover:bg-white/60 hover:shadow-md card-hover'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.name : ''}
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className={`relative z-10 p-1 rounded-lg ${
                      location.pathname === item.url 
                        ? 'bg-white/20' 
                        : isDarkMode
                          ? 'group-hover:bg-gray-700/50 transition-colors duration-200'
                          : 'group-hover:bg-blue-50 transition-colors duration-200'
                    }`}>
                      <item.icon className={`h-5 w-5 shrink-0 ${
                        location.pathname === item.url 
                          ? 'text-white' 
                          : isDarkMode
                            ? 'text-gray-300 group-hover:text-white'
                            : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="relative z-10 tracking-wide">
                        {item.name}
                      </span>
                    )}
                    {location.pathname === item.url && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {!sidebarCollapsed && (
              <div className={`mt-auto pt-6 border-t space-y-4 ${
                isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
              }`}>
                <div className={`px-4 py-3 rounded-xl border transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-800 to-blue-900 border-gray-600' 
                    : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-100'
                }`}>
                  <div className={`text-sm font-semibold truncate ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    {user?.full_name || user?.email}
                  </div>
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>פרפיל משתמש</div>
                </div>
                <div className="px-2 space-y-2">
                  <LanguageSelector />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDarkMode}
                    className={`w-full justify-start rounded-xl p-3 transition-all duration-200 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
                    }`}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
                    <span className="font-medium">{isDarkMode ? t('theme.lightMode') : t('theme.darkMode')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsageInstructions(true)}
                    className={`w-full justify-start rounded-xl p-3 transition-all duration-200 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4 mr-3" />
                    <span className="font-medium">{t('usage.title')}</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-full justify-start rounded-xl p-3 transition-all duration-200 ${
                    isDarkMode
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50/80'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span className="font-medium">{t('auth.logout')}</span>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 glass-effect px-4 shadow-sm lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex h-16 shrink-0 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">TaskMaster AI</span>
              </div>
            </div>
            <nav className="mt-8">
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all duration-200 ${
                        location.pathname === item.url
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : isDarkMode
                            ? 'text-gray-200 hover:text-white hover:bg-gray-800/60'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4 border-t border-gray-200 space-y-3">
                <div className={`px-3 py-2 text-xs ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {user?.full_name || user?.email}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-full justify-start ${
                    isDarkMode
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.logout')}
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">TaskMaster AI</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={`transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'lg:pr-24' : 'lg:pr-80'} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="px-6 py-10 sm:px-8 lg:px-12 min-h-screen">
          <div className="mx-auto max-w-7xl relative z-10">
            <div className="scale-in">
              {children}
            </div>
          </div>
        </div>
      </main>
      
      {/* Usage Instructions Modal */}
      <UsageInstructions
        isOpen={showUsageInstructions}
        onClose={() => setShowUsageInstructions(false)}
      />
    </div>
  );
}
