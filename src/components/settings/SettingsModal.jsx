import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Key, CheckCircle, XCircle, AlertCircle, Settings, Loader2, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from "@/components/ui/switch";

export default function SettingsModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: ''
  });
  const [aiPreferences, setAiPreferences] = useState({
    chatModel: 'gemini-2.5-flash',
    quoteModel: 'gemini-2.5-flash',
    fallbackModel: 'gpt-4o-mini'
  });
  const [availableModels, setAvailableModels] = useState({
    openai: [],
    gemini: []
  });
  const [connectionStatus, setConnectionStatus] = useState({
    openai: 'unknown',
    gemini: 'unknown'
  });
  const [uiPreferences, setUiPreferences] = useState({
    taskWhiteBackground: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load AI preferences
      const prefResponse = await fetch('/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (prefResponse.ok) {
        const prefData = await prefResponse.json();
        setAiPreferences(prefData.aiModels);
      }

      // Load available models
      const modelsResponse = await fetch('/api/models/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (modelsResponse.ok) {
        const models = await modelsResponse.json();
        setAvailableModels(models);
      }

      // Load API keys status
      const keysResponse = await fetch('/api/settings/keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys({
          openai: keysData.openai ? '••••••••••••••••' : '',
          gemini: keysData.gemini ? '••••••••••••••••' : ''
        });
        setConnectionStatus(keysData.status);
      }
      
      // Load UI preferences from localStorage
      const taskWhiteBackground = localStorage.getItem('taskWhiteBackground') === 'true';
      setUiPreferences({
        taskWhiteBackground
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (provider) => {
    try {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'testing' }));
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/test/${provider}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: 'Test connection',
          apiKey: apiKeys[provider]
        })
      });
      
      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'connected' }));
      } else {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Save AI preferences
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ aiModels: aiPreferences })
      });

      // Save API keys if they were changed
      const keysToSave = {};
      if (apiKeys.openai && !apiKeys.openai.includes('••••')) {
        keysToSave.openai = apiKeys.openai;
      }
      if (apiKeys.gemini && !apiKeys.gemini.includes('••••')) {
        keysToSave.gemini = apiKeys.gemini;
      }

      if (Object.keys(keysToSave).length > 0) {
        await fetch('/api/settings/keys', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(keysToSave)
        });
      }

      // Update localStorage
      localStorage.setItem('aiModelPreferences', JSON.stringify(aiPreferences));
      localStorage.setItem('taskWhiteBackground', uiPreferences.taskWhiteBackground);
      
      // Force re-render of task components
      window.dispatchEvent(new Event('storage'));
      
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'מחובר';
      case 'failed':
        return 'שגיאה';
      case 'testing':
        return 'בודק...';
      default:
        return 'לא נבדק';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            הגדרות מערכת
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="mr-2">טוען הגדרות...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Keys Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  מפתחות API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <Label htmlFor="openai-key">מפתח OpenAI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('openai')}
                      disabled={!apiKeys.openai || connectionStatus.openai === 'testing'}
                    >
                      {getStatusIcon(connectionStatus.openai)}
                      <span className="mr-2">{getStatusText(connectionStatus.openai)}</span>
                    </Button>
                  </div>
                </div>

                {/* Gemini API Key */}
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">מפתח Gemini</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gemini-key"
                      type="password"
                      placeholder="AIza..."
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('gemini')}
                      disabled={!apiKeys.gemini || connectionStatus.gemini === 'testing'}
                    >
                      {getStatusIcon(connectionStatus.gemini)}
                      <span className="mr-2">{getStatusText(connectionStatus.gemini)}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* AI Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  בחירת מודלים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chat Model */}
                  <div className="space-y-3">
                    <Label>מודל לשיחות וייעוץ</Label>
                    <Select 
                      value={aiPreferences.chatModel} 
                      onValueChange={(value) => setAiPreferences(prev => ({...prev, chatModel: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מודל לשיחות" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500">
                          Google Gemini
                        </div>
                        {availableModels.gemini.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Gemini</Badge>
                              {model.name}
                            </div>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1 text-xs font-medium text-gray-500">
                          OpenAI
                        </div>
                        {availableModels.openai.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">OpenAI</Badge>
                              {model.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quote Model */}
                  <div className="space-y-3">
                    <Label>מודל לציטוטים</Label>
                    <Select 
                      value={aiPreferences.quoteModel} 
                      onValueChange={(value) => setAiPreferences(prev => ({...prev, quoteModel: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מודל לציטוטים" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500">
                          Google Gemini
                        </div>
                        {availableModels.gemini.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Gemini</Badge>
                              {model.name}
                            </div>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1 text-xs font-medium text-gray-500">
                          OpenAI
                        </div>
                        {availableModels.openai.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">OpenAI</Badge>
                              {model.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fallback Model */}
                <div className="space-y-3">
                  <Label>מודל גיבוי</Label>
                  <Select 
                    value={aiPreferences.fallbackModel} 
                    onValueChange={(value) => setAiPreferences(prev => ({...prev, fallbackModel: value}))}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="בחר מודל גיבוי" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-medium text-gray-500">
                        Google Gemini
                      </div>
                      {availableModels.gemini.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Gemini</Badge>
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-medium text-gray-500">
                        OpenAI
                      </div>
                      {availableModels.openai.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">OpenAI</Badge>
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Current Settings Display */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">הגדרות נוכחיות</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800">מודל שיחות:</span>
                      <Badge variant="secondary">{aiPreferences.chatModel}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">מודל ציטוטים:</span>
                      <Badge variant="secondary">{aiPreferences.quoteModel}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">מודל גיבוי:</span>
                      <Badge variant="secondary">{aiPreferences.fallbackModel}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* UI Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {t('settings.uiPreferences', 'העדפות ממשק')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="task-white-bg" className="text-base">
                      {t('settings.whiteTaskBackground', 'רקע לבן למשימות')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.whiteTaskBackgroundDesc', 'השתמש ברקע לבן למשימות במקום צבעי עדיפות')}
                    </p>
                  </div>
                  <Switch
                    id="task-white-bg"
                    checked={uiPreferences.taskWhiteBackground}
                    onCheckedChange={(checked) => 
                      setUiPreferences(prev => ({ ...prev, taskWhiteBackground: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    שומר...
                  </>
                ) : (
                  'שמור הגדרות'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}