
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, CheckSquare, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import TaskItem from "./TaskItem";

export default function TaskList({ tasks, goals, onStatusChange, isLoading, getTaskGoal, onCreateSubTask, onBulkDelete, onTaskUpdate }) {
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleSelectTask = (taskId, isSelected) => {
    const newSelected = new Set(selectedTasks);
    if (isSelected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const allTaskIds = new Set(tasks.map(task => task.id));
    setSelectedTasks(allTaskIds);
    setShowBulkActions(true);
  };

  const handleClearAll = () => {
    setSelectedTasks(new Set());
    setShowBulkActions(false);
  };

  const handleBulkComplete = async () => {
    for (const taskId of selectedTasks) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== "completed") {
        await onStatusChange(task, "completed");
      }
    }
    handleClearAll();
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete) {
      const tasksToDelete = Array.from(selectedTasks);
      await onBulkDelete(tasksToDelete);
      handleClearAll();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i} className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין משימות</h3>
          <p className="text-gray-500">עבור לעמוד היעדים כדי ליצור יעד חדש ולהוסיף משימות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      {tasks.length > 0 && (
        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  id="select-all"
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAll();
                    } else {
                      handleClearAll();
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedTasks.size === tasks.length}
                  >
                    בחר הכל
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedTasks.size === 0}
                  >
                    נקה הכל
                  </Button>
                </div>
                {selectedTasks.size > 0 && (
                  <Badge variant="secondary">
                    {selectedTasks.size} נבחרו
                  </Badge>
                )}
              </div>

              {/* Bulk Action Buttons */}
              {showBulkActions && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkComplete}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    סמן כהושלמו
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        מחק נבחרים
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק {selectedTasks.size} משימות שנבחרו לצמיתות. 
                          לא ניתן לשחזר את הנתונים לאחר המחיקה.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          מחק משימות
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearAll}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3">
            <div className="pt-6">
              <Checkbox
                checked={selectedTasks.has(task.id)}
                onCheckedChange={(checked) => handleSelectTask(task.id, checked)}
              />
            </div>
            <div className="flex-1">
              <TaskItem
                task={task}
                goal={getTaskGoal(task)}
                onStatusChange={onStatusChange}
                showGoalInfo={true}
                onCreateSubTask={onCreateSubTask}
                onTaskUpdate={onTaskUpdate}
                isSelected={selectedTasks.has(task.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
