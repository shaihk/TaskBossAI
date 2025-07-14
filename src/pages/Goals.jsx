
import React, { useState, useEffect } from 'react';
import { goalsAPI, tasksAPI } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Play, Edit, Trash2, CheckCircle2, Circle, ArrowUpDown, Trophy } from 'lucide-react'; // Added Trophy
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

import GoalForm from '../components/goals/GoalForm';
import GoalDetail from '../components/goals/GoalDetail';
import GoalCompletionModal from '../components/goals/GoalCompletionModal'; // Added GoalCompletionModal import

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const categoryColors = {
  work: "bg-blue-100 text-blue-800",
  personal: "bg-purple-100 text-purple-800",
  health: "bg-green-100 text-green-800",
  learning: "bg-yellow-100 text-yellow-800",
  social: "bg-pink-100 text-pink-800",
  creative: "bg-orange-100 text-orange-800"
};

const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('-created_date');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingGoal, setCompletingGoal] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [sortOrder]);

  const loadData = async () => {
    try {
      const [goalsData, tasksData] = await Promise.all([
        goalsAPI.getAll(),
        tasksAPI.getAll()
      ]);
      setGoals(goalsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (goalData) => {
    try {
      if (editingGoal) {
        await goalsAPI.update(editingGoal.id, goalData);
      } else {
        await goalsAPI.create(goalData);
      }
      setShowForm(false);
      setEditingGoal(null);
      loadData();
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    try {
      await goalsAPI.delete(goalId);
      loadData();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleStartGoal = (goal) => {
    setSelectedGoal(goal);
  };

  const handleCompleteGoal = (goal) => {
    setCompletingGoal(goal);
    setShowCompletionModal(true);
  };

  const handleGoalCompletion = async (completionData) => {
    try {
      await goalsAPI.update(completingGoal.id, {
        status: "completed",
        completed_at: completionData.completed_at,
        completion_status: completionData.completion_status,
        completion_memo: {
            ...completionData.completion_memo, // This should contain final_thoughts, satisfaction_level
            actual_time_taken: completionData.time_taken // Adding time_taken to memo for display consistency
        },
        actual_time_taken: completionData.time_taken // Keep this top-level as well if the schema supports it
      });
      
      setShowCompletionModal(false);
      setCompletingGoal(null);
      loadData();
    } catch (error) {
      console.error("Error completing goal:", error);
    }
  };

  const getGoalTasks = (goalId) => {
    return tasks.filter(task => task.goal_id === goalId);
  };

  const getGoalProgress = (goal) => {
    const goalTasks = getGoalTasks(goal.id);
    if (goalTasks.length === 0) return 0;
    const completedTasks = goalTasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / goalTasks.length) * 100);
  };

  if (selectedGoal) {
    return (
      <GoalDetail 
        goal={selectedGoal}
        tasks={getGoalTasks(selectedGoal.id)}
        onBack={() => setSelectedGoal(null)}
        onTaskUpdate={loadData}
      />
    );
  }

  const sortedGoals = [...goals].sort((a, b) => {
    switch (sortOrder) {
      case 'difficulty_asc':
        return (a.difficulty || 0) - (b.difficulty || 0);
      case 'difficulty_desc':
        return (b.difficulty || 0) - (a.difficulty || 0);
      case 'priority_asc':
        return (priorityMap[a.priority] || 0) - (priorityMap[b.priority] || 0);
      case 'priority_desc':
        return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      case 'time_asc':
        return (a.estimated_time || 0) - (b.estimated_time || 0);
      case 'time_desc':
        return (b.estimated_time || 0) - (a.estimated_time || 0);
      case '-created_date':
      default:
        const dateA = a.created_date ? new Date(a.created_date) : new Date(0);
        const dateB = b.created_date ? new Date(b.created_date) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('goals.title')}
          </h1>
          <p className="text-gray-600">{t('goals.description')}</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('goals.newGoal')}
        </Button>
      </div>
      
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort-goals" className="w-[200px]">
                <SelectValue placeholder={t('goals.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">{t('goals.recentlyAdded')}</SelectItem>
                <SelectItem value="priority_desc">{t('goals.priorityHighToLow')}</SelectItem>
                <SelectItem value="priority_asc">{t('goals.priorityLowToHigh')}</SelectItem>
                <SelectItem value="difficulty_desc">{t('goals.difficultyHighToLow')}</SelectItem>
                <SelectItem value="difficulty_asc">{t('goals.difficultyLowToHigh')}</SelectItem>
                <SelectItem value="time_desc">{t('goals.timeLongToShort')}</SelectItem>
                <SelectItem value="time_asc">{t('goals.timeShortToLong')}</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}

      {showCompletionModal && completingGoal && (
        <GoalCompletionModal
          goal={completingGoal}
          tasks={getGoalTasks(completingGoal.id)}
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletingGoal(null);
          }}
          onComplete={handleGoalCompletion}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGoals.map((goal) => {
          const goalTasks = getGoalTasks(goal.id);
          const progress = getGoalProgress(goal);
          const completedTasks = goalTasks.filter(task => task.status === 'completed').length;
          const isCompleted = goal.status === 'completed';
          
          return (
            <Card 
              key={goal.id} 
              className={`glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                isCompleted ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className={`text-lg ${isCompleted ? 'line-through text-gray-600' : ''}`}>
                    {goal.title}
                  </span>
                  <div className="flex gap-2">
                    {!isCompleted && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goal.description && (
                  <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
                    {goal.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={priorityColors[goal.priority]}>
                    {goal.priority}
                  </Badge>
                  <Badge className={categoryColors[goal.category]}>
                    {goal.category}
                  </Badge>
                  {goal.difficulty && (
                    <Badge variant="outline">
                      קושי: {goal.difficulty}/10
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <Trophy className="w-3 h-3 mr-1" />
                      הושלם
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>התקדמות</span>
                    <span>{completedTasks}/{goalTasks.length} משימות</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500">{progress}% הושלם</p>
                </div>

                {isCompleted && goal.completion_memo && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">זיכרון מהיעד:</p>
                    {goal.completion_memo.final_thoughts && (
                      <p className="text-sm text-green-800 italic">
                        "{goal.completion_memo.final_thoughts.substring(0, 100)}
                        {goal.completion_memo.final_thoughts.length > 100 ? '...' : ''}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {goal.completion_memo.satisfaction_level && (
                        <Badge variant="outline" className="text-xs">
                          שביעות רצון: {goal.completion_memo.satisfaction_level}/5
                        </Badge>
                      )}
                      {goal.completion_memo.actual_time_taken && ( // Changed to goal.completion_memo.actual_time_taken
                        <Badge variant="outline" className="text-xs">
                          {goal.completion_memo.actual_time_taken} דקות
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isCompleted ? (
                    <>
                      <Button
                        onClick={() => handleStartGoal(goal)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        התחל יעד
                      </Button>
                      {progress >= 50 && (
                        <Button
                          onClick={() => handleCompleteGoal(goal)}
                          variant="outline"
                          className="border-green-500 text-green-700 hover:bg-green-50"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          סיים יעד
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={() => handleStartGoal(goal)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      צפה ביעד
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && !isLoading && (
        <Card className="glass-effect border-0 shadow-lg text-center py-20">
          <CardContent>
            <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">אין יעדים עדיין</h2>
            <p className="text-gray-600 mt-2">התחילו ביצירת היעד הראשון שלכם!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
