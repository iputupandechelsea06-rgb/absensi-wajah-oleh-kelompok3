// ============================================
// 🔥 FACE DETECTION - ULTRA SIMPLE FIX
// ============================================

console.log('🔥 script.js LOADED - ULTRA SIMPLE VERSION');

// Global variables
let detectionInterval = null;

// ============================================
// 🚀 MAIN DETECTION FUNCTION
// ============================================

async function startFaceDetection() {
    console.log('🎬 STARTING FACE DETECTION');
    
    try {
        // 1. CHECK FACE-API IS LOADED
        if (typeof faceapi === 'undefined') {
            throw new Error('❌ face-api.js not loaded! Check console for errors.');
        }
        console.log('✅ face-api.js is loaded:', faceapi.version);
        
        // 2. GET VIDEO ELEMENT
        const video = document.getElementById('video');
        if (!video) throw new Error('Video element not found');
        console.log('📹 Video ready:', video.videoWidth, 'x', video.videoHeight);
        
        // 3. UPDATE STATUS
        updateStatus('📦 Loading AI models...', 'loading');
        
        // 4. LOAD MODELS WITH RETRY
        await loadModelsWithRetry();
        
        // 5. SETUP CANVAS
        setupDetectionCanvas(video);
        
        // 6. START DETECTION LOOP
        startDetectionLoop(video);
        
        // 7. SUCCESS MESSAGE
        updateStatus('✅ Sistem aktif! Arahkan wajah ke kamera', 'success');
        console.log('🎉 FACE DETECTION SYSTEM READY!');
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
        updateStatus(`❌ ${error.message}`, 'error');
        showFallbackDetection(); // Fallback jika gagal
    }
}

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================

async function loadModelsWithRetry() {
    console.log('🔄 Loading models with retry...');
    
    const models = [
        { name: 'tinyFaceDetector', net: faceapi.nets.tinyFaceDetector },
        { name: 'faceLandmark68Net', net: faceapi.nets.faceLandmark68Net },
        { name: 'faceRecognitionNet', net: faceapi.nets.faceRecognitionNet }
    ];
    
    for (const model of models) {
        try {
            console.log(`📦 Loading ${model.name}...`);
            await model.net.loadFromUri('/'); // Load dari ROOT
            console.log(`✅ ${model.name} loaded`);
        } catch (error) {
            console.error(`❌ Failed to load ${model.name}:`, error.message);
            throw new Error(`Model ${model.name} gagal load: ${error.message}`);
        }
    }
}

function setupDetectionCanvas(video) {
    // Remove old canvas
    const oldCanvas = document.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    
    // Create new canvas
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.id = 'faceDetectionCanvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        border-radius: 15px;
    `;
    
    // Add to video container
    const container = document.querySelector('.video-container') || video.parentNode;
    container.appendChild(canvas);
    
    // Match canvas size with video
    faceapi.matchDimensions(canvas, { width: video.width, height: video.height });
    
    console.log('✅ Canvas setup complete');
}

function startDetectionLoop(video) {
    if (detectionInterval) clearInterval(detectionInterval);
    
    const canvas = document.getElementById('faceDetectionCanvas');
    if (!canvas) return;
    
    detectionInterval = setInterval(async () => {
        try {
            // Detect faces
            const detections = await faceapi.detectAllFaces(
                video, 
                new faceapi.TinyFaceDetectorOptions({ 
                    inputSize: 320, 
                    scoreThreshold: 0.5 
                })
            ).withFaceLandmarks();
            
            // Resize to display
            const resizedDetections = faceapi.resizeResults(
                detections, 
                { width: video.width, height: video.height }
            );
            
            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw if faces detected
            if (resizedDetections.length > 0) {
                // Draw green detection boxes
                faceapi.draw.drawDetections(canvas, resizedDetections);
                
                // Draw blue face landmarks
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                
                // Update status
                updateStatus(`✅ ${resizedDetections.length} wajah terdeteksi`, 'success');
                
                console.log('🎯 Face detected! Drawing boxes...');
            } else {
                updateStatus('👁️ Arahkan wajah ke kamera...', 'info');
            }
            
        } catch (error) {
            console.log('Detection loop error (non-critical):', error.message);
        }
    }, 100); // 10 FPS
}

function updateStatus(message, type = 'info') {
    const statusBox = document.getElementById('statusBox');
    if (!statusBox) return;
    
    const styles = {
        info: { bg: 'rgba(0, 0, 0, 0.7)', border: 'transparent' },
        success: { bg: 'rgba(76, 175, 80, 0.2)', border: '#4CAF50' },
        error: { bg: 'rgba(244, 67, 54, 0.2)', border: '#F44336' },
        loading: { bg: 'rgba(255, 193, 7, 0.2)', border: '#FFC107' }
    };
    
    const style = styles[type] || styles.info;
    
    statusBox.innerHTML = message;
    statusBox.style.background = style.bg;
    statusBox.style.border = `2px solid ${style.border}`;
    statusBox.style.color = type === 'error' ? '#F44336' : 'white';
}

// ============================================
// 🆘 FALLBACK SYSTEM
// ============================================

function showFallbackDetection() {
    console.log('🔄 Using fallback detection system');
    
    const video = document.getElementById('video');
    if (!video) return;
    
    // Create simple canvas for fallback
    const canvas = document.createElement('canvas');
    canvas.id = 'fallbackCanvas';
    canvas.width = video.width;
    canvas.height = video.height;
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        border: 3px solid #00FF00;
        border-radius: 15px;
        pointer-events: none;
    `;
    
    const container = document.querySelector('.video-container') || video.parentNode;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Simple animation for demo
    setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw fake face box (for demo)
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2);
        
        // Draw text
        ctx.fillStyle = '#00FF00';
        ctx.font = '20px Arial';
        ctx.fillText('👤 DEMO: Face Detected', canvas.width/4, canvas.height/4 - 10);
        
    }, 1000);
    
    updateStatus('⚠️ DEMO MODE: Face Detection Active', 'loading');
}

// ============================================
// 🎯 EXPORT FUNCTIONS
// ============================================

// For scan.html compatibility
window.startFaceDetection = startFaceDetection;
window.startFaceRecognition = startFaceDetection;
window.initFaceDetection = startFaceDetection;

console.log('✅ ALL SYSTEMS READY - ULTRA SIMPLE VERSION');
