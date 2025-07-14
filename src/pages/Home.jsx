
import React, { useState, useEffect } from "react";
import { tasksAPI, goalsAPI, usersAPI } from "@/services/api";
import { User, UserStats } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Target, 
  Zap, 
  TrendingUp,
  Calendar,
  Star,
  Award,
  Flame,
  Trophy,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import TodayTasks from "../components/home/TodayTasks";
import GoalProgress from "../components/home/GoalProgress";
import QuickStats from "../components/home/QuickStats";

export default function Home() {
  const [todayTasks, setTodayTasks] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Load today's tasks
      const allTasks = await tasksAPI.getAll();
      const tasks = allTasks.filter(t => t.due_date === today);
      setTodayTasks(tasks);
      
      // Load active goals
      const allGoals = await goalsAPI.getAll();
      const goals = allGoals.filter(g => g.is_active === true);
      setActiveGoals(goals);
      
      // Load user profile and stats
      const currentUser = await User.me();
      setUser(currentUser);

      const stats = await UserStats.list();
      if (stats.length > 0) {
        setUserStats(stats[0]);
      }
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completedTasks = todayTasks.filter(task => task.status === "completed");
  const completionRate = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;
  const levelProgress = userStats ? (userStats.experience_points % 1000) / 10 : 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 glass-effect-strong rounded-3xl border-0 shadow-xl">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-12 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h1 className="text-4xl lg:text-5xl font-bold gradient-text tracking-tight leading-tight">
              {t('home.welcome', { username: user?.full_name || 'User' })}
            </h1>
          </div>
          <p className="text-gray-600 text-lg font-medium flex items-center gap-2">
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

      {/* User Stats Section */}
      <div className="space-y-8">
        {/* User Profile Summary */}
        <Card className="glass-effect-strong border-0 shadow-2xl rounded-3xl overflow-hidden card-hover">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl ring-4 ring-blue-100">
                  <AvatarImage src={user?.picture} alt={user?.full_name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{user?.full_name}</h2>
                  <p className="text-gray-600 font-medium">{user?.email}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">
                      {t('profile.level', { level: userStats?.current_level || 1 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-purple-800">
                      {t('home.totalPoints', { count: userStats?.total_points || 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
                    <Flame className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-800">
                      {t('home.dailyStreak', { count: userStats?.current_streak || 0 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-80 space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{t('profile.xpProgress', { current: userStats?.experience_points || 0, total: 1000})}</span>
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {userStats?.experience_points || 0} XP
                  </span>
                </div>
                <Progress value={levelProgress} className="h-3 bg-white/50" />
                <p className="text-sm text-center text-gray-600 font-medium">
                  {t('profile.nextLevelPoints', { points: 1000 - (userStats?.experience_points || 0) % 1000 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <QuickStats 
          userStats={userStats}
          todayTasks={todayTasks}
          completionRate={completionRate}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <TodayTasks 
            tasks={todayTasks}
            isLoading={isLoading}
            onTaskUpdate={loadDashboardData}
          />
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          {/* Goal Progress */}
          <GoalProgress 
            goals={activeGoals}
            isLoading={isLoading}
          />

          {/* Quick Actions */}
          <Card className="glass-effect-strong border-0 shadow-xl rounded-3xl card-hover">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">{t('home.quickActions')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to={createPageUrl("Goals")} className="block">
                <Button variant="outline" className="w-full justify-start p-4 h-auto rounded-2xl border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-blue-700">
                      {t('home.addNewGoal')}
                    </span>
                  </div>
                </Button>
              </Link>
              <Link to={createPageUrl("Achievements")} className="block">
                <Button variant="outline" className="w-full justify-start p-4 h-auto rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                      <Award className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-purple-700">
                      {t('home.viewAchievements')}
                    </span>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
