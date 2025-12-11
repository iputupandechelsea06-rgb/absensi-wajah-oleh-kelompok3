// ============================================
// 🎭 FACE ATTENDANCE SYSTEM WITH LIVENESS DETECTION
// ============================================
// Created by: I Putu Pande Chelsea Ananda Putra
// NIM: 40040624650082
// ============================================

// DOM Elements
const video = document.getElementById("video");
const registerBtn = document.getElementById("registerBtn");

// ============================================
// 🚀 MODULE 1: FACE API INITIALIZATION
// ============================================

console.log("🔄 Loading Face API models...");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/')
]).then(() => {
  console.log("✅ All Face API models loaded successfully");
  startVideo();
}).catch(err => {
  console.error("❌ Failed to load Face API models:", err);
  alert("Gagal memuat model AI. Pastikan folder /models ada!");
});

// ============================================
// 🎥 MODULE 2: CAMERA SETUP
// ============================================

function startVideo() {
  navigator.mediaDevices.getUserMedia({
    video: { 
      width: { ideal: 640 }, 
      height: { ideal: 480 }, 
      facingMode: "user" 
    }
  }).then(stream => {
    video.srcObject = stream;
    console.log("✅ Camera access granted");
  }).catch(err => {
    console.error("❌ Camera error:", err);
    alert("Izinkan akses kamera untuk menggunakan sistem ini!");
  });
}

// ============================================
// 📊 MODULE 3: LIVENESS DETECTION SYSTEM
// ============================================

class LivenessDetector {
  constructor() {
    this.facePositions = []; // Untuk track pergerakan wajah
    this.detectionCount = 0; // Hitung frame yang terdeteksi
    this.isVerified = false; // Status verifikasi liveness
    this.movementThreshold = 5; // Minimal pergerakan (pixels)
    this.frameThreshold = 15;   // Minimal frame terdeteksi
  }

  // Hitung total pergerakan wajah
  calculateMovement() {
    if (this.facePositions.length < 2) return 0;
    
    let totalMovement = 0;
    for (let i = 1; i < this.facePositions.length; i++) {
      const dx = this.facePositions[i].x - this.facePositions[i-1].x;
      const dy = this.facePositions[i].y - this.facePositions[i-1].y;
      totalMovement += Math.sqrt(dx*dx + dy*dy);
    }
    return totalMovement;
  }

  // Update dengan posisi wajah baru
  update(facePosition) {
    this.facePositions.push({ x: facePosition.x, y: facePosition.y });
    this.detectionCount++;
    
    // Simpan maksimal 30 posisi terakhir
    if (this.facePositions.length > 30) {
      this.facePositions.shift();
    }
    
    // Cek apakah liveness requirements terpenuhi
    if (!this.isVerified && 
        this.detectionCount >= this.frameThreshold && 
        this.calculateMovement() > this.movementThreshold) {
      this.isVerified = true;
      console.log("✅ Liveness verified! Movement:", this.calculateMovement());
      return true;
    }
    
    return false;
  }

  // Reset untuk deteksi baru
  reset() {
    this.facePositions = [];
    this.detectionCount = 0;
    this.isVerified = false;
  }

  // Get status untuk display
  getStatus() {
    return {
      isVerified: this.isVerified,
      frameCount: this.detectionCount,
      movement: this.calculateMovement(),
      progress: Math.min(this.detectionCount / this.frameThreshold, 1)
    };
  }
}

// ============================================
// 👤 MODULE 4: FACE RECOGNITION SYSTEM
// ============================================

class FaceRecognitionSystem {
  constructor() {
    this.allUsers = [];
    this.labeledFaceDescriptors = [];
    this.faceMatcher = null;
    this.hasRedirected = false; // Untuk mencegah multiple redirects
  }

  // Load semua user dari database
  async loadUsersFromDatabase() {
    try {
      const response = await fetch('/api/users/descriptors');
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        this.allUsers = result.data;
        
        // Prepare data untuk FaceMatcher
        this.labeledFaceDescriptors = this.allUsers.map(user => {
          const descriptors = [new Float32Array(user.descriptor)];
          return new faceapi.LabeledFaceDescriptors(user.nama, descriptors);
        });
        
        this.faceMatcher = new faceapi.FaceMatcher(this.labeledFaceDescriptors, 0.6);
        
        console.log(`✅ Loaded ${this.allUsers.length} users from database`);
        return true;
      } else {
        console.log("⚠️ No users found in database");
        return false;
      }
      
    } catch (error) {
      console.error("❌ Failed to load users:", error);
      return false;
    }
  }

  // Recognize face dari descriptor
  recognizeFace(descriptor) {
    if (!this.faceMatcher) return null;
    
    const bestMatch = this.faceMatcher.findBestMatch(descriptor);
    
    if (bestMatch.label !== "unknown") {
      const user = this.allUsers.find(u => u.nama === bestMatch.label);
      return {
        user: user,
        match: bestMatch,
        distance: bestMatch.distance
      };
    }
    
    return null;
  }

  // Kirim data absensi ke server
  async sendAttendance(user) {
    if (this.hasRedirected) return;
    
    this.hasRedirected = true;
    
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
      console.log("✅ Attendance sent:", result);
      
      return result.success;
      
    } catch (error) {
      console.error("❌ Failed to send attendance:", error);
      return false;
    }
  }
}

