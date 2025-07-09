import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { RotateCcw, Loader2 } from 'lucide-react';

export default function ResetProgressButton({ onReset }) {
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
    } catch (error) {
      console.error("Failed to reset progress:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <RotateCcw className="w-4 h-4 ml-2" />
          איפוס התקדמות
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תאפס את כל הנקודות, הרמות, ההישגים והרצפים שלך. 
            לא ניתן לשחזר את הנתונים לאחר האיפוס. המשימות שלך לא יימחקו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmReset}
            disabled={isResetting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isResetting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isResetting ? "מאפס..." : "אפס התקדמות"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}