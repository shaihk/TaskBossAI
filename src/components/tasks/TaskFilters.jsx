import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";

export default function TaskFilters({ filters, onFiltersChange, goals }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all");

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">מסננים:</span>
      </div>
      
      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הסטטוסים</SelectItem>
          <SelectItem value="pending">ממתינות</SelectItem>
          <SelectItem value="in_progress">בביצוע</SelectItem>
          <SelectItem value="completed">הושלמו</SelectItem>
          <SelectItem value="paused">מושהות</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.goal} onValueChange={(value) => handleFilterChange("goal", value)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל היעדים</SelectItem>
          {goals.map(goal => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Badge variant="secondary" className="text-xs">
          {Object.values(filters).filter(value => value !== "all").length} מסננים פעילים
        </Badge>
      )}
    </div>
  );
}