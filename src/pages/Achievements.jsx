
import React, { useState, useEffect } from 'react';
import { UserStats } from '@/api/entities';
import { userStatsAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Award, Star, Medal, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ResetProgressButton from '../components/common/ResetProgressButton';
import { useTranslation } from 'react-i18next';

// Add custom animations
const customStyles = `
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const rarityColors = {
  common: "bg-gray-100 text-gray-800",
  rare: "bg-blue-100 text-blue-800",
  epic: "bg-purple-100 text-purple-800",
  legendary: "bg-yellow-100 text-yellow-800"
};

const rarityGradients = {
  common: {
    unlocked: "from-gray-50 to-gray-100 border-gray-300",
    icon: "from-gray-400 to-gray-500",
    glow: "shadow-gray-200"
  },
  rare: {
    unlocked: "from-blue-50 to-cyan-100 border-blue-300",
    icon: "from-blue-400 to-cyan-500",
    glow: "shadow-blue-200"
  },
  epic: {
    unlocked: "from-purple-50 to-pink-100 border-purple-300",
    icon: "from-purple-400 to-pink-500",
    glow: "shadow-purple-200"
  },
  legendary: {
    unlocked: "from-yellow-50 to-orange-100 border-yellow-300",
    icon: "from-yellow-400 to-orange-500",
    glow: "shadow-yellow-200"
  }
};

const rarityIcons = {
  common: Award,
  rare: Star,
  epic: Trophy,
  legendary: Medal
};

const getAllAchievements = (t) => [
  { id: 'first_task', title: t('achievements.firstStep'), description: t('achievements.firstStepDesc'), rarity: "common", points: 50, req: (stats) => stats.tasks_completed >= 1 },
  { id: 'tasks_10', title: t('achievements.productive'), description: t('achievements.productiveDesc'), rarity: "common", points: 100, req: (stats) => stats.tasks_completed >= 10 },
  { id: 'tasks_50', title: t('achievements.taskMachine'), description: t('achievements.taskMachineDesc'), rarity: "rare", points: 250, req: (stats) => stats.tasks_completed >= 50 },
  { id: 'streak_3', title: t('achievements.warmingUp'), description: t('achievements.warmingUpDesc'), rarity: "common", points: 100, req: (stats) => stats.longest_streak >= 3 },
  { id: 'streak_7', title: t('achievements.unstoppable'), description: t('achievements.unstoppableDesc'), rarity: "rare", points: 300, req: (stats) => stats.longest_streak >= 7 },
  { id: 'points_1000', title: t('achievements.pointCollector'), description: t('achievements.pointCollectorDesc'), rarity: "rare", points: 200, req: (stats) => stats.total_points >= 1000 },
  { id: 'points_5000', title: t('achievements.xpMillionaire'), description: t('achievements.xpMillionaireDesc'), rarity: "epic", points: 500, req: (stats) => stats.total_points >= 5000 },
  { id: 'level_5', title: t('achievements.beginnerMaster'), description: t('achievements.beginnerMasterDesc'), rarity: "rare", points: 150, req: (stats) => stats.current_level >= 5 },
  { id: 'level_10', title: t('achievements.experiencedMaster'), description: t('achievements.experiencedMasterDesc'), rarity: "epic", points: 400, req: (stats) => stats.current_level >= 10 },
  { id: 'legend', title: t('achievements.legend'), description: t('achievements.legendDesc'), rarity: "legendary", points: 1000, req: (stats) => stats.current_level >= 20 },
];

export default function Achievements() {
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  
  const allAchievements = getAllAchievements(t);

  useEffect(() => {
    loadStats();
    
    // Add focus listener to refresh data when user switches tabs/windows
    const handleFocus = () => {
      loadStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadStats = async () => {
    try {
      const stats = await userStatsAPI.get();
      if (stats) {
        setUserStats(stats);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetProgress = async () => {
    try {
      const currentStats = await userStatsAPI.get();
      if (currentStats) {
        await UserStats.update(currentStats.id, {
          total_points: 0,
          current_level: 1,
          experience_points: 0,
          tasks_completed: 0,
          current_streak: 0,
          longest_streak: 0,
          total_time_saved: 0,
          achievements_unlocked: [],
          daily_goal_streak: 0,
          preferred_categories: []
        });
        await loadStats();
      }
    } catch (error) {
      console.error("Error resetting progress:", error);
    }
  };

  const unlockedAchievements = userStats ? allAchievements.filter(ach => ach.req(userStats)) : [];
  const lockedAchievements = userStats ? allAchievements.filter(ach => !ach.req(userStats)) : allAchievements;
  
  const levelProgress = userStats ? (userStats.experience_points % 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            {t('achievements.title')}
          </h1>
          <p className="text-gray-600">{t('achievements.description')}</p>
        </div>
        <ResetProgressButton onReset={handleResetProgress} />
      </div>

      {/* Score and Level Display */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
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

      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {t('achievements.unlocked', { count: unlockedAchievements.length, total: allAchievements.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map(ach => <AchievementCard key={ach.id} achievement={ach} unlocked={true} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-500">
            <Trophy className="w-5 h-5" />
            {t('achievements.locked')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.map(ach => <AchievementCard key={ach.id} achievement={ach} unlocked={false} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AchievementCard({ achievement, unlocked }) {
  const { t } = useTranslation();
  const RarityIcon = rarityIcons[achievement.rarity];
  const gradient = rarityGradients[achievement.rarity];
  
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-500 transform hover:scale-105 ${unlocked
      ? `bg-gradient-to-r ${gradient.unlocked} ${gradient.glow} shadow-lg animate-pulse-slow`
      : 'bg-gray-100 border-gray-200 filter grayscale opacity-60 hover:opacity-80'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
        unlocked 
          ? `bg-gradient-to-r ${gradient.icon} shadow-lg` 
          : 'bg-gray-300'
      }`}>
        <RarityIcon className={`w-6 h-6 transition-all duration-500 ${
          unlocked 
            ? 'text-white drop-shadow-lg' 
            : 'text-gray-500'
        }`} />
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold transition-all duration-500 ${
          unlocked 
            ? 'text-gray-900' 
            : 'text-gray-500'
        }`}>
          {achievement.title}
        </h4>
        <p className={`text-sm transition-all duration-500 ${
          unlocked 
            ? 'text-gray-600' 
            : 'text-gray-400'
        }`}>
          {achievement.description}
        </p>
        {unlocked && (
          <Badge className={`${rarityColors[achievement.rarity]} mt-1 animate-bounce-slow`}>
            {t('achievements.pointsReward', { points: achievement.points })}
          </Badge>
        )}
        {!unlocked && (
          <div className="text-xs text-gray-400 mt-1">
            🔒 {t('achievements.locked')}
          </div>
        )}
      </div>
    </div>
  );
}
