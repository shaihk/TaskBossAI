import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, X, User, Camera, Lock, Eye, EyeOff, Upload } from 'lucide-react';
import { usersAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function EditProfileModal({ user, isOpen, onClose, onUserUpdate }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    picture: user?.picture || ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.picture || '');
  const fileInputRef = useRef(null);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Reset form when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        picture: user.picture || ''
      });
      setPreviewUrl(user.picture || '');
      setImageFile(null);
      setError('');
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user starts typing
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setError('');
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
        setFormData(prev => ({ ...prev, picture: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, picture: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Basic validation
      if (!formData.full_name.trim()) {
        setError('השם המלא הוא שדה חובה');
        setIsSubmitting(false);
        return;
      }

      // Password validation if password section is shown
      if (showPasswordSection) {
        if (!passwordData.newPassword) {
          setError('הסיסמה החדשה היא שדה חובה');
          setIsSubmitting(false);
          return;
        }

        if (passwordData.newPassword.length < 6) {
          setError('הסיסמה חייבת להכיל לפחות 6 תווים');
          setIsSubmitting(false);
          return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError('הסיסמאות אינן תואמות');
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare update data
      const updateData = { ...formData };
      if (showPasswordSection && passwordData.newPassword) {
        updateData.password = passwordData.newPassword;
      }

      // Update user profile
      const updatedUser = await usersAPI.update(updateData);
      
      // Call parent component callback to update user data
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      full_name: user?.full_name || '',
      picture: user?.picture || ''
    });
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordSection(false);
    setError('');
    setImageFile(null);
    setPreviewUrl(user?.picture || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-600 text-gray-200' 
          : 'bg-white border-gray-300 text-gray-900'
      }`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('profile.editProfile')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className={`w-24 h-24 border-4 shadow-md ${
                isDarkMode ? 'border-gray-600' : 'border-white'
              }`}>
                <AvatarImage src={previewUrl} alt={formData.full_name} />
                <AvatarFallback className={`text-2xl ${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                }`}>
                  {formData.full_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera overlay button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={handleUploadClick}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Image Upload Options */}
            <div className="w-full space-y-3">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                תמונת פרופיל
              </Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  className={`flex-1 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  בחר תמונה
                </Button>
                
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className={`${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-red-400 hover:bg-gray-700' 
                        : 'bg-white border-gray-300 text-red-600 hover:bg-gray-50'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* URL Input as fallback */}
              <div className="space-y-2">
                <Label htmlFor="picture_url" className="text-sm text-gray-500">
                  או הזן URL של תמונה
                </Label>
                <Input
                  id="picture_url"
                  type="url"
                  value={formData.picture.startsWith('data:') ? '' : formData.picture}
                  onChange={(e) => {
                    const url = e.target.value;
                    setFormData(prev => ({ ...prev, picture: url }));
                    setPreviewUrl(url);
                    setImageFile(null);
                  }}
                  placeholder="https://example.com/profile-picture.jpg"
                  className={isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : ''}
                />
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              שם מלא *
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="הכנס את השם המלא שלך"
              required
              className={isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-200' : ''}
            />
          </div>

          {/* Password Reset Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                שינוי סיסמה
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? 'בטל' : 'איפוס סיסמה'}
              </Button>
            </div>

            {showPasswordSection && (
              <div className={`space-y-4 p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">סיסמה חדשה *</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="הכנס סיסמה חדשה (לפחות 6 תווים)"
                      required={showPasswordSection}
                      className={isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-200' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">אישור סיסמה *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="הכנס שוב את הסיסמה החדשה"
                      required={showPasswordSection}
                      className={isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-200' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}