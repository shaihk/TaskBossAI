# Video Face Extraction Feature

## Overview

The Video Face Extraction feature allows users to upload a video file and automatically extract unique face photos for each person detected in the video. This is useful for:
- Identifying people in videos
- Creating face galleries from video content
- Analyzing video content for unique individuals

## Features

- Upload video files up to 100MB
- Automatic face detection using AI
- Extract only unique faces (no duplicates)
- Configurable settings:
  - Frame rate (0.5 - 5 frames per second)
  - Maximum number of faces (5 - 100)
- Real-time processing progress
- View extracted faces with confidence scores
- Download individual faces or all at once

## Setup

### Prerequisites

The feature requires the following to be installed:

1. **FFmpeg**: The system uses `ffmpeg-static` which is included in dependencies
2. **Face Detection Models**: Downloaded automatically on first run

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Download face detection models (automatic on first use):
```bash
cd server
node downloadModels.js
```

The models will be downloaded to `server/models/` directory.

### Dependencies Added

- `fluent-ffmpeg`: Video processing
- `ffmpeg-static`: FFmpeg binary
- `face-api.js`: Face detection and recognition
- `canvas`: Node canvas for image processing
- `multer`: File upload handling

## Usage

### From the UI

1. Log in to TaskBoss-AI
2. Click on "Video Face Extraction" in the navigation menu
3. Click "Select Video File" and choose a video
4. Adjust settings if needed:
   - **Frame Rate**: Higher = more accurate but slower
   - **Max Faces**: Maximum number of unique faces to extract
5. Click "Extract Faces" to start processing
6. Wait for processing to complete
7. View extracted faces in a grid
8. Download faces individually or all at once

### API Endpoint

The feature exposes a REST API endpoint:

**POST** `/api/video/extract-faces`

Headers:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

Body (form data):
- `video`: Video file (required)
- `frameRate`: Number (optional, default: 1)
- `maxFaces`: Number (optional, default: 50)
- `similarityThreshold`: Number (optional, default: 0.6)

Response:
```json
{
  "success": true,
  "facesCount": 5,
  "faces": [
    {
      "data": "data:image/png;base64,...",
      "index": 0,
      "confidence": 0.98
    }
  ]
}
```

## How It Works

1. **Video Upload**: User uploads a video file via the web interface
2. **Frame Extraction**: FFmpeg extracts frames at the specified rate
3. **Face Detection**: Each frame is analyzed using face-api.js
4. **Similarity Check**: Faces are compared to avoid duplicates
5. **Face Extraction**: Unique faces are extracted and saved
6. **Response**: Face images are returned as base64-encoded data

## Configuration

### Adjustable Parameters

- **Frame Rate**: Controls how many frames per second to analyze
  - Lower values (0.5-1): Faster processing, may miss some faces
  - Higher values (2-5): More thorough, slower processing

- **Max Faces**: Limits the number of unique faces to extract
  - Prevents excessive processing time on videos with many people

- **Similarity Threshold**: Controls how similar faces must be to be considered the same person
  - Default: 0.6 (60% similarity)
  - Lower values: More strict, may create duplicates
  - Higher values: More lenient, may miss some unique faces

## Performance Considerations

- Processing time depends on:
  - Video length
  - Video resolution
  - Frame rate setting
  - Number of people in the video
  - Server resources

- Typical processing times:
  - 30-second video at 1 fps: ~30-60 seconds
  - 2-minute video at 1 fps: ~2-4 minutes

## Limitations

- Maximum video file size: 100MB
- Supported video formats: Any format supported by FFmpeg (MP4, AVI, MOV, etc.)
- Face detection accuracy depends on:
  - Face size in video
  - Lighting conditions
  - Face angle and orientation
  - Video quality

## Troubleshooting

### Models Not Loading

If you see errors about missing models:
```bash
cd server
node downloadModels.js
```

### FFmpeg Not Found

The `ffmpeg-static` package should provide FFmpeg automatically. If you encounter issues:
- Ensure `ffmpeg-static` is installed
- Check that the path is correctly configured in `videoFaceExtraction.js`

### Memory Issues

For very long videos or high frame rates:
- Reduce the frame rate
- Reduce the max faces limit
- Process shorter video segments

### Slow Processing

To speed up processing:
- Lower the frame rate (e.g., 0.5 fps)
- Reduce max faces limit
- Use lower resolution videos

## File Structure

```
server/
├── videoFaceExtraction.js   # Main processing module
├── downloadModels.js        # Model download script
├── models/                  # Face detection models (auto-downloaded)
└── temp/                    # Temporary files (auto-cleaned)
    ├── uploads/             # Uploaded videos
    └── video_*/             # Processing directories

src/
└── pages/
    └── VideoFaceExtraction.jsx  # UI component
```

## Security Considerations

- File uploads are authenticated (requires login)
- File size limits prevent abuse
- Only video files are accepted
- Temporary files are automatically cleaned up
- Video files are deleted after processing

## Future Enhancements

Potential improvements:
- Support for streaming/chunked video processing
- Face recognition to identify known individuals
- Export faces with metadata (timestamps, coordinates)
- Batch processing of multiple videos
- Integration with cloud storage
- Advanced filtering options

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Ensure all dependencies are installed
3. Verify face detection models are downloaded
4. Check server logs for detailed error messages
