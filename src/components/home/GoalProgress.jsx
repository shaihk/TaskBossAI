import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, Calendar } from "lucide-react";

const goalTypeColors = {
  daily: "bg-blue-100 text-blue-800",
  weekly: "bg-purple-100 text-purple-800",
  monthly: "bg-green-100 text-green-800",
  custom: "bg-orange-100 text-orange-800"
};

export default function GoalProgress({ goals, isLoading }) {
  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>התקדמות יעדים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(goal => goal.is_active && !goal.completed);

  return (
    <Card className="glass-effect-strong border-0 shadow-xl rounded-3xl card-hover">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">התקדמות יעדים</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activeGoals.length > 0 ? (
            activeGoals.slice(0, 3).map((goal) => {
              const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
              const isCompleted = goal.current_value >= goal.target_value;
              
              return (
                <div key={goal.id} className="space-y-3 p-4 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm">{goal.title}</h4>
                    <Badge className={`${goalTypeColors[goal.type]} font-semibold px-3 py-1 rounded-xl`}>
                      {goal.type}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={progress} className="h-3 bg-gray-200" />
                    <div className="flex justify-between text-xs font-medium text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded-lg">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-bold">יעד הושלם!</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-700 mb-2">אין יעדים פעילים</p>
              <p className="text-gray-500">התחל ביצירת יעדים חדשים!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}