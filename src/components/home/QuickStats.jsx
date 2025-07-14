import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Flame, 
  Clock, 
  Target, 
  TrendingUp,
  Star,
  Zap
} from "lucide-react";

export default function QuickStats({ userStats, todayTasks, completionRate, isLoading }) {
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

  const stats = [
    {
      title: "רמה נוכחית",
      value: userStats?.current_level || 1,
      icon: Trophy,
      color: "from-yellow-400 to-orange-500",
      progress: levelProgress,
      subtitle: `${userStats?.experience_points || 0} XP`
    },
    {
      title: "רצף יומי",
      value: userStats?.current_streak || 0,
      icon: Flame,
      color: "from-red-400 to-pink-500",
      progress: Math.min((userStats?.current_streak || 0) * 10, 100),
      subtitle: `מקס: ${userStats?.longest_streak || 0} ימים`
    },
    {
      title: "משימות היום",
      value: `${completedToday}/${todayTasks.length}`,
      icon: Target,
      color: "from-blue-400 to-cyan-500",
      progress: completionRate,
      subtitle: `${pendingTasks} ממתינות`
    },
    {
      title: "נקודות כולל",
      value: userStats?.total_points || 0,
      icon: Star,
      color: "from-purple-400 to-pink-500",
      progress: Math.min((userStats?.total_points || 0) / 100, 100),
      subtitle: `${userStats?.tasks_completed || 0} הושלמו`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="glass-effect-strong border-0 shadow-xl rounded-3xl card-hover overflow-hidden relative group">
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex items-center justify-between text-sm font-bold text-gray-700">
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
                <span className="text-3xl font-bold text-gray-900 leading-none">{stat.value}</span>
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                  {stat.subtitle}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>התקדמות</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {Math.round(stat.progress)}%
                  </span>
                </div>
                <Progress value={stat.progress} className="h-3 bg-gray-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}