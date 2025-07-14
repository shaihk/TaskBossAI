
import React, { useState, useEffect } from "react";
import { tasksAPI, goalsAPI } from "@/services/api";
import { UserStats } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

import TaskList from "../components/tasks/TaskList";
import TaskFilters from "../components/tasks/TaskFilters";

const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    goal: "all"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('-created_date');
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, searchTerm, filters, sortOrder]);

  const loadData = async () => {
    try {
      const [tasksData, goalsData] = await Promise.all([
        tasksAPI.getAll(),
        goalsAPI.getAll()
      ]);
      setTasks(tasksData);
      setGoals(goalsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let processedTasks = [...tasks];

    // Filtering
    if (searchTerm) {
      processedTasks = processedTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.status !== "all") {
      processedTasks = processedTasks.filter(task => task.status === filters.status);
    }
    if (filters.goal !== "all") {
      processedTasks = processedTasks.filter(task => task.goal_id === filters.goal);
    }

    // Sorting
    processedTasks.sort((a, b) => {
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
          case 'due_date_asc':
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1; // null/undefined due_date comes after
            if (!b.due_date) return -1; // null/undefined due_date comes after
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          case '-created_date':
          default:
            return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
        }
    });

    setFilteredTasks(processedTasks);
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
        const points = calculatePoints(task);
        updateData.points_earned = points;

        // Update user stats
        const userStats = await userStatsAPI.get();
        if (userStats) {
          const newPoints = userStats.total_points + points;
          const newLevel = Math.floor(newPoints / 1000) + 1;
          
          await userStatsAPI.update(userStats.id, {
            total_points: newPoints,
            current_level: newLevel,
            experience_points: newPoints,
            tasks_completed: userStats.tasks_completed + 1,
            last_activity: new Date().toISOString()
          });
        }
      }
      
      await tasksAPI.update(task.id, updateData);
      loadData();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleCreateSubTask = async (subTaskTitle, parentTask = null) => {
    try {
      const goalId = parentTask?.goal_id;
      const goal = goals.find(g => g.id === goalId);
      
      await tasksAPI.create({
        title: subTaskTitle,
        goal_id: goalId,
        status: "pending",
        difficulty: parentTask?.difficulty || goal?.difficulty || 5,
        estimated_time: Math.round((parentTask?.estimated_time || 30) / 3),
        due_date: parentTask?.due_date || goal?.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      loadData();
    } catch (error) {
      console.error("Error creating sub task:", error);
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
    
    // Use task.priority to get the correct bonus, default to medium if not set
    return basePoints + (priorityBonus[task.priority] || priorityBonus.medium || 0);
  };

  const handleBulkDelete = async (taskIds) => {
    try {
      for (const taskId of taskIds) {
        await tasksAPI.delete(taskId);
      }
      loadData(); // Reload data after bulk delete
    } catch (error) {
      console.error("Error deleting tasks:", error);
    }
  };

  const getTaskGoal = (task) => {
    return goals.find(goal => goal.id === task.goal_id);
  };

  const pendingTasks = filteredTasks.filter(task => task.status === "pending");
  const inProgressTasks = filteredTasks.filter(task => task.status === "in_progress");
  const completedTasks = filteredTasks.filter(task => task.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('tasks.title')}
          </h1>
          <p className="text-gray-600">{t('tasks.description')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('tasks.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <TaskFilters 
              filters={filters} 
              onFiltersChange={setFilters}
              goals={goals}
            />
        </div>
        <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort-tasks" className="w-[200px]">
                <SelectValue placeholder={t('tasks.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">{t('tasks.recentlyAdded')}</SelectItem>
                <SelectItem value="priority_desc">{t('tasks.priorityHighToLow')}</SelectItem>
                <SelectItem value="priority_asc">{t('tasks.priorityLowToHigh')}</SelectItem>
                <SelectItem value="difficulty_desc">{t('tasks.difficultyHighToLow')}</SelectItem>
                <SelectItem value="difficulty_asc">{t('tasks.difficultyLowToHigh')}</SelectItem>
                <SelectItem value="time_desc">{t('tasks.timeLongToShort')}</SelectItem>
                <SelectItem value="time_asc">{t('tasks.timeShortToLong')}</SelectItem>
                <SelectItem value="due_date_asc">{t('tasks.dueDateClosest')}</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* Task Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">{t('tasks.allTasks', { count: filteredTasks.length })}</TabsTrigger>
          <TabsTrigger value="pending">{t('tasks.pendingTasks', { count: pendingTasks.length })}</TabsTrigger>
          <TabsTrigger value="in_progress">{t('tasks.inProgressTasks', { count: inProgressTasks.length })}</TabsTrigger>
          <TabsTrigger value="completed">{t('tasks.completedTasks', { count: completedTasks.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TaskList
            tasks={filteredTasks}
            goals={goals}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
            getTaskGoal={getTaskGoal}
            onCreateSubTask={(title) => handleCreateSubTask(title, filteredTasks[0])}
            onBulkDelete={handleBulkDelete}
            onTaskUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <TaskList
            tasks={pendingTasks}
            goals={goals}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
            getTaskGoal={getTaskGoal}
            onCreateSubTask={(title) => handleCreateSubTask(title, pendingTasks[0])}
            onBulkDelete={handleBulkDelete}
            onTaskUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <TaskList
            tasks={inProgressTasks}
            goals={goals}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
            getTaskGoal={getTaskGoal}
            onCreateSubTask={(title) => handleCreateSubTask(title, inProgressTasks[0])}
            onBulkDelete={handleBulkDelete}
            onTaskUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <TaskList
            tasks={completedTasks}
            goals={goals}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
            getTaskGoal={getTaskGoal}
            onCreateSubTask={(title) => handleCreateSubTask(title, completedTasks[0])}
            onBulkDelete={handleBulkDelete}
            onTaskUpdate={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
