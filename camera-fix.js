/**
 * CAMERA-FIX.JS
 * Solusi untuk permission kamera di HTTPS/Vercel
 * Dibuat untuk scan.html
 */

console.log('✅ camera-fix.js loaded');

// =================================================
// 🎯 UTAMA: FIX UNTUK KAMERA PERMISSION DI HTTPS
// =================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Checking if this is scan page...');
    
    // Cek apakah kita di halaman /scan
    if (!window.location.pathname.includes('/scan')) {
        console.log('⏩ Not on scan page, skipping camera fix');
        return;
    }
    
    console.log('✅ On scan page, applying camera fix...');
    
    // 1. UPDATE STATUS BOX
    const statusBox = document.getElementById('statusBox');
    if (statusBox) {
        statusBox.innerHTML = '👆 Tekan tombol "START KAMERA" di bawah';
        statusBox.style.background = 'rgba(255, 193, 7, 0.2)';
        statusBox.style.border = '2px solid #FFC107';
    }
    
    // 2. SEMBUNYIKAN VIDEO DULU
    const video = document.getElementById('video');
    if (video) {
        video.style.display = 'none';
        console.log('📹 Video element hidden');
    }
    
    // 3. BUAT TOMBOL START KAMERA
    createStartCameraButton();
});

// =================================================
// 🎥 FUNGSI: BUAT TOMBOL START KAMERA
// =================================================

function createStartCameraButton() {
    console.log('🔧 Creating start camera button...');
    
    // Cari container video
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) {
        console.error('❌ Video container not found!');
        return;
    }
    
    // Cek apakah tombol sudah ada
    if (document.getElementById('startCameraBtn')) {
        console.log('⚠️ Start button already exists');
        return;
    }
    
    // Buat div untuk permission info
    const permissionDiv = document.createElement('div');
    permissionDiv.id = 'cameraPermission';
    permissionDiv.style.cssText = `
        text-align: center;
        margin: 30px 0;
        padding: 20px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 15px;
        border: 2px dashed #4CAF50;
    `;
    
    // Tambah judul
    const title = document.createElement('h3');
    title.innerHTML = '🎥 PERMISSION KAMERA DIBUTUHKAN';
    title.style.cssText = `
        color: #4CAF50;
        margin-bottom: 15px;
        font-size: 1.3rem;
    `;
    
    // Tambah instruksi
    const instruction = document.createElement('p');
    instruction.innerHTML = 'Di HTTPS/Vercel, kamera hanya bisa diakses setelah Anda mengklik tombol di bawah ini';
    instruction.style.cssText = `
        color: #ccc;
        margin-bottom: 20px;
        line-height: 1.5;
    `;
    
    // Buat tombol start
    const startBtn = document.createElement('button');
    startBtn.id = 'startCameraBtn';
    startBtn.innerHTML = '🚀 START KAMERA SEKARANG';
    startBtn.style.cssText = `
        padding: 18px 40px;
        font-size: 18px;
        background: linear-gradient(135deg, #4CAF50, #2196F3);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    `;
    
    // Efek hover
    startBtn.onmouseover = function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
    };
    
    startBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    };
    
    // Event klik tombol
    startBtn.addEventListener('click', handleCameraStart);
    
    // Tambah loading indicator
    const loading = document.createElement('div');
    loading.id = 'cameraLoading';
    loading.innerHTML = '⏳ Sedang memulai kamera...';
    loading.style.cssText = `
        color: #FFC107;
        margin-top: 15px;
        display: none;
    `;
    
    // Assemble semua elemen
    permissionDiv.appendChild(title);
    permissionDiv.appendChild(instruction);
    permissionDiv.appendChild(startBtn);
    permissionDiv.appendChild(loading);
    
    // Masukkan sebelum video
    videoContainer.insertBefore(permissionDiv, videoContainer.firstChild);
    
    console.log('✅ Start camera button created');
}

// =================================================
// 🔧 FUNGSI: HANDLE START KAMERA
// =================================================

async function handleCameraStart() {
    console.log('🎬 Starting camera...');
    
    const startBtn = document.getElementById('startCameraBtn');
    const loading = document.getElementById('cameraLoading');
    const statusBox = document.getElementById('statusBox');
    const video = document.getElementById('video');
    const permissionDiv = document.getElementById('cameraPermission');
    
    // Update UI
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = '⏳ MEMUAT KAMERA...';
        startBtn.style.opacity = '0.7';
    }
    
    if (loading) loading.style.display = 'block';
    if (statusBox) statusBox.innerHTML = '🔍 Mengakses kamera...';
    
    try {
        // 1. Minta permission kamera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } 
        });
        
        console.log('✅ Camera access granted');
        
        // 2. Tampilkan video
        if (video) {
            video.srcObject = stream;
            video.style.display = 'block';
            console.log('📹 Video stream connected');
        }
        
        // 3. Update UI
        if (permissionDiv) permissionDiv.style.display = 'none';
        if (statusBox) {
            statusBox.innerHTML = '✅ Kamera aktif!';
            statusBox.style.background = 'rgba(76, 175, 80, 0.2)';
            statusBox.style.border = '2px solid #4CAF50';
        }
        
        // 4. Coba panggil fungsi face detection yang sudah ada
        console.log('🔍 Looking for face detection functions...');
        
        // Tunggu sebentar untuk pastikan video sudah siap
        setTimeout(() => {
            // Coba berbagai kemungkinan nama fungsi
            if (typeof startFaceRecognition === 'function') {
                console.log('🚀 Calling startFaceRecognition()');
                startFaceRecognition();
            } else if (typeof startFaceDetection === 'function') {
                console.log('🚀 Calling startFaceDetection()');
                startFaceDetection();
            } else if (typeof initFaceDetection === 'function') {
                console.log('🚀 Calling initFaceDetection()');
                initFaceDetection();
            } else {
                console.log('⚠️ No face detection function found');
                if (statusBox) {
                    statusBox.innerHTML = '✅ Kamera aktif! Silahkan menunggu deteksi wajah...';
                }
                
                // Coba load script.js jika belum
                if (typeof loadFaceModels === 'undefined') {
                    console.log('📦 Loading face detection scripts...');
                    // Script.js sudah diload di HTML, jadi tunggu saja
                }
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        
        // Tampilkan error ke user
        if (statusBox) {
            statusBox.innerHTML = `❌ Error: ${error.name}`;
            statusBox.style.background = 'rgba(244, 67, 54, 0.2)';
            statusBox.style.border = '2px solid #F44336';
            statusBox.style.color = '#F44336';
        }
        
        // Reset tombol
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '🔄 COBA LAGI';
            startBtn.style.opacity = '1';
            startBtn.style.background = 'linear-gradient(135deg, #FF9800, #F44336)';
        }
        
        if (loading) loading.style.display = 'none';
        
        // Tampilkan pesan error detail
        let errorMessage = 'Gagal mengakses kamera. ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Permission ditolak. Izinkan kamera di browser settings.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'Kamera tidak ditemukan.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Kamera sedang digunakan aplikasi lain.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

// =================================================
// 🌐 FUNGSI TAMBAHAN: CEK PERMISSION STATUS
// =================================================

// Cek permission kamera saat halaman load
async function checkCameraPermission() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`📹 Found ${videoDevices.length} camera device(s)`);
        
        if (videoDevices.length === 0) {
            console.warn('⚠️ No camera devices found');
        }
        
        return videoDevices.length > 0;
    } catch (error) {
        console.error('Error checking camera devices:', error);
        return false;
    }
}

// Panggil saat halaman load
setTimeout(checkCameraPermission, 500);

console.log('✅ camera-fix.js initialization complete');