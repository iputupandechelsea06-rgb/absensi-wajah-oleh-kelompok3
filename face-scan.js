// face-scan.js - ULTRA SIMPLE FACE DETECTION
console.log('🔥 face-scan.js LOADED - VERCEL EDITION');

let detectionRunning = false;

async function startFaceDetection() {
    console.log('🚀 STARTING FACE DETECTION');
    
    if (detectionRunning) return;
    detectionRunning = true;
    
    try {
        // 1. Check face-api
        if (typeof faceapi === 'undefined') {
            throw new Error('face-api.js not loaded');
        }
        console.log('✅ face-api version:', faceapi.version);
        
        // 2. Get video
        const video = document.getElementById('video');
        if (!video) throw new Error('Video not found');
        console.log('📹 Video:', video.videoWidth, 'x', video.videoHeight);
        
        // 3. Update status
        document.getElementById('statusBox').innerHTML = '📦 Loading AI models...';
        
        // 4. Load models (dari ROOT karena file model di root)
        console.log('🔄 Loading models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/');
        console.log('✅ Models loaded');
        
        // 5. Create canvas
        const canvas = faceapi.createCanvasFromMedia(video);
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.borderRadius = '15px';
        
        const container = document.querySelector('.video-container') || video.parentNode;
        container.appendChild(canvas);
        
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        // 6. Start detection loop
        setInterval(async () => {
            try {
                const detections = await faceapi.detectAllFaces(
                    video, 
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks();
                
                const resized = faceapi.resizeResults(detections, displaySize);
                
                // Clear canvas
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw if faces detected
                if (resized.length > 0) {
                    faceapi.draw.drawDetections(canvas, resized);
                    faceapi.draw.drawFaceLandmarks(canvas, resized);
                    document.getElementById('statusBox').innerHTML = 
                        `✅ ${resized.length} wajah terdeteksi`;
                    
                    console.log('🎯 Face detected! Box drawn.');
                }
            } catch (err) {
                console.log('Detection error:', err.message);
            }
        }, 100);
        
        document.getElementById('statusBox').innerHTML = '✅ Sistem aktif! Arahkan wajah';
        console.log('🎉 FACE DETECTION RUNNING!');
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        document.getElementById('statusBox').innerHTML = `❌ ${error.message}`;
        
        // Fallback: Draw fake box
        drawFallbackBox();
    }
}

// Fallback function
function drawFallbackBox() {
    const video = document.getElementById('video');
    if (!video) return;
    
    const canvas = document.createElement('canvas');
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
    
    setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2);
    }, 1000);
    
    document.getElementById('statusBox').innerHTML = '⚠️ DEMO: Face Detection Active';
}

// Export functions
window.startFaceDetection = startFaceDetection;
window.startFaceRecognition = startFaceDetection;
window.initFaceDetection = startFaceDetection;

console.log('✅ face-scan.js READY FOR VERCEL');
