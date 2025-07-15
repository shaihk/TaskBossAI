import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tasksAPI } from "@/services/api";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Play,
  Pause
} from "lucide-react";
import { format } from "date-fns";

// Priority color schemes for light and dark modes - Traffic light system
const priorityColors = {
  low: {
    light: "border-l-4 border-l-green-400 bg-green-50 hover:bg-green-100",
    dark: "border-l-4 border-l-green-500 bg-green-900/20 hover:bg-green-900/30",
    white: "border-l-4 border-l-green-400 bg-white hover:bg-gray-50"
  },
  medium: {
    light: "border-l-4 border-l-green-600 bg-green-100 hover:bg-green-200",
    dark: "border-l-4 border-l-green-600 bg-green-800/30 hover:bg-green-800/40",
    white: "border-l-4 border-l-green-600 bg-white hover:bg-gray-50"
  },
  high: {
    light: "border-l-4 border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100",
    dark: "border-l-4 border-l-yellow-500 bg-yellow-900/20 hover:bg-yellow-900/30",
    white: "border-l-4 border-l-yellow-500 bg-white hover:bg-gray-50"
  },
  urgent: {
    light: "border-l-4 border-l-red-500 bg-red-50 hover:bg-red-100 animate-pulse-subtle",
    dark: "border-l-4 border-l-red-500 bg-red-900/30 hover:bg-red-900/40 animate-pulse-subtle",
    white: "border-l-4 border-l-red-500 bg-white hover:bg-gray-50 animate-pulse-subtle"
  }
};

const priorityBadgeColors = {
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
  const { isDarkMode } = useTheme();
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
                    isDarkMode={isDarkMode}
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
                    isDarkMode={isDarkMode}
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

function TaskItem({ task, onStatusChange, isDarkMode }) {
  const { t } = useTranslation();
  const StatusIcon = statusIcons[task.status];
  const isCompleted = task.status === "completed";
  const priority = task.priority || 'medium';
  
  // Get user preference for white background
  const useWhiteBackground = localStorage.getItem('taskWhiteBackground') === 'true';

  // Text colors based on priority and theme
  const getTextColors = () => {
    if (isCompleted) {
      return {
        textColor: 'text-gray-500',
        secondaryTextColor: 'text-gray-400'
      };
    }
    
    // For urgent and high priority, use contrasting colors
    if (priority === 'urgent') {
      return isDarkMode ? {
        textColor: 'text-white',
        secondaryTextColor: 'text-gray-100'
      } : {
        textColor: 'text-gray-900',
        secondaryTextColor: 'text-gray-700'
      };
    }
    
    if (priority === 'high') {
      return isDarkMode ? {
        textColor: 'text-white',
        secondaryTextColor: 'text-gray-100'
      } : {
        textColor: 'text-gray-900',
        secondaryTextColor: 'text-gray-700'
      };
    }
    
    // For medium and low priority, use default colors
    return isDarkMode ? {
      textColor: 'text-gray-200',
      secondaryTextColor: 'text-gray-300'
    } : {
      textColor: 'text-gray-900',
      secondaryTextColor: 'text-gray-600'
    };
  };

  const { textColor, secondaryTextColor } = getTextColors();

  return (
    <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-2xl border-2 transition-all duration-300 hover:shadow-lg mobile-task-card ${
      isCompleted 
        ? "bg-green-50 border-l-4 border-l-green-400" 
        : priorityColors[priority]?.[useWhiteBackground ? 'white' : (isDarkMode ? 'dark' : 'light')] || 'bg-white border-l-4 border-l-gray-300'
    }`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onStatusChange(task, isCompleted ? "pending" : "completed")}
        className={`p-1 sm:p-2 h-auto hover:bg-transparent rounded-xl transition-all duration-200 min-w-fit ${
          isCompleted 
            ? "hover:bg-green-100" 
            : "hover:bg-blue-100"
        }`}
      >
        <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${
          isCompleted ? "text-green-600" : "text-gray-400 hover:text-blue-600"
        }`} />
      </Button>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-sm sm:text-base ${isCompleted ? "line-through text-gray-500" : textColor}`}>
          {task.title}
        </h4>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
          <Badge className={`${priorityBadgeColors[priority]} font-semibold text-xs px-2 py-1 sm:px-3 rounded-xl`} variant="secondary">
            {t(`form.priority.${priority}`)}
          </Badge>
          {task.estimated_time && (
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-100'}`}>
              {t('home.estimatedTime', { time: task.estimated_time })}
            </span>
          )}
          {task.difficulty && (
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-100'}`}>
              {t('home.difficulty', { level: task.difficulty })}/10
            </span>
          )}
        </div>
      </div>
      
      {task.points_earned > 0 && (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-xl shadow-lg">
          {t('home.pointsEarned', { points: task.points_earned })}
        </Badge>
      )}
    </div>
  );
}