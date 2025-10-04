const https = require('https');
const fs = require('fs');
const path = require('path');

const modelPath = path.join(__dirname, 'models');

// Create models directory
if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath, { recursive: true });
}

const models = [
    {
        name: 'ssd_mobilenetv1_model-weights_manifest.json',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json'
    },
    {
        name: 'ssd_mobilenetv1_model-shard1',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1'
    },
    {
        name: 'ssd_mobilenetv1_model-shard2',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2'
    },
    {
        name: 'face_landmark_68_model-weights_manifest.json',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'
    },
    {
        name: 'face_landmark_68_model-shard1',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1'
    },
    {
        name: 'face_recognition_model-weights_manifest.json',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'
    },
    {
        name: 'face_recognition_model-shard1',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1'
    },
    {
        name: 'face_recognition_model-shard2',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2'
    }
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function downloadModels() {
    console.log('📦 Downloading face detection models...');
    
    for (const model of models) {
        const destPath = path.join(modelPath, model.name);
        
        // Skip if already exists
        if (fs.existsSync(destPath)) {
            console.log(`✓ ${model.name} already exists`);
            continue;
        }
        
        try {
            console.log(`⬇️  Downloading ${model.name}...`);
            await downloadFile(model.url, destPath);
            console.log(`✅ Downloaded ${model.name}`);
        } catch (error) {
            console.error(`❌ Failed to download ${model.name}:`, error.message);
            throw error;
        }
    }
    
    console.log('✅ All models downloaded successfully!');
}

// Run if called directly
if (require.main === module) {
    downloadModels().catch(error => {
        console.error('Failed to download models:', error);
        process.exit(1);
    });
}

module.exports = { downloadModels };
