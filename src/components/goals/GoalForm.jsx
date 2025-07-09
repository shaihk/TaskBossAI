import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Sparkles, Loader2 } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";

const priorities = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "urgent", label: "דחוף" }
];

const categories = [
  { value: "work", label: "עבודה" },
  { value: "personal", label: "אישי" },
  { value: "health", label: "בריאות" },
  { value: "learning", label: "למידה" },
  { value: "social", label: "חברתי" },
  { value: "creative", label: "יצירתי" }
];

export default function GoalForm({ goal, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: goal?.title || "",
    description: goal?.description || "",
    priority: goal?.priority || "medium",
    category: goal?.category || "personal",
    difficulty: goal?.difficulty || 5,
    estimated_time: goal?.estimated_time || 60,
    due_date: goal?.due_date || "",
    tags: goal?.tags || []
  });

  const [newTag, setNewTag] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [isGettingTags, setIsGettingTags] = useState(false);

  useEffect(() => {
    if (formData.title.length < 5) {
      setSuggestedTags([]);
      return;
    }

    const handler = setTimeout(() => {
      getAITags();
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [formData.title]);

  const getAITags = async () => {
    setIsGettingTags(true);
    try {
      const result = await InvokeLLM({
        prompt: `Generate 3 relevant tags in Hebrew for the goal: "${formData.title}". Respond with a JSON object containing a "tags" array.`,
        response_json_schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } }
          }
        }
      });
      if (result.tags) {
        setSuggestedTags(result.tags);
      }
    } catch (error) {
      console.error("Error getting AI tags:", error);
    } finally {
      setIsGettingTags(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (tagToAdd) => {
    if (tagToAdd.trim() && !formData.tags.includes(tagToAdd.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd.trim()]
      }));
      setSuggestedTags(prev => prev.filter(t => t !== tagToAdd));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{goal ? "עריכת יעד" : "יעד חדש"}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">כותרת היעד</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="מה תרצה להשיג?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="פרטים נוספים על היעד..."
              rows={3}
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>רמת קושי: {formData.difficulty}/10</Label>
              <Slider
                value={[formData.difficulty]}
                onValueChange={(value) => handleInputChange("difficulty", value[0])}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_time">זמן מוערך (דקות)</Label>
              <Input
                id="estimated_time"
                type="number"
                value={formData.estimated_time}
                onChange={(e) => handleInputChange("estimated_time", parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">תאריך יעד</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange("due_date", e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>תגיות</Label>
            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {isGettingTags && <Loader2 className="w-4 h-4 animate-spin" />}
              {suggestedTags.map(tag => (
                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-200" onClick={() => addTag(tag)}>
                  <Plus className="w-3 h-3 ml-1" /> {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="הוסף תגית..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
              />
              <Button type="button" variant="outline" onClick={() => addTag(newTag)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Save className="w-4 h-4 mr-2" />
              {goal ? "עדכון" : "יצירה"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}