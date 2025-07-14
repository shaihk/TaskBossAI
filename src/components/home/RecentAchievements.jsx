import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, Star, Medal } from "lucide-react";

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

export default function RecentAchievements({ userStats, isLoading }) {
  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>הישגים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock achievements based on user stats
  const mockAchievements = [];
  
  if (userStats?.tasks_completed >= 1) {
    mockAchievements.push({
      title: "מתחיל",
      description: "השלמת המשימה הראשונה",
      rarity: "common",
      points: 50
    });
  }
  
  if (userStats?.current_streak >= 3) {
    mockAchievements.push({
      title: "רצף חזק",
      description: "שמירה על רצף של 3 ימים",
      rarity: "rare",
      points: 100
    });
  }
  
  if (userStats?.total_points >= 500) {
    mockAchievements.push({
      title: "אספן נקודות",
      description: "צבירת 500 נקודות",
      rarity: "epic",
      points: 200
    });
  }

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          הישגים אחרונים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockAchievements.length > 0 ? (
            mockAchievements.map((achievement, index) => {
              const RarityIcon = rarityIcons[achievement.rarity];
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <RarityIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                  <div className="text-left">
                    <Badge className={rarityColors[achievement.rarity]}>
                      {achievement.rarity}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">+{achievement.points} נקודות</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">אין הישגים עדיין</p>
              <p className="text-gray-400 text-xs">השלימו משימות כדי לזכות בהישגים!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}