// ============================================
// 🎨 MODULE 5: UI COMPONENTS
// ============================================

class UIComponents {
  constructor() {
    this.createHUD();
    this.createLivenessDisplay();
    this.createDemoControls();
  }

  // Create Heads-Up Display
  createHUD() {
    this.hud = document.createElement("div");
    this.hud.id = "statusBox";
    this.hud.textContent = "👁️ Menunggu wajah...";
    document.body.appendChild(this.hud);
  }

  // Create Liveness Status Display
  createLivenessDisplay() {
    this.livenessDisplay = document.createElement("div");
    this.livenessDisplay.id = "livenessInfo";
    this.livenessDisplay.innerHTML = `
      <div class="liveness-progress">
        <div class="progress-bar"></div>
        <span class="progress-text">0%</span>
      </div>
      <div class="movement-indicator">
        <span>Pergerakan: </span>
        <span class="movement-value">0 px</span>
      </div>
    `;
    document.body.appendChild(this.livenessDisplay);
  }

  // Create Demo Controls (untuk video demonstration)
  createDemoControls() {
    const controls = document.createElement("div");
    controls.id = "demoControls";
    controls.innerHTML = `
      <h3>🎬 Demo Controls</h3>
      <button id="toggleLiveness">Toggle Liveness Check</button>
      <button id="simulatePhoto">Simulate Photo Attack</button>
      <button id="resetAll">Reset All</button>
    `;
    document.body.appendChild(controls);
    
    // Event listeners untuk demo
    document.getElementById("toggleLiveness").onclick = () => {
      window.livenessEnabled = !window.livenessEnabled;
      alert(`Liveness check ${window.livenessEnabled ? 'ENABLED' : 'DISABLED'}`);
    };
    
    document.getElementById("simulatePhoto").onclick = () => {
      alert("⚠️ SIMULASI SERANGAN FOTO:\nSistem ini bisa ditipu dengan foto karena:\n1. 2D recognition only\n2. No 3D depth sensing\n3. Simple liveness detection");
    };
    
    document.getElementById("resetAll").onclick = () => {
      window.location.reload();
    };
  }

  // Update HUD status
  updateHUD(message, type = "info") {
    const colors = {
      info: "#333",
      success: "#4CAF50",
      warning: "#FF9800",
      error: "#F44336"
    };
    
    this.hud.textContent = message;
    this.hud.style.background = colors[type] || colors.info;
  }

  // Update liveness display
  updateLivenessDisplay(status) {
    const progressBar = this.livenessDisplay.querySelector(".progress-bar");
    const progressText = this.livenessDisplay.querySelector(".progress-text");
    const movementValue = this.livenessDisplay.querySelector(".movement-value");
    
    const progressPercent = Math.round(status.progress * 100);
    progressBar.style.width = `${progressPercent}%`;
    progressBar.style.background = status.isVerified ? "#4CAF50" : "#FF9800";
    progressText.textContent = `${progressPercent}%`;
    movementValue.textContent = `${Math.round(status.movement)} px`;
    
    if (status.isVerified) {
      this.livenessDisplay.style.background = "rgba(76, 175, 80, 0.9)";
    } else {
      this.livenessDisplay.style.background = "rgba(255, 152, 0, 0.9)";
    }
  }

  // Draw face box dengan warna berdasarkan status
  drawFaceBox(ctx, box, isVerified, userName = null) {
    // Gambar box
    ctx.strokeStyle = isVerified ? "#00FF00" : "#FF9800";
    ctx.lineWidth = isVerified ? 3 : 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Gambar label
    ctx.font = "16px Arial";
    ctx.fillStyle = isVerified ? "#00FF00" : "#FF9800";
    
    let labelText = isVerified ? "✅ Verified" : "⏳ Verifying...";
    if (userName) {
      labelText = isVerified ? `✅ ${userName}` : `⏳ ${userName} (verifying)`;
    }
    
    ctx.fillText(labelText, box.x, box.y - 10);
    
    // Gambar progress indicator kecil
    if (!isVerified) {
      ctx.fillStyle = "rgba(255, 152, 0, 0.5)";
      ctx.fillRect(box.x, box.y + box.height + 5, box.width * status.progress, 3);
    }
  }
}

