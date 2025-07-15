import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Trophy, 
  Flame, 
  Target, 
  Star,
  Award
} from "lucide-react";
import FavoriteQuotesModal from "./FavoriteQuotesModal";

export default function QuickStats({ userStats, todayTasks, completionRate, isLoading, isDarkMode, favoriteQuotes }) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="glass-effect border-0 shadow-lg">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const levelProgress = userStats ? (userStats.experience_points % 1000) / 10 : 0;
  const pendingTasks = todayTasks.filter(task => task.status === "pending").length;
  const completedToday = todayTasks.filter(task => task.status === "completed").length;

  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-900';
  const secondaryTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  const stats = [
    {
      title: t('home.currentLevel'),
      value: userStats?.current_level || 1,
      icon: Trophy,
      color: "from-yellow-400 to-orange-500",
      progress: levelProgress,
      subtitle: `${userStats?.experience_points || 0} XP`
    },
    {
      title: t('home.dailyStreak'),
      value: userStats?.current_streak || 0,
      icon: Flame,
      color: "from-red-400 to-pink-500",
      progress: Math.min((userStats?.current_streak || 0) * 10, 100),
      subtitle: t('home.maxStreak', { days: userStats?.longest_streak || 0 })
    },
    {
      title: t('home.todayTasks'),
      value: `${completedToday}/${todayTasks.length}`,
      icon: Target,
      color: "from-blue-400 to-cyan-500",
      progress: completionRate,
      subtitle: t('home.pendingTasks', { count: pendingTasks })
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className={`${cardBg} shadow-xl rounded-3xl card-hover overflow-hidden relative group`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className={`flex items-center justify-between text-sm font-bold ${secondaryTextColor}`}>
              {stat.title}
              <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-20 blur-lg group-hover:blur-xl transition-all duration-300`}></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-bold ${textColor} leading-none`}>{stat.value}</span>
                <span className={`text-sm font-medium ${secondaryTextColor} ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} px-2 py-1 rounded-lg`}>
                  {stat.subtitle}
                </span>
              </div>
              <div className="space-y-2">
                <div className={`flex justify-between text-xs font-semibold ${secondaryTextColor}`}>
                  <span>{t('home.progress')}</span>
                  <span className={`${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'} px-2 py-0.5 rounded-full`}>
                    {Math.round(stat.progress)}%
                  </span>
                </div>
                <Progress value={stat.progress} className={`h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}