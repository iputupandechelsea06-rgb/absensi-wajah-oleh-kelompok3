// ============================================
// 🎭 FACE ATTENDANCE SYSTEM - SIMPLE VERSION
// ============================================
// Created by: TLI Reg C Akt 24
// Kelompok 3
// ============================================

console.log('✅ script.js loaded');

// ============================================
// 🚀 MODULE 1: FACE DETECTION SYSTEM
// ============================================

let video = null;
let canvas = null;
let isDetectionRunning = false;

// Fungsi utama yang dipanggil dari scan.html
async function startFaceDetection() {
    console.log('🚀 startFaceDetection() called');
    
    try {
        // 1. Dapatkan video element
        video = document.getElementById('video');
        if (!video) {
            throw new Error('Video element not found');
        }
        
        // 2. Load Face API models
        console.log('📦 Loading Face API models...');
        
        // Model di ROOT (karena file model ada di root)
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/');
        
        console.log('✅ Models loaded successfully');
        
        // 3. Setup canvas untuk drawing
        setupCanvas();
        
        // 4. Start detection loop
        startDetectionLoop();
        
        // 5. Update status
        updateStatus('✅ Sistem siap! Arahkan wajah ke kamera', 'success');
        
    } catch (error) {
        console.error('❌ Face detection error:', error);
        updateStatus(`❌ Error: ${error.message}`, 'error');
    }
}

// Setup canvas untuk menggambar kotak deteksi
function setupCanvas() {
    // Hapus canvas lama jika ada
    const oldCanvas = document.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    
    // Buat canvas baru
    canvas = faceapi.createCanvasFromMedia(video);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    
    // Tambahkan ke container video
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.appendChild(canvas);
    } else {
        video.parentNode.appendChild(canvas);
    }
    
    // Match ukuran canvas dengan video
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    
    console.log('✅ Canvas setup complete');
}

// Loop deteksi wajah
function startDetectionLoop() {
    if (isDetectionRunning) return;
    
    isDetectionRunning = true;
    console.log('🎯 Starting face detection loop...');
    
    // Detection loop setiap 100ms (10 FPS)
    const detectionInterval = setInterval(async () => {
        if (!video || !canvas) return;
        
        try {
            // Deteksi wajah
            const detections = await faceapi.detectAllFaces(
                video, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptors();
            
            // Resize hasil deteksi
            const displaySize = { width: video.width, height: video.height };
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Gambar deteksi jika ada wajah
            if (resizedDetections.length > 0) {
                // Gambar kotak deteksi (hijau)
                faceapi.draw.drawDetections(canvas, resizedDetections);
                
                // Gambar landmark wajah (titik-titik biru)
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                
                // Update status
                updateStatus(`✅ ${resizedDetections.length} wajah terdeteksi`, 'success');
                
                // Coba recognisi wajah jika ada database
                if (window.faceRecognitionSystem) {
                    await processFaceRecognition(resizedDetections[0]);
                }
            } else {
                updateStatus('👁️ Arahkan wajah ke kamera...', 'info');
            }
            
        } catch (error) {
            console.error('Detection error:', error);
            // Jangan stop loop karena error kecil
        }
    }, 100); // 10 FPS
    
    // Simpan interval ID untuk cleanup
    window.detectionInterval = detectionInterval;
}

// Proses face recognition (jika ada database)
async function processFaceRecognition(face) {
    try {
        // Coba load users dari database
        if (!window.allUsers) {
            const response = await fetch('/api/users/descriptors');
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                window.allUsers = result.data;
                
                // Buat FaceMatcher
                const labeledFaceDescriptors = window.allUsers.map(user => {
                    const descriptors = [new Float32Array(user.descriptor)];
                    return new faceapi.LabeledFaceDescriptors(user.nama, descriptors);
                });
                
                window.faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
                console.log(`✅ Loaded ${window.allUsers.length} users for recognition`);
            }
        }
        
        // Jika ada FaceMatcher, coba recognisi
        if (window.faceMatcher) {
            const bestMatch = window.faceMatcher.findBestMatch(face.descriptor);
            
            if (bestMatch.label !== "unknown") {
                const user = window.allUsers.find(u => u.nama === bestMatch.label);
                
                // Tampilkan nama di canvas
                const ctx = canvas.getContext('2d');
                ctx.font = '16px Arial';
                ctx.fillStyle = '#00FF00';
                ctx.fillText(`👤 ${user.nama}`, face.detection.box.x, face.detection.box.y - 10);
                
                // Coba kirim absensi (hanya sekali)
                if (!window.attendanceSent) {
                    await sendAttendance(user);
                    window.attendanceSent = true;
                }
            }
        }
        
    } catch (error) {
        console.log('Recognition error (normal jika belum ada data):', error.message);
    }
}