// ============================================
// 🎯 MODULE 6: MAIN APPLICATION
// ============================================

class FaceAttendanceApp {
  constructor() {
    this.livenessDetector = new LivenessDetector();
    this.faceSystem = new FaceRecognitionSystem();
    this.ui = new UIComponents();
    this.canvas = null;
    this.ctx = null;
    this.displaySize = null;
    
    // Demo mode default
    window.livenessEnabled = true;
    
    this.initialize();
  }

  async initialize() {
    // Tunggu video ready
    video.addEventListener("loadedmetadata", () => this.setupCanvas());
    
    // Load user data dari database
    await this.faceSystem.loadUsersFromDatabase();
    
    // Start detection loop
    this.startDetectionLoop();
    
    console.log("✅ Face Attendance App initialized");
    this.ui.updateHUD("Sistem siap! Arahkan wajah ke kamera", "info");
  }

  setupCanvas() {
    // Buat container untuk video dan canvas
    const container = document.createElement('div');
    container.style.position = 'relative';
    document.body.appendChild(container);
    container.appendChild(video);
    
    // Buat canvas untuk drawing
    this.canvas = faceapi.createCanvasFromMedia(video);
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    container.appendChild(this.canvas);
    
    // Setup canvas size
    this.displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(this.canvas, this.displaySize);
    
    this.ctx = this.canvas.getContext("2d");
  }

  async startDetectionLoop() {
    setInterval(async () => {
      await this.detectAndProcess();
    }, 100); // 10 FPS
  }

  async detectAndProcess() {
    try {
      // Deteksi wajah
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      const resized = faceapi.resizeResults(detections, this.displaySize);
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw detections
      faceapi.draw.drawDetections(this.canvas, resized);
      
      // Process hasil detection
      if (resized.length > 0) {
        await this.processFaceDetection(resized[0]);
      } else {
        // Reset jika tidak ada wajah
        this.livenessDetector.reset();
        this.ui.updateHUD("👁️ Menunggu wajah...", "info");
      }
      
    } catch (error) {
      console.error("Detection error:", error);
    }
  }

  async processFaceDetection(face) {
    const box = face.detection.box;
    
    // LIVENESS DETECTION
    let isVerified = false;
    
    if (window.livenessEnabled) {
      const livenessUpdated = this.livenessDetector.update(box);
      const livenessStatus = this.livenessDetector.getStatus();
      
      // Update UI
      this.ui.updateLivenessDisplay(livenessStatus);
      isVerified = livenessStatus.isVerified;
      
      if (!isVerified) {
        this.ui.updateHUD(
          `🔍 Verifikasi... (${livenessStatus.frameCount}/${this.livenessDetector.frameThreshold} frame)`,
          "warning"
        );
      } else if (livenessUpdated) {
        this.ui.updateHUD("✅ Wajah terverifikasi!", "success");
      }
    } else {
      // Skip liveness check (demo mode)
      isVerified = true;
      this.ui.updateHUD("⚠️ Liveness check disabled (Demo mode)", "warning");
    }
    
    // FACE RECOGNITION (hanya jika liveness verified atau demo mode)
    let recognizedUser = null;
    
    if (isVerified || !window.livenessEnabled) {
      recognizedUser = this.faceSystem.recognizeFace(face.descriptor);
    }
    
    // DRAW VISUAL FEEDBACK
    if (recognizedUser) {
      this.ui.drawFaceBox(this.ctx, box, isVerified, recognizedUser.user.nama);
      
      // PROCESS ATTENDANCE & REDIRECT
      if (isVerified && !this.faceSystem.hasRedirected) {
        await this.processAttendance(recognizedUser.user);
      }
      
    } else {
      this.ui.drawFaceBox(this.ctx, box, isVerified);
      
      if (isVerified) {
        this.ui.updateHUD("✅ Verified tapi wajah tidak dikenali", "warning");
      }
    }
  }

  async processAttendance(user) {
    console.log(`🎯 Processing attendance for: ${user.nama}`);
    
    // Kirim data absensi
    const success = await this.faceSystem.sendAttendance(user);
    
    if (success) {
      this.ui.updateHUD(`✅ ${user.nama} - Absensi tercatat!`, "success");
      
      // Countdown sebelum redirect
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        this.ui.updateHUD(`⏱️ Redirect dalam ${countdown}...`, "info");
        countdown--;
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          window.location.href = `/status/${user.nim}`;
        }
      }, 1000);
      
    } else {
      this.ui.updateHUD("❌ Gagal menyimpan absensi", "error");
      this.faceSystem.hasRedirected = false; // Reset untuk coba lagi
    }
  }
}

