const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

// =======================================
//     ⚙️ MIDDLEWARE CONFIGURATION
// =======================================
app.use(cors());
app.use(express.json());
app.use(express.static("public", { index: false }));

// =======================================
//     ⚠️ DATABASE CONNECTION - DISABLE DULU UNTUK DEPLOY
// =======================================
// KOMENTAR DULU BAGIAN INI UNTUK TESTING DEPLOY
/*
const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "absensi_wajah"
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL database");
        createTablesIfNotExist();
    }
});

function createTablesIfNotExist() {
    const usersTable = `CREATE TABLE IF NOT EXISTS users ( ... )`;
    const absensiTable = `CREATE TABLE IF NOT EXISTS absensi ( ... )`;
    
    db.query(usersTable, (err) => {
        if (err) console.error("❌ Gagal buat table users:", err);
        else console.log("✅ Table 'users' ready");
    });
    
    db.query(absensiTable, (err) => {
        if (err) console.error("❌ Gagal buat table absensi:", err);
        else console.log("✅ Table 'absensi' ready");
    });
}
*/

// =======================================
//     🔥 API ROUTES - DIMODIFIKASI UNTUK DEPLOY
// =======================================

// 1. SIMPAN ABSENSI (Dummy untuk testing)
app.post("/api/absen", (req, res) => {
    console.log("📥 API Absen dipanggil:", req.body.nama);
    
    const { nama, nim, status } = req.body;
    const date = new Date();
    const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const hari = hariList[date.getDay()];
    const tanggal = date.toISOString().split("T")[0];
    const jam = date.toTimeString().split(" ")[0];
    
    // SIMULASI RESPONSE (tanpa database)
    console.log(`✅ [SIMULASI] Absensi disimpan: ${nama} (${nim}) - ${hari}, ${tanggal} ${jam}`);
    
    res.json({ 
        success: true, 
        message: "Absensi disimpan (mode simulasi)",
        data: { 
            id: Date.now(), 
            nama, 
            nim, 
            hari, 
            tanggal, 
            jam,
            status: status || "Hadir",
            note: "Database lokal sedang nonaktif untuk deployment"
        }
    });
});

// 2. REGISTER USER (Dummy untuk testing)
app.post("/api/register", (req, res) => {
    console.log("📥 API Register dipanggil");
    console.log("Nama:", req.body.nama);
    console.log("NIM:", req.body.nim);
    
    const { nama, nim, descriptor } = req.body;
    
    if (!nama || !nim) {
        return res.status(400).json({ 
            success: false, 
            message: "Nama dan NIM wajib diisi" 
        });
    }
    
    console.log(`✅ [SIMULASI] User registered: ${nama} (${nim})`);
    
    res.json({ 
        success: true, 
        message: `${nama} berhasil diregister (mode simulasi)`, 
        data: { 
            id: Date.now(), 
            nama, 
            nim,
            note: "Database lokal sedang nonaktif"
        }
    });
});

// 3. GET ALL USERS (Dummy data)
app.get("/api/users", (req, res) => {
    const dummyUsers = [
        { id: 1, nama: "Chelsea Islan", nim: "20210001" },
        { id: 2, nama: "Iqbaal Ramadhan", nim: "20210002" },
        { id: 3, nama: "Prilly Latuconsina", nim: "20210003" },
        { id: 4, nama: "Raffi Ahmad", nim: "20210004" },
        { id: 5, nama: "Nagita Slavina", nim: "20210005" }
    ];
    
    res.json({ 
        success: true, 
        data: dummyUsers,
        note: "Data dummy untuk testing deployment"
    });
});

// 4. GET ALL USERS WITH DESCRIPTORS (dummy)
app.get("/api/users/descriptors", (req, res) => {
    const dummyDescriptors = [
        { 
            id: 1, 
            nama: "Test User 1", 
            nim: "TEST001",
            descriptor: Array(128).fill(0.5)
        }
    ];
    
    res.json({ 
        success: true, 
        data: dummyDescriptors,
        count: 1,
        note: "Mode simulasi - database nonaktif"
    });
});

// 5. GET USER ABSENSI HISTORY (dummy)
app.get("/api/user/:nim/absensi", (req, res) => {
    const nim = req.params.nim;
    console.log("📥 Riwayat absensi untuk NIM:", nim);
    
    const dummyAbsensi = [
        {
            id: 1,
            nama: "Chelsea Islan",
            nim: nim,
            hari: "Senin",
            tanggal: new Date().toISOString().split('T')[0],
            jam: "08:30:00",
            status: "Hadir",
            user_nama: "Chelsea Islan"
        }
    ];
    
    res.json({ 
        success: true, 
        data: {
            absensi: dummyAbsensi,
            userInfo: { nama: "User Test", nim: nim }
        },
        note: "Data simulasi untuk testing"
    });
});

