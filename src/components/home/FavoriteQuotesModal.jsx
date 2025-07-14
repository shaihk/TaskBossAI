import { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Star, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function FavoriteQuotesModal({ favoriteQuotes, isDarkMode, onDeleteQuote }) {
  const { t, i18n } = useTranslation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState(null);

  const cardBgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const authorColor = isDarkMode ? 'text-blue-400' : 'text-blue-600';

  const handleDeleteClick = (quote, index) => {
    setQuoteToDelete({ quote, index });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (quoteToDelete && onDeleteQuote) {
      onDeleteQuote(quoteToDelete.index);
    }
    setDeleteConfirmOpen(false);
    setQuoteToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setQuoteToDelete(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={`w-full justify-start text-left ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : ''}`}>
          <Star className="w-4 h-4 mr-2" />
          {t('home.favoriteQuotes')}
        </Button>
      </DialogTrigger>
      <DialogContent className={cardBgColor}>
        <DialogHeader>
          <DialogTitle className={textColor}>{t('home.favoriteQuotes')}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-96 overflow-y-auto">
          {favoriteQuotes.length > 0 ? (
            <ul className="space-y-4">
              {favoriteQuotes.map((q, index) => (
                <li key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} group relative transition-all duration-200 hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-3">
                    <blockquote className={`border-l-4 pl-4 flex-1 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}>
                      <p className={textColor}>
                        {i18n.language === 'he' ? q.hebrew_translation : q.quote}
                      </p>
                      {q.author && (
                        <footer className={`mt-2 text-sm font-medium ${authorColor}`}>
                          — {q.author}
                        </footer>
                      )}
                    </blockquote>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(q, index)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100 hover:text-red-600 ${isDarkMode ? 'hover:bg-red-900/30 hover:text-red-400' : ''} p-2 h-8 w-8`}
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={textColor}>{t('home.noFavoriteQuotes')}</p>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className={cardBgColor}>
            <AlertDialogHeader>
              <AlertDialogTitle className={`flex items-center gap-2 ${textColor}`}>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t('common.confirmDelete')}
              </AlertDialogTitle>
              <AlertDialogDescription className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('home.deleteQuoteConfirm')}
                {quoteToDelete && (
                  <div className={`mt-2 p-3 rounded border-l-4 ${isDarkMode ? 'bg-gray-600 border-blue-400' : 'bg-blue-50 border-blue-500'}`}>
                    <p className={`italic ${textColor}`}>
                      "{i18n.language === 'he' ? quoteToDelete.quote.hebrew_translation : quoteToDelete.quote.quote}"
                    </p>
                    {quoteToDelete.quote.author && (
                      <p className={`text-sm mt-1 ${authorColor}`}>
                        — {quoteToDelete.quote.author}
                      </p>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={handleCancelDelete}
                className={isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : ''}
              >
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

FavoriteQuotesModal.propTypes = {
  favoriteQuotes: PropTypes.array.isRequired,
  isDarkMode: PropTypes.bool,
  onDeleteQuote: PropTypes.func.isRequired
};
