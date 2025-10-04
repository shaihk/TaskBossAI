const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const fs = require('fs');
const path = require('path');
const { Canvas, Image, ImageData } = canvas;

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Patch face-api to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

// Load face detection models
async function loadModels() {
    if (modelsLoaded) return;
    
    const modelPath = path.join(__dirname, 'models');
    
    // Create models directory if it doesn't exist
    if (!fs.existsSync(modelPath)) {
        fs.mkdirSync(modelPath, { recursive: true });
    }
    
    try {
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
        modelsLoaded = true;
        console.log('✅ Face detection models loaded successfully');
    } catch (error) {
        console.error('❌ Error loading face detection models:', error);
        throw new Error('Failed to load face detection models. Please ensure models are available.');
    }
}

// Extract frames from video
async function extractFrames(videoPath, outputDir, frameRate = 1) {
    return new Promise((resolve, reject) => {
        const frames = [];
        let frameIndex = 0;
        
        ffmpeg(videoPath)
            .outputOptions([
                `-vf fps=${frameRate}` // Extract 1 frame per second
            ])
            .output(path.join(outputDir, 'frame-%04d.png'))
            .on('end', () => {
                // Get list of extracted frames
                const files = fs.readdirSync(outputDir).filter(f => f.startsWith('frame-'));
                files.forEach(file => {
                    frames.push(path.join(outputDir, file));
                });
                resolve(frames);
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
}

// Detect faces in an image
async function detectFaces(imagePath) {
    try {
        const img = await canvas.loadImage(imagePath);
        const detections = await faceapi
            .detectAllFaces(img)
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        return detections;
    } catch (error) {
        console.error(`Error detecting faces in ${imagePath}:`, error);
        return [];
    }
}

// Calculate Euclidean distance between two face descriptors
function getDistance(descriptor1, descriptor2) {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
}

// Extract unique faces from video
async function extractUniqueFaces(videoPath, options = {}) {
    const {
        frameRate = 1, // Extract 1 frame per second
        similarityThreshold = 0.6, // Faces with distance < 0.6 are considered the same person
        maxFaces = 50, // Maximum number of unique faces to extract
    } = options;
    
    // Create temporary directories
    const tempDir = path.join(__dirname, 'temp', `video_${Date.now()}`);
    const framesDir = path.join(tempDir, 'frames');
    const facesDir = path.join(tempDir, 'faces');
    
    [tempDir, framesDir, facesDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    try {
        // Load face detection models
        await loadModels();
        
        // Extract frames from video
        console.log('📹 Extracting frames from video...');
        const frames = await extractFrames(videoPath, framesDir, frameRate);
        console.log(`✅ Extracted ${frames.length} frames`);
        
        // Detect faces in each frame
        console.log('👤 Detecting faces in frames...');
        const uniqueFaces = [];
        const faceDescriptors = [];
        let processedFrames = 0;
        
        for (const frame of frames) {
            const detections = await detectFaces(frame);
            
            for (const detection of detections) {
                // Check if this face is already in our unique faces list
                let isUnique = true;
                
                for (const existingDescriptor of faceDescriptors) {
                    const distance = getDistance(detection.descriptor, existingDescriptor);
                    if (distance < similarityThreshold) {
                        isUnique = false;
                        break;
                    }
                }
                
                if (isUnique && uniqueFaces.length < maxFaces) {
                    // Extract face image
                    const faceIndex = uniqueFaces.length;
                    const facePath = path.join(facesDir, `face_${faceIndex}.png`);
                    
                    // Load the frame image
                    const img = await canvas.loadImage(frame);
                    const faceCanvas = canvas.createCanvas(detection.detection.box.width, detection.detection.box.height);
                    const ctx = faceCanvas.getContext('2d');
                    
                    // Draw the face region
                    ctx.drawImage(
                        img,
                        detection.detection.box.x,
                        detection.detection.box.y,
                        detection.detection.box.width,
                        detection.detection.box.height,
                        0,
                        0,
                        detection.detection.box.width,
                        detection.detection.box.height
                    );
                    
                    // Save face image
                    const buffer = faceCanvas.toBuffer('image/png');
                    fs.writeFileSync(facePath, buffer);
                    
                    uniqueFaces.push({
                        path: facePath,
                        index: faceIndex,
                        confidence: detection.detection.score
                    });
                    
                    faceDescriptors.push(detection.descriptor);
                }
            }
            
            processedFrames++;
            if (processedFrames % 10 === 0) {
                console.log(`Processed ${processedFrames}/${frames.length} frames, found ${uniqueFaces.length} unique faces`);
            }
        }
        
        console.log(`✅ Found ${uniqueFaces.length} unique faces`);
        
        // Convert face images to base64
        const facesBase64 = uniqueFaces.map(face => {
            const buffer = fs.readFileSync(face.path);
            return {
                data: `data:image/png;base64,${buffer.toString('base64')}`,
                index: face.index,
                confidence: face.confidence
            };
        });
        
        // Clean up temporary files
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.error('Error cleaning up temporary files:', error);
        }
        
        return facesBase64;
        
    } catch (error) {
        // Clean up on error
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (cleanupError) {
            console.error('Error cleaning up after failure:', cleanupError);
        }
        throw error;
    }
}

module.exports = {
    extractUniqueFaces,
    loadModels
};
