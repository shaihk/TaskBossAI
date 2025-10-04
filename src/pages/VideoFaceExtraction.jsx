import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { 
  Upload, 
  Video, 
  Users, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  X
} from "lucide-react";

export default function VideoFaceExtraction() {
  const [videoFile, setVideoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFaces, setExtractedFaces] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const [frameRate, setFrameRate] = useState(1);
  const [maxFaces, setMaxFaces] = useState(50);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file size must be less than 100MB');
        return;
      }
      
      setVideoFile(file);
      setError('');
      setSuccess('');
      setExtractedFaces([]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setExtractedFaces([]);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExtractFaces = async () => {
    if (!videoFile) {
      setError('Please select a video file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('frameRate', frameRate);
      formData.append('maxFaces', maxFaces);
      formData.append('similarityThreshold', 0.6);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/video/extract-faces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract faces');
      }

      const data = await response.json();
      setExtractedFaces(data.faces);
      setSuccess(`Successfully extracted ${data.facesCount} unique face${data.facesCount !== 1 ? 's' : ''} from the video!`);

    } catch (err) {
      console.error('Error extracting faces:', err);
      setError(err.message || 'Failed to extract faces from video');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadFace = (face, index) => {
    const link = document.createElement('a');
    link.href = face.data;
    link.download = `face_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    extractedFaces.forEach((face, index) => {
      setTimeout(() => {
        handleDownloadFace(face, index);
      }, index * 100);
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-6 h-6" />
              {t('videoFaceExtraction.title', 'Video Face Extraction')}
            </CardTitle>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('videoFaceExtraction.description', 'Upload a video file and extract unique face photos for each person detected in the video')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Upload Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t('videoFaceExtraction.selectVideo', 'Select Video File')}
              </Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  disabled={isProcessing}
                  className={`flex-1 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {videoFile ? t('videoFaceExtraction.changeVideo', 'Change Video') : t('videoFaceExtraction.selectVideo', 'Select Video')}
                </Button>
                
                {videoFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveVideo}
                    disabled={isProcessing}
                    className={`${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-red-400 hover:bg-gray-600' 
                        : 'bg-white border-gray-300 text-red-600 hover:bg-gray-50'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {videoFile && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className="text-sm font-medium">{videoFile.name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* Settings Section */}
            {videoFile && !isProcessing && extractedFaces.length === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    {t('videoFaceExtraction.frameRate', 'Frame Rate')} ({frameRate} {t('videoFaceExtraction.framesPerSecond', 'frames/second')})
                  </Label>
                  <Slider
                    value={[frameRate]}
                    onValueChange={(value) => setFrameRate(value[0])}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('videoFaceExtraction.frameRateHelp', 'Higher frame rate = more accurate but slower processing')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    {t('videoFaceExtraction.maxFaces', 'Maximum Faces')} ({maxFaces})
                  </Label>
                  <Slider
                    value={[maxFaces]}
                    onValueChange={(value) => setMaxFaces(value[0])}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('videoFaceExtraction.maxFacesHelp', 'Maximum number of unique faces to extract')}
                  </p>
                </div>
              </div>
            )}

            {/* Extract Button */}
            {videoFile && !isProcessing && extractedFaces.length === 0 && (
              <Button
                onClick={handleExtractFaces}
                disabled={isProcessing}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('videoFaceExtraction.extractFaces', 'Extract Faces')}
              </Button>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('videoFaceExtraction.processing', 'Processing video...')}
                  </Label>
                  <span className="text-sm">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className={isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className={isDarkMode ? 'text-green-400' : 'text-green-800'}>
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Extracted Faces */}
            {extractedFaces.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('videoFaceExtraction.extractedFaces', 'Extracted Faces')} ({extractedFaces.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('videoFaceExtraction.downloadAll', 'Download All')}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {extractedFaces.map((face, index) => (
                    <Card 
                      key={index}
                      className={`overflow-hidden ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                    >
                      <img
                        src={face.data}
                        alt={`Face ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {t('videoFaceExtraction.face', 'Face')} {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFace(face, index)}
                            className="h-6 w-6 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                        {face.confidence && (
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {(face.confidence * 100).toFixed(0)}% {t('videoFaceExtraction.confidence', 'confidence')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleRemoveVideo}
                  className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                >
                  {t('videoFaceExtraction.processAnother', 'Process Another Video')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
