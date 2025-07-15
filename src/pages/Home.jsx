import React, { useState, useEffect } from "react";
import { tasksAPI, goalsAPI, usersAPI, userStatsAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  Calendar,
  Star,
  Award,
  Flame,
  Trophy,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";

import TodayTasks from "../components/home/TodayTasks";
import GoalProgress from "../components/home/GoalProgress";
import QuickStats from "../components/home/QuickStats";
import Motivation from "../components/home/Motivation";
import FavoriteQuotesModal from "../components/home/FavoriteQuotesModal";

export default function Home() {
  const [todayTasks, setTodayTasks] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [favoriteQuotes, setFavoriteQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    loadDashboardData();
    const savedQuotes = JSON.parse(localStorage.getItem("favoriteQuotes")) || [];
    setFavoriteQuotes(savedQuotes);
    
    // Add focus listener to refresh data when user switches tabs/windows or navigates back
    const handleFocus = () => {
      loadDashboardData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const allTasks = await tasksAPI.getAll();
      const tasks = allTasks.filter(t => t.due_date === today);
      setTodayTasks(tasks);
      
      const allGoals = await goalsAPI.getAll();
      const goals = allGoals.filter(g => g.is_active === true);
      setActiveGoals(goals);
      
      const currentUser = await usersAPI.getMe();
      setUser(currentUser);

      const stats = await userStatsAPI.get();
      if (stats) {
        setUserStats(stats);
      }
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteFavorited = (quote) => {
    const isAlreadyFavorited = favoriteQuotes.some(q => q.quote === quote.quote);
    if (!isAlreadyFavorited) {
      const newFavorites = [...favoriteQuotes, quote];
      setFavoriteQuotes(newFavorites);
      localStorage.setItem("favoriteQuotes", JSON.stringify(newFavorites));
    }
  };

  const handleQuoteDeleted = (indexToDelete) => {
    const newFavorites = favoriteQuotes.filter((_, index) => index !== indexToDelete);
    setFavoriteQuotes(newFavorites);
    localStorage.setItem("favoriteQuotes", JSON.stringify(newFavorites));
  };

  const completedTasks = todayTasks.filter(task => task.status === "completed");
  const completionRate = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;
  const levelProgress = userStats ? (userStats.experience_points % 1000) / 10 : 0;

  const headerBg = isDarkMode ? 'bg-gray-800/80' : 'bg-white/80';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-900';
  const secondaryTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 rounded-3xl shadow-xl ${headerBg} backdrop-blur-sm`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-12 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h1 className={`text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'gradient-text'}`}>
              {t('home.welcome', { username: user?.full_name || 'User' })}
            </h1>
          </div>
          <p className={`${secondaryTextColor} text-lg font-medium flex items-center gap-2`}>
            <Calendar className="w-5 h-5 text-blue-500" />
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: i18n.language === 'he' ? he : undefined })}
          </p>
        </div>
        <div className="flex gap-4">
          <Link to={createPageUrl("Goals")}>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 button-glow">
              <Plus className="w-6 h-6 mr-3" />
              {t('home.newGoal')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Quote Section */}
      <Motivation 
        onQuoteFavorited={handleQuoteFavorited} 
        isDarkMode={isDarkMode}
        favoriteQuotes={favoriteQuotes}
      />

      {/* User Stats Section */}
      <div className="space-y-8">
        <Card className={`${cardBg} shadow-2xl rounded-3xl overflow-hidden card-hover`}>
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl ring-4 ring-blue-100">
                  <AvatarImage src={user?.picture} alt={user?.full_name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className={`text-3xl font-bold ${textColor} mb-1`}>{user?.full_name}</h2>
                  <p className={`${secondaryTextColor} font-medium`}>{user?.email}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-yellow-900/50 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                      {t('profile.level', { level: userStats?.current_level || 1 })}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-purple-900/50 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                      {t('home.totalPoints', { count: userStats?.total_points || 0 })}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-orange-900/50 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                    <Flame className="w-5 h-5 text-orange-600" />
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                      {t('home.dailyStreak', { count: userStats?.current_streak || 0 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`w-full lg:w-80 space-y-4 p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100'}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${textColor}`}>{t('profile.xpProgress', { current: userStats?.experience_points || 0, total: 1000})}</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300 bg-blue-900/50' : 'text-blue-600 bg-blue-100'} px-3 py-1 rounded-full`}>
                    {userStats?.experience_points || 0} XP
                  </span>
                </div>
                <Progress value={levelProgress} className={`h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-white/50'}`} />
                <p className={`text-sm text-center ${secondaryTextColor} font-medium`}>
                  {t('profile.nextLevelPoints', { points: 1000 - (userStats?.experience_points || 0) % 1000 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <QuickStats 
          userStats={userStats}
          todayTasks={todayTasks}
          completionRate={completionRate}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          favoriteQuotes={favoriteQuotes}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TodayTasks 
            tasks={todayTasks}
            isLoading={isLoading}
            onTaskUpdate={loadDashboardData}
          />
        </div>

      </div>

      <div className="w-full">
        <GoalProgress 
          goals={activeGoals}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}