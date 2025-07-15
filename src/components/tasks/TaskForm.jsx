
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Save, Sparkles, Loader2, BrainCircuit, Lightbulb } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { useTranslation } from "react-i18next";

const getPriorities = (t) => [
  { value: "low", label: t('form.priority.low'), color: "bg-green-100 text-green-800" },
  { value: "medium", label: t('form.priority.medium'), color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: t('form.priority.high'), color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: t('form.priority.urgent'), color: "bg-red-100 text-red-800" }
];

const getCategories = (t) => [
  { value: "work", label: t('form.category.work') },
  { value: "personal", label: t('form.category.personal') },
  { value: "health", label: t('form.category.health') },
  { value: "learning", label: t('form.category.learning') },
  { value: "social", label: t('form.category.social') },
  { value: "creative", label: t('form.category.creative') }
];

export default function TaskForm({ task, onSubmit, onCancel }) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    category: task?.category || "personal",
    difficulty: task?.difficulty || 5,
    estimated_time: task?.estimated_time || 30,
    due_date: task?.due_date || "",
    tags: task?.tags || [],
    subtasks: task?.subtasks || []
  });

  const [newTag, setNewTag] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isGettingAISuggestions, setIsGettingAISuggestions] = useState(false);
  
  // New state for advanced AI features
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [isGettingTags, setIsGettingTags] = useState(false);
  const [aiSuggestedSubtasks, setAiSuggestedSubtasks] = useState([]);
  const [selectedAiSubtasks, setSelectedAiSubtasks] = useState({});
  const [isRefiningSubtasks, setIsRefiningSubtasks] = useState(false);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [taskAdvice, setTaskAdvice] = useState(null);
  const [isAddingMoreSubtasks, setIsAddingMoreSubtasks] = useState(false);
  
  const priorities = getPriorities(t);
  const categories = getCategories(t);

  useEffect(() => {
    if (formData.title.length < 5) {
        setSuggestedTags([]);
        return;
    }

    const handler = setTimeout(() => {
        getAITags();
    }, 1500); // Debounce for 1.5 seconds

    return () => {
        clearTimeout(handler);
    };
  }, [formData.title]);

  const getAITags = async () => {
    setIsGettingTags(true);
    try {
      const currentLang = i18n.language;
      const languageMap = {
        'he': 'Hebrew',
        'ru': 'Russian',
        'en': 'English'
      };
      const responseLang = languageMap[currentLang] || 'English';
      
      const result = await InvokeLLM({
        prompt: `Generate 3 relevant tags for the task: "${formData.title}". 

IMPORTANT: You MUST respond ONLY in ${responseLang} language. All tags must be written in ${responseLang}.

Respond with a JSON object containing a "tags" array.`,
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

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, {
          title: newSubtask.trim(),
          completed: false,
          estimated_time: 15
        }]
      }));
      setNewSubtask("");
    }
  };

  const removeSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const getAISuggestions = async () => {
    if (!formData.title.trim()) return;
    
    setIsGettingAISuggestions(true);
    setAiSuggestedSubtasks([]);
    setSelectedAiSubtasks({});

    try {
      const currentLang = i18n.language;
      const languageMap = {
        'he': 'Hebrew',
        'ru': 'Russian',
        'en': 'English'
      };
      const responseLang = languageMap[currentLang] || 'English';
      const descriptionText = formData.description ? ` Description: ${formData.description}` : '';
      
      const result = await InvokeLLM({
        prompt: `I need help with the following task: "${formData.title}".${descriptionText}

Please provide me with:
1. Accurate time estimate (in minutes)
2. Difficulty level (1-10)
3. Suggestion to break down the task into smaller sub-tasks (maximum 5)

IMPORTANT: You MUST respond ONLY in ${responseLang} language. All content must be written in ${responseLang}.`,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_time: { type: "number" },
            difficulty: { type: "number" },
            subtasks: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (result.estimated_time) setFormData(prev => ({ ...prev, estimated_time: result.estimated_time }));
      if (result.difficulty) setFormData(prev => ({ ...prev, difficulty: Math.min(10, Math.max(1, result.difficulty)) }));
      if (result.subtasks) setAiSuggestedSubtasks(result.subtasks.map(title => ({ title, completed: false, estimated_time: Math.round(result.estimated_time / result.subtasks.length) || 5 })));
      
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    } finally {
      setIsGettingAISuggestions(false);
    }
  };

  const handleAddSelectedSubtasks = () => {
    const toAdd = aiSuggestedSubtasks.filter((_, index) => selectedAiSubtasks[index]);
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, ...toAdd]
    }));
    setAiSuggestedSubtasks([]);
    setSelectedAiSubtasks({});
  };
  
  const handleRefineSubtasks = async () => {
    if (formData.subtasks.length === 0) return;

    setIsRefiningSubtasks(true);
    try {
        const subtasksString = formData.subtasks.map(s => s.title).join(', ');
        
        const currentLang = i18n.language;
        const languageMap = {
          'he': 'Hebrew',
          'ru': 'Russian',
          'en': 'English'
        };
        const responseLang = languageMap[currentLang] || 'English';
        
        const prompt = `Based on the main task "${formData.title}" and current subtasks list [${subtasksString}], please break down the subtasks to a more detailed level, create a new and more accurate list of subtasks.

IMPORTANT: You MUST respond ONLY in ${responseLang} language. All subtasks must be written in ${responseLang}.`;
        
        const result = await InvokeLLM({
            prompt: prompt,
            response_json_schema: {
              type: "object",
              properties: {
                refined_subtasks: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
        });
        
        if (result.refined_subtasks && result.refined_subtasks.length > 0) {
            setFormData(prev => ({
                ...prev,
                subtasks: result.refined_subtasks.map(title => ({ title, completed: false, estimated_time: 10 }))
            }));
        }
    } catch(error) {
        console.error("Error refining subtasks:", error);
    } finally {
        setIsRefiningSubtasks(false);
    }
  };

  const getTaskAdvice = async () => {
    if (!formData.title.trim()) return;
    
    setIsGettingAdvice(true);
    try {
      const currentLang = i18n.language;
      const languageMap = {
        'he': 'Hebrew',
        'ru': 'Russian',
        'en': 'English'
      };
      const responseLang = languageMap[currentLang] || 'English';
      const description = formData.description ? ` Description: ${formData.description}` : '';
      
      const prompt = `I need practical advice on how to complete the task: "${formData.title}".${description}

Give me:
1. 3-5 practical and concrete tips on how to approach the task
2. A list of recommended actions that will help me succeed
3. Effective ways to deal with possible difficulties
4. Tips to stay focused and motivated

IMPORTANT: You MUST respond ONLY in ${responseLang} language. All advice must be written in ${responseLang}.
Be friendly and practical in your response.`;
      
      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            advice_tips: { type: "array", items: { type: "string" } },
            action_steps: { type: "array", items: { type: "string" } },
            challenges_solutions: { type: "array", items: { type: "string" } },
            motivation_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      setTaskAdvice(result);
    } catch (error) {
      console.error("Error getting task advice:", error);
    } finally {
      setIsGettingAdvice(false);
    }
  };

  const addMoreSubtaskIdeas = async () => {
    if (!formData.title.trim()) return;
    
    setIsAddingMoreSubtasks(true);
    try {
      const existingSubtasks = formData.subtasks.map(s => s.title).join(', ');
      const currentLang = i18n.language;
      const languageMap = {
        'he': 'Hebrew',
        'ru': 'Russian',
        'en': 'English'
      };
      const responseLang = languageMap[currentLang] || 'English';
      
      const prompt = `For the task "${formData.title}" I already have the following subtasks: [${existingSubtasks}]. 
      
Suggest 3-5 more subtask ideas that can help complete the task better. The ideas should be complementary and not repeat what's already there.

IMPORTANT: You MUST respond ONLY in ${responseLang} language. All subtasks must be written in ${responseLang}.`;
      
      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            additional_subtasks: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (result.additional_subtasks) {
        const newSuggestions = result.additional_subtasks.map(title => ({ 
          title, 
          completed: false, 
          estimated_time: Math.round(formData.estimated_time / (formData.subtasks.length + result.additional_subtasks.length)) || 10
        }));
        setAiSuggestedSubtasks(newSuggestions);
        setSelectedAiSubtasks({});
      }
    } catch (error) {
      console.error("Error getting more subtask ideas:", error);
    } finally {
      setIsAddingMoreSubtasks(false);
    }
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{task ? t('form.editTask') : t('form.taskTitle')}</span>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('form.taskTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="מה צריך לעשות?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="פרטים נוספים על המשימה..."
              rows={3}
            />
          </div>

          {/* AI Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={getAISuggestions}
              disabled={!formData.title.trim() || isGettingAISuggestions}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGettingAISuggestions ? "מקבל הצעות..." : t('form.aiSuggestions')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={getTaskAdvice}
              disabled={!formData.title.trim() || isGettingAdvice}
              className="flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {isGettingAdvice ? "מכין עצות..." : t('form.adviseMe')}
            </Button>
          </div>

          {/* Task Advice Display */}
          {taskAdvice && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  {t('tasks.taskCompletionAdvice')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {taskAdvice.advice_tips && taskAdvice.advice_tips.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">{t('tasks.practicalAdvice')}</h4>
                    <ul className="space-y-1">
                      {taskAdvice.advice_tips.map((tip, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {taskAdvice.action_steps && taskAdvice.action_steps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">{t('tasks.recommendedActions')}</h4>
                    <ul className="space-y-1">
                      {taskAdvice.action_steps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 font-bold">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {taskAdvice.challenges_solutions && taskAdvice.challenges_solutions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">פתרונות לקשיים:</h4>
                    <ul className="space-y-1">
                      {taskAdvice.challenges_solutions.map((solution, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-600 font-bold">⚡</span>
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Suggested Subtasks */}
          {aiSuggestedSubtasks.length > 0 && (
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium">הצעות למשימות משנה:</h4>
              <div className="space-y-2">
                {aiSuggestedSubtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox
                      id={`aisubtask-${index}`}
                      onCheckedChange={(checked) => {
                        setSelectedAiSubtasks(prev => ({...prev, [index]: checked}));
                      }}
                    />
                    <Label htmlFor={`aisubtask-${index}`} className="flex-1">{subtask.title}</Label>
                  </div>
                ))}
              </div>
              <Button type="button" size="sm" onClick={handleAddSelectedSubtasks}>
                הוסף משימות נבחרות
              </Button>
            </div>
          )}

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

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>משימות משנה</Label>
                <div className="flex gap-2">
                    {formData.subtasks.length > 0 && (
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm" 
                          onClick={handleRefineSubtasks}
                          disabled={isRefiningSubtasks}
                          className="flex items-center gap-1 text-xs"
                        >
                          <BrainCircuit className="w-3 h-3" />
                          {isRefiningSubtasks ? "מעבד..." : "דייק עם AI"}
                        </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="outline"
                      size="sm" 
                      onClick={addMoreSubtaskIdeas}
                      disabled={isAddingMoreSubtasks || !formData.title.trim()}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {isAddingMoreSubtasks ? "מחפש רעיונות..." : "הוסף רעיונות"}
                    </Button>
                </div>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="הוסף משימת משנה..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <Button type="button" variant="outline" onClick={addSubtask}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {isRefiningSubtasks && <div className="text-center text-sm text-gray-500">מפרט משימות...</div>}
              {formData.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1">{subtask.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
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
              {task ? "עדכון" : "יצירה"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
