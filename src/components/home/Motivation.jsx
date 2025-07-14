import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Star, Loader2, Check, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvokeLLM } from "@/api/integrations";

export default function Motivation({ onQuoteFavorited, isDarkMode, favoriteQuotes }) {
  const { t, i18n } = useTranslation();
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isFavorited = quote && favoriteQuotes.some(q => q.quote === quote.quote);

  const fetchQuote = async () => {
    setIsLoading(true);
    setError(null);
    setIsAnimating(true);
    
    try {
      const result = await InvokeLLM({
        prompt: `Generate an inspiring and motivational quote. The quote should be:
        - Inspirational and uplifting
        - From a famous person or original
        - Professional yet motivating
        - Suitable for a productivity app
        - Include both English and Hebrew translation
        
        Please provide the author if known.`,
        useCase: 'quote',
        response_json_schema: {
          type: "object",
          properties: {
            quote: { type: "string" },
            author: { type: "string" },
            hebrew_translation: { type: "string" }
          },
          required: ["quote", "hebrew_translation"]
        }
      });
      
      setQuote(result);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      console.error("Error fetching motivational quote:", error);
      setError("Failed to generate new quote. Using fallback.");
      
      // Enhanced fallback quotes array
      const fallbackQuotes = [
        {
          quote: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          hebrew_translation: "הדרך היחידה לעשות עבודה נהדרת היא לאהוב את מה שאתה עושה."
        },
        {
          quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill",
          hebrew_translation: "הצלחה אינה סופית, כישלון אינו קטלני: האומץ להמשיך הוא מה שחשוב."
        },
        {
          quote: "The future belongs to those who believe in the beauty of their dreams.",
          author: "Eleanor Roosevelt",
          hebrew_translation: "העתיד שייך לאלה שמאמינים ביופי החלומות שלהם."
        }
      ];
      
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(randomQuote);
      
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const handleFavorite = () => {
    if (quote && !isFavorited) {
      onQuoteFavorited(quote);
    }
  };

  const cardBgColor = isDarkMode 
    ? 'bg-gradient-to-br from-gray-800 via-purple-900 to-blue-900' 
    : 'bg-gradient-to-br from-yellow-50 via-purple-50 to-pink-50';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const authorColor = isDarkMode ? 'text-yellow-400' : 'text-purple-600';

  return (
    <Card className={`w-full shadow-2xl rounded-3xl h-full flex flex-col ${cardBgColor} border-2 ${isDarkMode ? 'border-purple-500/30' : 'border-purple-200/50'} relative overflow-hidden transition-all duration-300 hover:shadow-purple-300/25 hover:shadow-3xl`}>
      {/* Animated background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-4 -right-4 w-8 h-8 ${showSuccess ? 'animate-bounce' : 'animate-pulse'} text-yellow-400 opacity-70`}>
          <Sparkles className="w-full h-full" />
        </div>
        <div className={`absolute top-1/3 -left-2 w-6 h-6 ${isAnimating ? 'animate-spin' : 'animate-pulse'} text-purple-400 opacity-50`}>
          <Sparkles className="w-full h-full" />
        </div>
        <div className={`absolute bottom-4 right-1/3 w-4 h-4 ${showSuccess ? 'animate-ping' : 'animate-pulse'} text-pink-400 opacity-60`}>
          <Sparkles className="w-full h-full" />
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-grow relative z-10">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'} ${showSuccess ? 'animate-pulse' : ''}`} />
          <h3 className={`text-xl font-bold ${textColor} ${showSuccess ? 'animate-pulse' : ''}`}>
            {t('home.motivationQuote')}
          </h3>
          <Sparkles className={`w-6 h-6 ml-2 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'} ${showSuccess ? 'animate-pulse' : ''}`} />
        </div>

        {error && (
          <div className="mb-4 p-2 rounded-lg bg-orange-100 border border-orange-300 flex items-center text-orange-700 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <div className={`flex-grow flex items-center justify-center transition-all duration-500 ${isAnimating ? 'scale-95 opacity-75' : 'scale-100 opacity-100'}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-24 space-y-3">
              <div className="relative">
                <Loader2 className={`w-12 h-12 animate-spin ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                <div className="absolute inset-0 w-12 h-12 animate-ping border-2 border-purple-400 rounded-full opacity-30"></div>
              </div>
              <p className={`text-sm ${textColor} opacity-75 animate-pulse`}>
                {t('home.generatingQuote')}
              </p>
            </div>
          ) : quote && (
            <blockquote className={`text-center transition-all duration-700 ${showSuccess ? 'scale-105' : 'scale-100'}`}>
              <div className="relative">
                <p className={`text-2xl lg:text-3xl font-bold italic ${textColor} leading-relaxed mb-4 ${showSuccess ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}>
                  "{i18n.language === 'he' ? quote.hebrew_translation : quote.quote}"
                </p>
                {showSuccess && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg animate-pulse"></div>
                  </div>
                )}
              </div>
              {quote.author && (
                <footer className={`text-lg font-semibold ${authorColor} ${showSuccess ? 'animate-bounce' : ''}`}>
                  — {quote.author}
                </footer>
              )}
            </blockquote>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleFavorite} 
            disabled={isFavorited}
            className={`${textColor} disabled:opacity-50 transition-all duration-300 hover:scale-105 ${isFavorited ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-purple-100'}`}
          >
            {isFavorited ? (
              <>
                <Check className="w-5 h-5 mr-2 text-green-500 animate-pulse" />
                <span className="text-green-600 font-semibold">{t('home.saved')}</span>
              </>
            ) : (
              <>
                <Star className={`w-5 h-5 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'} hover:fill-current transition-all duration-200`} />
                {t('home.saveQuote')}
              </>
            )}
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={fetchQuote} 
            disabled={isLoading}
            className={`${isDarkMode 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            } transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-4 py-2`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('home.generating')}
              </>
            ) : (
              <>
                <RefreshCw className={`w-4 h-4 mr-2 ${showSuccess ? 'animate-spin' : ''}`} />
                {t('home.newQuote')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

Motivation.propTypes = {
  onQuoteFavorited: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
  favoriteQuotes: PropTypes.array.isRequired,
};