// ============================================
// 🎨 MODULE 7: STYLES
// ============================================

const styles = document.createElement('style');
styles.textContent = `
  /* Global Styles */
  body {
    margin: 0;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    font-family: 'Segoe UI', Arial, sans-serif;
    color: white;
  }
  
  #video {
    transform: scaleX(-1);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    border: 3px solid #3498db;
  }
  
  /* HUD Styles */
  #statusBox {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #2c3e50;
    padding: 15px 30px;
    color: white;
    font-size: 20px;
    font-weight: bold;
    border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    transition: all 0.3s ease;
    min-width: 300px;
    text-align: center;
  }
  
  /* Liveness Display */
  #livenessInfo {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 152, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    z-index: 9998;
    min-width: 250px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  
  .liveness-progress {
    margin-bottom: 8px;
  }
  
  .progress-bar {
    height: 6px;
    background: #4CAF50;
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-weight: bold;
    margin-left: 10px;
  }
  
  .movement-indicator {
    font-size: 12px;
    opacity: 0.9;
  }
  
  /* Demo Controls */
  #demoControls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 10px;
    border: 2px solid #3498db;
    z-index: 10000;
    max-width: 250px;
  }
  
  #demoControls h3 {
    margin-top: 0;
    color: #3498db;
  }
  
  #demoControls button {
    display: block;
    width: 100%;
    margin: 5px 0;
    padding: 8px 12px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
  }
  
  #demoControls button:hover {
    background: #2980b9;
  }
  
  /* Register Button (jika ada) */
  #registerBtn {
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 12px 25px;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
    z-index: 10000;
  }
  
  #registerBtn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
  }
`;
document.head.appendChild(styles);

// ============================================
// 🚀 APPLICATION START
// ============================================

// Tunggu DOM ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Starting Face Attendance System...");
  window.app = new FaceAttendanceApp();
});

// ============================================
// 📝 REGISTER BUTTON HANDLER (untuk register.html)
// ============================================

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      alert("❌ Wajah tidak ditemukan! Pastikan wajah terlihat jelas.");
      return;
    }
    
    // Note: Ini untuk demo, aslinya pakai /api/register
    const descriptorArray = Array.from(detection.descriptor);
    localStorage.setItem("tempDescriptor", JSON.stringify(descriptorArray));
    
    alert("✅ Wajah berhasil diambil! Lanjutkan ke form register.");
    
    // Redirect ke form register atau tampilkan form
    const nama = prompt("Masukkan nama lengkap:");
    const nim = prompt("Masukkan NIM:");
    
    if (nama && nim) {
      // Kirim ke server (dummy untuk demo)
      console.log(`Would register: ${nama} (${nim})`);
      alert(`✅ ${nama} berhasil diregister!`);
    }
  });
}

// ============================================
// 📊 DEBUG INFO
// ============================================

console.log(`
============================================
🎭 FACE ATTENDANCE SYSTEM v2.0
============================================
FEATURES:
1. Multi-user Face Recognition
2. Liveness Detection
3. Anti-Spoofing Basic
4. Real-time Camera Processing
5. Database Integration
6. Demo Mode for Presentation
============================================

`);
// ============================================
// 🔧 FIX UNTUK SCAN.HTML - WRAPPER FUNCTION
// ============================================

// Fungsi yang dicari oleh scan.html
async function startFaceRecognition() {
    console.log('🚀 startFaceRecognition() called from scan.html');
    
    try {
        // 1. Load model face-api.js
        console.log('📦 Loading face-api models...');
        
        // Coba load dari ROOT (karena model di root)
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/');
        
        console.log('✅ Models loaded successfully');
        
        // 2. Start detection loop
        const video = document.getElementById('video');
        const canvas = faceapi.createCanvasFromMedia(video);
        document.querySelector('.video-container').append(canvas);
        
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        console.log('🎯 Starting face detection loop...');
        
        // 3. Detection loop
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            // Clear canvas
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw detections
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            
            // Update status
            if (detections.length > 0) {
                document.getElementById('statusBox').innerHTML = 
                    `✅ ${detections.length} wajah terdeteksi`;
            }
            
        }, 100);
        
    } catch (error) {
        console.error('❌ Face detection error:', error);
        document.getElementById('statusBox').innerHTML = 
            '❌ Error face detection: ' + error.message;
    }
}

// Alternatif function names (biar scan.html bisa panggil)
async function startFaceDetection() {
    console.log('🔍 startFaceDetection() called');
    return startFaceRecognition();
}

async function initFaceDetection() {
    console.log('🔧 initFaceDetection() called');
    return startFaceRecognition();
}

console.log('✅ Face detection wrapper functions loaded');

