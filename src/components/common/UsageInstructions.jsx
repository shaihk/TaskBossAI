import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HelpCircle, 
  Target, 
  Plus, 
  CheckCircle2, 
  BrainCircuit, 
  MessageCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Clock,
  Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function UsageInstructions({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();

  const steps = [
    {
      icon: Target,
      title: t('usage.step1.title'),
      description: t('usage.step1.description'),
      details: t('usage.step1.details', { returnObjects: true }),
      color: 'bg-blue-500'
    },
    {
      icon: Plus,
      title: t('usage.step2.title'),
      description: t('usage.step2.description'),
      details: t('usage.step2.details', { returnObjects: true }),
      color: 'bg-green-500'
    },
    {
      icon: BrainCircuit,
      title: t('usage.step3.title'),
      description: t('usage.step3.description'),
      details: t('usage.step3.details', { returnObjects: true }),
      color: 'bg-purple-500'
    },
    {
      icon: CheckCircle2,
      title: t('usage.step4.title'),
      description: t('usage.step4.description'),
      details: t('usage.step4.details', { returnObjects: true }),
      color: 'bg-emerald-500'
    },
    {
      icon: Trophy,
      title: t('usage.step5.title'),
      description: t('usage.step5.description'),
      details: t('usage.step5.details', { returnObjects: true }),
      color: 'bg-yellow-500'
    }
  ];

  const tipsSections = [
    {
      title: t('usage.tips.planning.title'),
      items: t('usage.tips.planning.items', { returnObjects: true })
    },
    {
      title: t('usage.tips.ai.title'),
      items: t('usage.tips.ai.items', { returnObjects: true })
    },
    {
      title: t('usage.tips.progress.title'),
      items: t('usage.tips.progress.items', { returnObjects: true })
    },
    {
      title: t('usage.tips.motivation.title'),
      items: t('usage.tips.motivation.items', { returnObjects: true })
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-600 text-gray-200' 
          : 'bg-white border-gray-300 text-gray-900'
      }`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            {t('usage.subtitle')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Introduction */}
          <Card className={`${
            isDarkMode 
              ? 'bg-gray-900 border-gray-600' 
              : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{t('usage.whatIsTitle')}</h3>
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('usage.appDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step by step guide */}
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={index} className={`${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-600' 
                  : 'bg-white border-gray-200'
              } hover:shadow-lg transition-shadow`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 ${step.color} rounded-lg text-white`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {i18n.language === 'he' ? `שלב ${index + 1}` : `Step ${index + 1}`}
                      </span>
                      <h4 className="text-lg font-semibold mt-1">{step.title}</h4>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className={`mb-4 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details && step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <ArrowRight className={`w-4 h-4 mt-0.5 ${step.color.replace('bg-', 'text-')} flex-shrink-0`} />
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips section */}
          <Card className={`${
            isDarkMode 
              ? 'bg-gray-900 border-gray-600' 
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white">
                  <Star className="w-5 h-5" />
                </div>
                {t('usage.successTips')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {tipsSections.map((section, index) => (
                  <div key={index}>
                    <h5 className="font-semibold mb-2">{section.title}</h5>
                    <ul className={`space-y-1 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {section.items && section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Close button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2"
            >
              {t('usage.getStartedButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}