
import React, { useState, useEffect } from 'react';
import { UserStats } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ResetProgressButton from '../components/common/ResetProgressButton';
import { useTranslation } from 'react-i18next';

const rarityColors = {
  common: "bg-gray-100 text-gray-800",
  rare: "bg-blue-100 text-blue-800",
  epic: "bg-purple-100 text-purple-800",
  legendary: "bg-yellow-100 text-yellow-800"
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
  }, []);

  const loadStats = async () => {
    try {
      const stats = await UserStats.list();
      if (stats.length > 0) {
        setUserStats(stats[0]);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetProgress = async () => {
    const statsList = await UserStats.list();
    if (statsList.length > 0) {
      const currentStats = statsList[0];
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
  };

  const unlockedAchievements = userStats ? allAchievements.filter(ach => ach.req(userStats)) : [];
  const lockedAchievements = userStats ? allAchievements.filter(ach => !ach.req(userStats)) : allAchievements;

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
  const RarityIcon = rarityIcons[achievement.rarity];
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${unlocked
      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm'
      : 'bg-gray-100 border-gray-200 filter grayscale opacity-60'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${unlocked ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-300'}`}>
        <RarityIcon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
        <p className="text-sm text-gray-600">{achievement.description}</p>
        {unlocked && (
          <Badge className={`${rarityColors[achievement.rarity]} mt-1`}>
            {t('achievements.pointsReward', { points: achievement.points })}
          </Badge>
        )}
      </div>
    </div>
  );
}