// Kirim data absensi
async function sendAttendance(user) {
    try {
        const response = await fetch("/api/absen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nama: user.nama,
                nim: user.nim,
                status: "Hadir"
            })
        });
        
        const result = await response.json();
        console.log('✅ Attendance sent:', result);
        
        // Update status
        updateStatus(`✅ ${user.nama} - Absensi tercatat!`, 'success');
        
        // Redirect setelah 3 detik
        setTimeout(() => {
            window.location.href = `/status/${user.nim}`;
        }, 3000);
        
    } catch (error) {
        console.error('❌ Failed to send attendance:', error);
    }
}

// Update status box
function updateStatus(message, type = 'info') {
    const statusBox = document.getElementById('statusBox');
    if (!statusBox) return;
    
    const colors = {
        info: 'rgba(0, 0, 0, 0.7)',
        success: 'rgba(76, 175, 80, 0.2)',
        error: 'rgba(244, 67, 54, 0.2)'
    };
    
    const borderColors = {
        info: 'transparent',
        success: '#4CAF50',
        error: '#F44336'
    };
    
    statusBox.innerHTML = message;
    statusBox.style.background = colors[type] || colors.info;
    statusBox.style.border = `2px solid ${borderColors[type] || borderColors.info}`;
}

// ============================================
// 🎯 ALTERNATIVE FUNCTION NAMES
// ============================================

// Untuk compatibility dengan kode lain
async function startFaceRecognition() {
    console.log('🔍 startFaceRecognition() called');
    return startFaceDetection();
}

async function initFaceDetection() {
    console.log('🔧 initFaceDetection() called');
    return startFaceDetection();
}

// ============================================
// 🎨 MODULE 2: REGISTER PAGE SUPPORT
// ============================================

// Untuk register.html
async function captureFaceForRegistration() {
    try {
        const video = document.getElementById('video');
        if (!video) throw new Error('Video not found');
        
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!detection) {
            throw new Error('Wajah tidak terdeteksi');
        }
        
        // Konversi descriptor ke array
        const descriptorArray = Array.from(detection.descriptor);
        
        // Kirim ke form atau simpan sementara
        const descriptorInput = document.getElementById('faceDescriptor');
        if (descriptorInput) {
            descriptorInput.value = JSON.stringify(descriptorArray);
            return true;
        } else {
            // Simpan di localStorage untuk diambil oleh form
            localStorage.setItem('tempFaceDescriptor', JSON.stringify(descriptorArray));
            return true;
        }
        
    } catch (error) {
        console.error('Capture error:', error);
        return false;
    }
}

// ============================================
// 🚀 INITIALIZATION
// ============================================

// Export functions ke global scope
window.startFaceDetection = startFaceDetection;
window.startFaceRecognition = startFaceRecognition;
window.initFaceDetection = initFaceDetection;
window.captureFaceForRegistration = captureFaceForRegistration;

console.log('✅ All functions loaded and ready');
console.log(`
============================================
🎭 FACE ATTENDANCE SYSTEM - SIMPLE VERSION
============================================
FUNCTIONS READY:
1. startFaceDetection()    ✅
2. startFaceRecognition()  ✅  
3. initFaceDetection()     ✅
4. captureFaceForRegistration() ✅
============================================
`);