// 6. DELETE USER (dummy)
app.delete("/api/user/:id", (req, res) => {
    console.log(`🗑️ [SIMULASI] User dengan ID ${req.params.id} dihapus`);
    
    res.json({ 
        success: true, 
        message: "User berhasil dihapus (mode simulasi)" 
    });
});

// 7. GET STATISTICS (dummy)
app.get("/api/stats", (req, res) => {
    const dummyStats = {
        totalUsers: 5,
        totalAbsensi: 42,
        todayAbsensi: 3,
        recentAbsensi: [
            { nama: "Chelsea Islan", nim: "20210001", tanggal: "2024-12-11", jam: "08:30:00", status: "Hadir" },
            { nama: "Iqbaal Ramadhan", nim: "20210002", tanggal: "2024-12-11", jam: "08:45:00", status: "Hadir" },
            { nama: "Prilly Latuconsina", nim: "20210003", tanggal: "2024-12-10", jam: "09:15:00", status: "Terlambat" }
        ]
    };
    
    res.json({
        success: true,
        data: dummyStats,
        note: "Statistik dummy untuk testing"
    });
});

// =======================================
//     🏠 PAGE ROUTES - YANG HARUS DIPERBAIKI
// =======================================
// PERBAIKAN UTAMA: Semua file HTML ada di ROOT, bukan di public/

// 1. LANDING PAGE (Welcome)
app.get("/", (req, res) => {
    console.log("🌐 Serving: Welcome page");
    res.sendFile(path.join(__dirname, "welcome.html")); // HAPUS "public"
});

// 2. FACE SCAN PAGE (Absensi)
app.get("/scan", (req, res) => {
    console.log("🌐 Serving: Scan page");
    res.sendFile(path.join(__dirname, "scan.html")); // HAPUS "public"
});

// 3. REGISTER PAGE
app.get("/register", (req, res) => {
    console.log("🌐 Serving: Register page");
    res.sendFile(path.join(__dirname, "register.html")); // HAPUS "public"
});

// 4. STATUS PAGE - FIXED
app.get("/status", (req, res) => {
    console.log("🌐 Serving: Status page");
    res.sendFile(path.join(__dirname, "status.html")); // HAPUS "public"
});

// 5. DASHBOARD PAGE
app.get("/dashboard", (req, res) => {
    console.log("🌐 Serving: Dashboard page");
    res.sendFile(path.join(__dirname, "dashboard.html")); // HAPUS "public"
});

// 6. STATUS WITH PARAM - ALTERNATIVE
app.get("/status/:nim", (req, res) => {
    console.log("🌐 Serving: Status page for NIM:", req.params.nim);
    res.sendFile(path.join(__dirname, "status.html")); // Tetap kirim file HTML yang sama
});

// =======================================
//     📁 STATIC MODEL FILES
// =======================================
// Models folder untuk face-api.js
app.use('/models', express.static(path.join(__dirname, 'models')));

// Static files dari public (CSS, JS, gambar)
app.use('/public', express.static(path.join(__dirname, 'public')));

// =======================================
//     ❌ ERROR HANDLING
// =======================================

// 404 - Page Not Found
app.use((req, res) => {
    console.log("❌ 404 Not Found:", req.url);
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Halaman Tidak Ditemukan</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                h1 { color: #e74c3c; }
                a { color: #3498db; text-decoration: none; }
            </style>
        </head>
        <body>
            <h1>404 - Halaman Tidak Ditemukan</h1>
            <p>Halaman <strong>${req.url}</strong> tidak ditemukan.</p>
            <a href="/">🏠 Kembali ke Home</a>
        </body>
        </html>
    `);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err);
    res.status(500).json({ 
        success: false, 
        message: "Terjadi kesalahan internal server"
    });
});

// =======================================
//     🚀 START SERVER - YANG HARUS DIPERBAIKI
// =======================================
const PORT = process.env.PORT || 3000; // STANDAR PORT UNTUK VERCEL
app.listen(PORT, "0.0.0.0", () => {   // TAMBAHKAN "0.0.0.0"
    console.log("=".repeat(50));
    console.log("✅ SERVER BERHASIL DIJALANKAN");
    console.log("=".repeat(50));
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🌐 Homepage:     http://localhost:${PORT}`);
    console.log(`📸 Scan Wajah:   http://localhost:${PORT}/scan`);
    console.log(`👤 Register:     http://localhost:${PORT}/register`);
    console.log(`📊 Dashboard:    http://localhost:${PORT}/dashboard`);
    console.log(`📁 Models:       http://localhost:${PORT}/models/`);
    console.log("=".repeat(50));
    console.log("⚠️  MODE: DEPLOYMENT TEST (Database dinonaktifkan)");
    console.log("=".repeat(50));
});