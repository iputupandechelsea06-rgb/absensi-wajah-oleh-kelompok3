const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

// =======================================
//     ⚙️ MIDDLEWARE CONFIGURATION
// =======================================
app.use(cors());
app.use(express.json());
app.use(express.static("public", { index: false }));

// =======================================
//     🗄️ DATABASE CONNECTION
// =======================================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "absensi_wajah"
});

// Test koneksi database
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL database");
        createTablesIfNotExist();
    }
});

// Fungsi buat table otomatis
function createTablesIfNotExist() {
    // Table users
    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100) NOT NULL,
            nim VARCHAR(20) NOT NULL UNIQUE,
            face_descriptor TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    // Table absensi
    const absensiTable = `
        CREATE TABLE IF NOT EXISTS absensi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100),
            nim VARCHAR(20),
            hari VARCHAR(10),
            tanggal DATE,
            jam TIME,
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(usersTable, (err) => {
        if (err) console.error("❌ Gagal buat table users:", err);
        else console.log("✅ Table 'users' ready");
    });
    
    db.query(absensiTable, (err) => {
        if (err) console.error("❌ Gagal buat table absensi:", err);
        else console.log("✅ Table 'absensi' ready");
    });
}

// =======================================
//     🔥 API ROUTES
// =======================================

// 1. SIMPAN ABSENSI
app.post("/api/absen", (req, res) => {
    console.log("📥 API Absen dipanggil:", req.body.nama);
    
    const { nama, nim, status } = req.body;
    const date = new Date();
    const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const hari = hariList[date.getDay()];
    const tanggal = date.toISOString().split("T")[0];
    const jam = date.toTimeString().split(" ")[0];

    const sql = `INSERT INTO absensi (nama, nim, hari, tanggal, jam, status) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [nama, nim, hari, tanggal, jam, status || "Hadir"], (err, result) => {
        if (err) {
            console.error("❌ Gagal simpan absensi:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Gagal menyimpan absensi" 
            });
        }
        console.log("✅ Absensi tersimpan:", nama);
        res.json({ 
            success: true, 
            message: "Absensi disimpan",
            data: { id: result.insertId, nama, nim, hari, tanggal, jam }
        });
    });
});

// 2. REGISTER USER BARU + SIMPAN WAJAH
app.post("/api/register", (req, res) => {
    console.log("📥 API Register dipanggil");
    console.log("Nama:", req.body.nama);
    console.log("NIM:", req.body.nim);
    console.log("Descriptor length:", req.body.descriptor?.length);
    
    const { nama, nim, descriptor } = req.body;
    
    // Validasi
    if (!nama || !nim || !descriptor) {
        console.log("❌ Validation failed: missing fields");
        return res.status(400).json({ 
            success: false, 
            message: "Nama, NIM, dan descriptor wajib diisi" 
        });
    }
    
    // Cek panjang descriptor
    if (!Array.isArray(descriptor) || descriptor.length < 128) {
        console.log("❌ Descriptor validation failed. Length:", descriptor.length);
        return res.status(400).json({ 
            success: false, 
            message: `Descriptor length invalid: ${descriptor.length} (min 128)` 
        });
    }
    
    const sql = `INSERT INTO users (nama, nim, face_descriptor) VALUES (?, ?, ?)`;
    
    db.query(sql, [nama, nim, JSON.stringify(descriptor)], (err, result) => {
        if (err) {
            console.error("❌ Gagal register user:", err);
            
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: `NIM ${nim} sudah terdaftar` 
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                message: "Gagal register user" 
            });
        }
        
        console.log("✅ User registered:", nama);
        res.json({ 
            success: true, 
            message: `${nama} berhasil diregister`, 
            data: { 
                id: result.insertId, 
                nama, 
                nim 
            }
        });
    });
});

// 3. GET ALL USERS (hanya info)
app.get("/api/users", (req, res) => {
    const sql = `SELECT id, nama, nim FROM users ORDER BY nama`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Gagal ambil users:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Gagal ambil data user" 
            });
        }
        res.json({ 
            success: true, 
            data: results 
        });
    });
});

// 4. GET ALL USERS WITH DESCRIPTORS (untuk face matching)
app.get("/api/users/descriptors", (req, res) => {
    const sql = `SELECT id, nama, nim, face_descriptor FROM users`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Gagal ambil descriptors:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Gagal ambil descriptor user" 
            });
        }
        
        const users = results.map(user => ({
            id: user.id,
            nama: user.nama,
            nim: user.nim,
            descriptor: JSON.parse(user.face_descriptor)
        }));
        
        res.json({ 
            success: true, 
            data: users,
            count: users.length
        });
    });
});

