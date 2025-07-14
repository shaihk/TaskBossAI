
import React, { useState, useEffect } from 'react';
import { User, UserStats } from '@/api/entities';
import { usersAPI, userStatsAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trophy, Star, TrendingUp, Flame, Zap, BarChart, HelpCircle, Bot, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EditProfileModal from '../components/profile/EditProfileModal';
import UsageInstructions from '../components/common/UsageInstructions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsageInstructions, setShowUsageInstructions] = useState(false);
  const [aiPreferences, setAiPreferences] = useState({
    chatModel: 'gemini-2.5-flash',
    quoteModel: 'gemini-2.5-flash',
    fallbackModel: 'gpt-4o-mini'
  });
  const [availableModels, setAvailableModels] = useState({
    openai: [],
    gemini: []
  });
  const { t } = useTranslation();

  useEffect(() => {
    loadProfileData();
    loadAiPreferences();
  }, []);

  const loadProfileData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const stats = await userStatsAPI.get();
      if (stats) {
        setUserStats(stats);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAiPreferences = async () => {
    try {
      // Load preferences from server
      const token = localStorage.getItem('token');
      const prefResponse = await fetch('/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (prefResponse.ok) {
        const prefData = await prefResponse.json();
        setAiPreferences(prefData.aiModels);
      }

      // Get available models from the server
      const modelsResponse = await fetch('/api/models/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (modelsResponse.ok) {
        const models = await modelsResponse.json();
        setAvailableModels(models);
      } else {
        // Fallback to default models if API fails
        setAvailableModels({
          openai: [
            { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai' },
            { id: 'gpt-4o', name: 'ChatGPT-4o', provider: 'openai' },
            { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
          ],
          gemini: [
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' }
          ]
        });
      }
    } catch (error) {
      console.error("Error loading AI preferences:", error);
    }
  };

  const saveAiPreferences = async (newPreferences) => {
    try {
      // Save to server
      const token = localStorage.getItem('token');
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ aiModels: newPreferences })
      });

      // Update local state
      setAiPreferences(newPreferences);
      
      // Also save to localStorage as backup
      localStorage.setItem('aiModelPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error("Error saving AI preferences:", error);
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

      {/* AI Model Settings */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            AI Model Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chat and Task Advice Model */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-800">Chat & Task Advice</h3>
              </div>
              <p className="text-sm text-gray-600">
                Choose the AI model for chat interactions, task suggestions, and advice.
              </p>
              <Select 
                value={aiPreferences.chatModel} 
                onValueChange={(value) => saveAiPreferences({...aiPreferences, chatModel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model for chat" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Gemini
                  </div>
                  {availableModels.gemini.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Gemini</Badge>
                        {model.name}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OpenAI
                  </div>
                  {availableModels.openai.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">OpenAI</Badge>
                        {model.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quote Generation Model */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-800">Quote Generation</h3>
              </div>
              <p className="text-sm text-gray-600">
                Choose the AI model for generating daily motivational quotes.
              </p>
              <Select 
                value={aiPreferences.quoteModel} 
                onValueChange={(value) => saveAiPreferences({...aiPreferences, quoteModel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model for quotes" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Gemini
                  </div>
                  {availableModels.gemini.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Gemini</Badge>
                        {model.name}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OpenAI
                  </div>
                  {availableModels.openai.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">OpenAI</Badge>
                        {model.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fallback Model */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-800">Fallback Model</h3>
            </div>
            <p className="text-sm text-gray-600">
              Choose the backup AI model to use when the primary model is unavailable.
            </p>
            <Select 
              value={aiPreferences.fallbackModel} 
              onValueChange={(value) => saveAiPreferences({...aiPreferences, fallbackModel: value})}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select fallback model" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Google Gemini
                </div>
                {availableModels.gemini.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Gemini</Badge>
                      {model.name}
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OpenAI
                </div>
                {availableModels.openai.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">OpenAI</Badge>
                      {model.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Status Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Model Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Current Chat Model:</span>
                <Badge variant="secondary">{aiPreferences.chatModel}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Current Quote Model:</span>
                <Badge variant="secondary">{aiPreferences.quoteModel}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Fallback Model:</span>
                <Badge variant="secondary">{aiPreferences.fallbackModel}</Badge>
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
