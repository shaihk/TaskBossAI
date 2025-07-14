
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { tasksAPI } from "@/services/api";
import { UserStats } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause,
  MessageCircle,
  Lightbulb,
  BrainCircuit,
  Send,
  Sparkles,
  Loader2
} from "lucide-react";

import TaskList from "../tasks/TaskList";
import AIChat from "./AIChat";

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

export default function GoalDetail({ goal, tasks, onBack, onTaskUpdate }) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);

  const completedTasks = tasks.filter(task => task.status === 'completed');
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setIsAddingTask(true);
    try {
      await tasksAPI.create({
        title: newTaskTitle.trim(),
        goal_id: goal.id,
        status: "pending",
        priority: goal.priority || 'medium', // Added priority field based on goal's priority or default
        difficulty: goal.difficulty || 5,
        estimated_time: 30,
        due_date: goal.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setNewTaskTitle("");
      onTaskUpdate();
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
        updateData.points_earned = calculatePoints(task);
        
        // Update user stats
        await updateUserStats(task);
      }
      
      await tasksAPI.update(task.id, updateData);
      onTaskUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const calculatePoints = (task) => {
    let basePoints = (task.difficulty || 5) * 10;
    
    const priorityBonus = {
      low: 5,
      medium: 10,
      high: 15,
      urgent: 25
    };
    
    return basePoints + (priorityBonus[goal.priority] || 0);
  };

  const updateUserStats = async (task) => {
    try {
      const stats = await UserStats.list();
      if (stats.length > 0) {
        const userStats = stats[0];
        const newPoints = userStats.total_points + (task.points_earned || 0);
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        await UserStats.update(userStats.id, {
          total_points: newPoints,
          current_level: newLevel,
          experience_points: newPoints,
          tasks_completed: userStats.tasks_completed + 1,
          last_activity: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating user stats:", error);
    }
  };

  const getSuggestedTasks = async () => {
    setIsGettingSuggestions(true);
    console.log("Starting task suggestions for goal:", goal.title);
    console.log("Current suggestedTasks state:", suggestedTasks);
    
    try {
      const existingTasks = tasks.map(t => t.title).join(', ');
      console.log("About to call InvokeLLM with existing tasks:", existingTasks);
      
      const result = await InvokeLLM({
        prompt: `עבור היעד "${goal.title}" ${goal.description ? `(${goal.description})` : ''} ${existingTasks ? `שכבר יש לו את המשימות: [${existingTasks}]` : ''}, הצע 3-5 משימות נוספות שיעזרו להשיג את היעד. המשימות צריכות להיות קונקרטיות ומעשיות.

תמיד תענה בעברית בפורמט JSON בלבד:
{
  "suggested_tasks": ["משימה 1", "משימה 2", "משימה 3"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_tasks: { type: "array", items: { type: "string" } }
          }
        },
        model: 'gpt-4o'
      });

      console.log("LLM Response received:", result);
      console.log("Type of result:", typeof result);
      console.log("Keys in result:", Object.keys(result || {}));
      
      if (result && result.suggested_tasks) {
        console.log("Found suggested_tasks:", result.suggested_tasks);
        console.log("Type of suggested_tasks:", typeof result.suggested_tasks);
        console.log("Is array:", Array.isArray(result.suggested_tasks));
        setSuggestedTasks(result.suggested_tasks);
        console.log("State should be updated with:", result.suggested_tasks);
      } else {
        console.warn("No suggested_tasks in response:", result);
        // Try to extract tasks from different possible response formats
        if (result && result.response && typeof result.response === 'string') {
          try {
            const parsed = JSON.parse(result.response);
            if (parsed.suggested_tasks) {
              console.log("Found suggested_tasks in response string:", parsed.suggested_tasks);
              setSuggestedTasks(parsed.suggested_tasks);
            }
          } catch (e) {
            console.error("Failed to parse response string as JSON:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error getting task suggestions:", error);
      console.error("Error details:", error.message);
    } finally {
      setIsGettingSuggestions(false);
      console.log("Final suggestedTasks state:", suggestedTasks);
    }
  };

  const addSuggestedTask = async (taskTitle) => {
    console.log("Adding suggested task:", taskTitle);
    console.log("Goal ID:", goal.id);
    console.log("Goal details:", goal);
    
    try {
      const taskData = {
        title: taskTitle,
        goal_id: goal.id,
        status: "pending",
        priority: goal.priority || 'medium',
        difficulty: goal.difficulty || 5,
        estimated_time: 30,
        due_date: goal.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      console.log("Creating task with data:", taskData);
      
      const createdTask = await tasksAPI.create(taskData);
      console.log("Task created successfully:", createdTask);
      
      setSuggestedTasks(prev => {
        const updated = prev.filter(t => t !== taskTitle);
        console.log("Removing task from suggestions. Before:", prev, "After:", updated);
        return updated;
      });
      
      console.log("Calling onTaskUpdate to refresh task list");
      onTaskUpdate();
      
    } catch (error) {
      console.error("Error adding suggested task:", error);
      console.error("Error details:", error.message);
      alert("Error adding task: " + error.message);
    }
  };

  const handleCreateSubTask = async (subTaskTitle) => {
    try {
      await tasksAPI.create({
        title: subTaskTitle,
        goal_id: goal.id,
        status: "pending",
        priority: goal.priority || 'medium', // Added priority field based on goal's priority or default
        difficulty: goal.difficulty || 5,
        estimated_time: 20, // Default estimated time for subtasks
        due_date: goal.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      onTaskUpdate();
    } catch (error) {
      console.error("Error creating sub task:", error);
    }
  };

  const handleBulkDelete = async (taskIds) => {
    try {
      for (const taskId of taskIds) {
        await tasksAPI.delete(taskId);
      }
      onTaskUpdate(); // Reload tasks after bulk delete
    } catch (error) {
      console.error("Error deleting tasks:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowRight className="w-4 h-4 mr-2" />
          חזור ליעדים
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
          {goal.description && (
            <p className="text-gray-600 mt-1">{goal.description}</p>
          )}
        </div>
      </div>

      {/* Goal Info */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{completedTasks.length}</p>
              <p className="text-sm text-gray-600">משימות הושלמו</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{tasks.length}</p>
              <p className="text-sm text-gray-600">סה״כ משימות</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{progress}%</p>
              <p className="text-sm text-gray-600">התקדמות</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{goal.total_points || 0}</p>
              <p className="text-sm text-gray-600">נקודות נצברו</p>
            </div>
          </div>

          <div className="space-y-4">
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
              {goal.tags && goal.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>התקדמות כללית</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={getSuggestedTasks}
          disabled={isGettingSuggestions}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isGettingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          הצע משימות נוספות
        </Button>
        <Button
          onClick={() => setShowChat(!showChat)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          צ'אט עם AI
        </Button>
      </div>

      {/* AI Chat */}
      {showChat && (
        <AIChat 
          goal={goal}
          tasks={tasks}
          onClose={() => setShowChat(false)}
          onTaskCreate={(taskTitle) => addSuggestedTask(taskTitle)}
        />
      )}

      {/* Suggested Tasks */}
      {suggestedTasks.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              משימות מוצעות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex-1">{task}</span>
                  <Button
                    size="sm"
                    onClick={() => addSuggestedTask(task)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    הוסף
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Task */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>הוסף משימה חדשה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="כותרת המשימה..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || isAddingTask}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAddingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle>המשימות שלי ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <TaskList
              tasks={tasks}
              goals={[goal]}
              onStatusChange={handleStatusChange}
              isLoading={false}
              getTaskGoal={() => goal}
              onCreateSubTask={handleCreateSubTask}
              onBulkDelete={handleBulkDelete}
            />
          ) : (
            <div className="text-center py-8">
              <Circle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">אין משימות עדיין</p>
              <p className="text-sm text-gray-400">הוסף משימה ראשונה כדי להתחיל!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