// 5. GET USER ABSENSI HISTORY
app.get("/api/user/:nim/absensi", (req, res) => {
    const nim = req.params.nim;
    console.log("📥 Riwayat absensi untuk NIM:", nim);
    
    const sql = `
        SELECT a.*, u.nama as user_nama 
        FROM absensi a
        LEFT JOIN users u ON a.nim = u.nim
        WHERE a.nim = ? 
        ORDER BY a.tanggal DESC, a.jam DESC 
        LIMIT 100
    `;
    
    db.query(sql, [nim], (err, results) => {
        if (err) {
            console.error("❌ Gagal ambil riwayat absensi:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Gagal ambil riwayat absensi" 
            });
        }
        
        // Get user info
        const userSql = `SELECT nama, nim FROM users WHERE nim = ?`;
        db.query(userSql, [nim], (userErr, userResults) => {
            if (userErr || userResults.length === 0) {
                return res.json({ 
                    success: true, 
                    data: {
                        absensi: results,
                        userInfo: { nama: "User tidak ditemukan", nim: nim }
                    }
                });
            }
            
            res.json({ 
                success: true, 
                data: {
                    absensi: results,
                    userInfo: userResults[0]
                }
            });
        });
    });
});

// 6. DELETE USER
app.delete("/api/user/:id", (req, res) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error("❌ Gagal hapus user:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Gagal hapus user" 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "User tidak ditemukan" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "User berhasil dihapus" 
        });
    });
});

// 7. GET STATISTICS
app.get("/api/stats", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    const queries = {
        totalUsers: `SELECT COUNT(*) as count FROM users`,
        totalAbsensi: `SELECT COUNT(*) as count FROM absensi`,
        todayAbsensi: `SELECT COUNT(*) as count FROM absensi WHERE tanggal = ?`,
        recentAbsensi: `SELECT * FROM absensi ORDER BY created_at DESC LIMIT 5`
    };
    
    db.query(queries.totalUsers, (err1, usersResult) => {
        if (err1) {
            console.error("❌ Error stats:", err1);
            return res.status(500).json({ success: false, message: "Error mengambil stats" });
        }
        
        db.query(queries.totalAbsensi, (err2, absensiResult) => {
            if (err2) {
                console.error("❌ Error stats:", err2);
                return res.status(500).json({ success: false, message: "Error mengambil stats" });
            }
            
            db.query(queries.todayAbsensi, [today], (err3, todayResult) => {
                if (err3) {
                    console.error("❌ Error stats:", err3);
                    return res.status(500).json({ success: false, message: "Error mengambil stats" });
                }
                
                db.query(queries.recentAbsensi, (err4, recentResult) => {
                    if (err4) {
                        console.error("❌ Error stats:", err4);
                        return res.status(500).json({ success: false, message: "Error mengambil stats" });
                    }
                    
                    res.json({
                        success: true,
                        data: {
                            totalUsers: usersResult[0].count,
                            totalAbsensi: absensiResult[0].count,
                            todayAbsensi: todayResult[0].count,
                            recentAbsensi: recentResult
                        }
                    });
                });
            });
        });
    });
});

// =======================================
//     🏠 PAGE ROUTES (HTML FILES)
// =======================================

// 1. LANDING PAGE (Welcome)
app.get("/", (req, res) => {
    console.log("🌐 Serving: Welcome page");
    res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

// 2. FACE SCAN PAGE (Absensi)
app.get("/scan", (req, res) => {
    console.log("🌐 Serving: Scan page");
    res.sendFile(path.join(__dirname, "public", "scan.html"));
});

// 3. REGISTER PAGE
app.get("/register", (req, res) => {
    console.log("🌐 Serving: Register page");
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// 4. STATUS PAGE
app.get("/status/:nim", (req, res) => {
    console.log("🌐 Serving: Status page for NIM:", req.params.nim);
    res.sendFile(path.join(__dirname, "public", "status.html"));
});

// 5. DASHBOARD PAGE
app.get("/dashboard", (req, res) => {
    console.log("🌐 Serving: Dashboard page");
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// =======================================
//     📁 STATIC MODEL FILES
// =======================================
// Models folder untuk face-api.js
app.use('/models', express.static(path.join(__dirname, 'models')));

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
//     🚀 START SERVER
// =======================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log("✅ SERVER BERHASIL DIJALANKAN");
    console.log("=".repeat(50));
    console.log(`🌐 Homepage:     http://localhost:${PORT}`);
    console.log(`📸 Scan Wajah:   http://localhost:${PORT}/scan`);
    console.log(`👤 Register:     http://localhost:${PORT}/register`);
    console.log(`📊 Dashboard:    http://localhost:${PORT}/dashboard`);
    console.log(`📁 Models:       http://localhost:${PORT}/models/`);
    console.log("=".repeat(50));
    console.log("🗄️  Database:", db.config.database);
    console.log("👤 MySQL User:", db.config.user);
    console.log("=".repeat(50));
});