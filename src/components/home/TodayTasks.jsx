import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tasksAPI } from "@/services/api";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Play,
  Pause
} from "lucide-react";
import { format } from "date-fns";

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const statusIcons = {
  pending: Circle,
  in_progress: Play,
  completed: CheckCircle2,
  paused: Pause
};

export default function TodayTasks({ tasks, isLoading, onTaskUpdate }) {
  const { t } = useTranslation();
  const handleStatusChange = async (task, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === "completed") {
        const completedAt = new Date().toISOString();
        const points = calculatePoints(task);
        updateData.completed_at = completedAt;
        updateData.points_earned = points;
      }
      
      await tasksAPI.update(task.id, updateData);
      onTaskUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const calculatePoints = (task) => {
    let basePoints = task.difficulty * 10;
    
    // Bonus for completing early
    if (task.estimated_time && task.actual_time && task.actual_time < task.estimated_time) {
      basePoints += 20;
    }
    
    // Priority bonus
    const priorityBonus = {
      low: 5,
      medium: 10,
      high: 15,
      urgent: 25
    };
    
    return basePoints + (priorityBonus[task.priority] || 0);
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{t('home.todayTasks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks.filter(task => task.status !== "completed");
  const completedTasks = tasks.filter(task => task.status === "completed");

  return (
    <Card className="glass-effect-strong border-0 shadow-xl rounded-3xl card-hover">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">{t('home.todayTasks')}</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold text-sm">
            {t('home.tasksCount', { count: tasks.length })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border-l-4 border-orange-400">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h4 className="font-bold text-orange-800">
                  {t('home.pendingTasks', { count: pendingTasks.length })}
                </h4>
              </div>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border-l-4 border-green-400">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-green-800">
                  {t('home.completedTasks', { count: completedTasks.length })}
                </h4>
              </div>
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-xl font-bold text-gray-700 mb-2">{t('home.noTasksToday')}</p>
              <p className="text-gray-500">{t('home.perfectTimeToAdd')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ task, onStatusChange }) {
  const { t } = useTranslation();
  const StatusIcon = statusIcons[task.status];
  const isCompleted = task.status === "completed";

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
      isCompleted 
        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300" 
        : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
    }`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onStatusChange(task, isCompleted ? "pending" : "completed")}
        className={`p-2 h-auto hover:bg-transparent rounded-xl transition-all duration-200 ${
          isCompleted 
            ? "hover:bg-green-100" 
            : "hover:bg-blue-100"
        }`}
      >
        <StatusIcon className={`w-6 h-6 ${
          isCompleted ? "text-green-600" : "text-gray-400 hover:text-blue-600"
        }`} />
      </Button>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-base ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-3 mt-2">
          <Badge className={`${priorityColors[task.priority]} font-semibold px-3 py-1 rounded-xl`} variant="secondary">
            {task.priority}
          </Badge>
          {task.estimated_time && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              {t('home.estimatedTime', { time: task.estimated_time })}
            </span>
          )}
          {task.difficulty && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              {t('home.difficulty', { level: task.difficulty })}/10
            </span>
          )}
        </div>
      </div>
      
      {task.points_earned > 0 && (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-3 py-2 rounded-xl shadow-lg">
          {t('home.pointsEarned', { points: task.points_earned })}
        </Badge>
      )}
    </div>
  );
}