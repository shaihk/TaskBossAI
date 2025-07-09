
import React, { useState, useEffect } from 'react';
import { User, UserStats } from '@/api/entities';
import { usersAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trophy, Star, TrendingUp, Flame, Zap, BarChart, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EditProfileModal from '../components/profile/EditProfileModal';
import UsageInstructions from '../components/common/UsageInstructions';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsageInstructions, setShowUsageInstructions] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const stats = await UserStats.list();
      if (stats.length > 0) {
        setUserStats(stats[0]);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const levelProgress = userStats ? (userStats.experience_points % 1000) / 10 : 0;
  const nextLevelXP = userStats ? 1000 - (userStats.experience_points % 1000) : 1000;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-white shadow-md">
            <AvatarImage src={user?.picture} alt={user?.full_name} />
            <AvatarFallback className="text-3xl bg-gray-200">
              {user?.full_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-3xl font-bold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleEditProfile}>
                <Edit className="w-4 h-4 ml-2" />
                {t('profile.editProfile')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowUsageInstructions(true)}
                className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
              >
                <HelpCircle className="w-4 h-4 ml-2" />
                הוראות שימוש
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">{t('profile.level', { level: userStats?.current_level || 1 })}</span>
              <span className="text-gray-500">{t('profile.xpProgress', { current: userStats?.experience_points || 0, total: (userStats?.current_level || 1) * 1000 })}</span>
            </div>
            <Progress value={levelProgress} className="h-3" />
            <p className="text-xs text-center text-gray-500">
              {t('profile.nextLevelPoints', { points: nextLevelXP })}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Star} title={t('profile.totalPoints')} value={userStats?.total_points || 0} color="text-yellow-500" />
        <StatCard icon={Zap} title={t('profile.completedTasks')} value={userStats?.tasks_completed || 0} color="text-blue-500" />
        <StatCard icon={Flame} title={t('profile.longestStreak')} value={t('profile.longestStreak', { days: userStats?.longest_streak || 0 })} color="text-red-500" />
        <StatCard icon={Trophy} title={t('profile.achievements')} value={`${userStats?.achievements_unlocked?.length || 0}`} color="text-purple-500" />
      </div>

      {/* Activity and Performance */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-green-500" />
            {t('profile.performanceStats')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-2">{t('profile.preferredCategories')}</h3>
            <div className="flex flex-wrap gap-2">
              {userStats?.preferred_categories?.map(cat => (
                <div key={cat} className="text-sm px-3 py-1 bg-white rounded-full shadow-sm">{cat}</div>
              ))}
              {(!userStats?.preferred_categories || userStats?.preferred_categories.length === 0) && (
                <p className="text-sm text-gray-500">{t('profile.notEnoughData')}</p>
              )}
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-2">{t('profile.dailyGoalStreak')}</h3>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{userStats?.daily_goal_streak || 0}</p>
                <p className="text-sm text-gray-600">{t('profile.consecutiveDays')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUserUpdate={handleUserUpdate}
      />
      
      {/* Usage Instructions Modal */}
      <UsageInstructions
        isOpen={showUsageInstructions}
        onClose={() => setShowUsageInstructions(false)}
      />
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
