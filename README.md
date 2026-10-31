# SIM-SPM | Aplikasi Supervisi Pembelajaran Mendalam
### SMA NEGERI 1 LENTENG SUMENEP

Aplikasi berbasis web untuk mendukung pelaksanaan Supervisi Akademik Pembelajaran Mendalam sesuai pedoman resmi **Modul Kepala Sekolah: Pelatihan Supervisi Pembelajaran Mendalam** (Lampiran 3, 4, 5, dan 6).

---

## 🌟 Fitur Utama
1. **📊 Dashboard & Rekapitulasi Supervisi:**
   - Ringkasan statistik capaian pendidik skala 0–100 & predikat mutu (*Sangat Baik, Baik, Cukup, Kurang*).
   - Analisis 5 pilar Pembelajaran Mendalam (Keselarasan, Kerangka PM, Pengalaman Belajar, Prinsip, Asesmen).
2. **🧭 Kerangka Supervisi (Lampiran 4):**
   - Matriks interaktif 4 Tahapan Supervisi (*Perencanaan, Pelaksanaan, Evaluasi Refleksi, RTL*) × 4 Dimensi Kerangka Pembelajaran (*Praktik Pedagogis, Kemitraan, Lingkungan Belajar, Pemanfaatan Digital*).
3. **📝 Telaah Perencanaan Pembelajaran (Lampiran 5):**
   - Penilaian dokumen modul ajar skala 0–4, komentar kritis, serta butir 16–18 (Kelebihan, Hal yang ditingkatkan, Rekomendasi PM & KKA).
   - Tombol *Bantu Isi Otomatis*.
4. **🔍 Observasi Pelaksanaan Pembelajaran (Lampiran 6):**
   - Penilaian praktik kelas skala 0–4, kolom Bukti Pembelajaran, Catatan supervisor, serta butir 16–18.
5. **📈 Analisis Hasil Supervisi:**
   - Analisis kesenjangan (*Gap Analysis*) antara Perencanaan vs Pelaksanaan.
   - Peta capaian 8 dimensi Pembelajaran Mendalam.
   - Pemetaan 4 Kuadran Pendampingan Kepala Sekolah (*PLC, Coaching, Pelatihan HOTS/KKA, Mentoring*).
   - Analisis diagnostik butir 1–15 & sintesis narasi otomatis.
6. **🎯 Evaluasi, Refleksi & RTL (Lampiran 3):**
   - Sinkronisasi data & skor, analisis penyebab, perbaikan spesifik, dan peran pendampingan KS.
7. **🤖 Asisten AI Supervisi:**
   - 5 Generator Cerdas: Dialog Coaching TIRTA, Umpan Balik Memuliakan, Desain CT & KKA, Generator Soal HOTS, dan Rekomendasi Kebijakan KS.
   - Konsultan Chat Interaktif dengan prompt cepat.
   - Mode AI Pakar Lokal (gratis & instan) + opsi Cloud Google Gemini API.
8. **📅 Manajemen Multi-Periode & Analisis Tren Komparatif:**
   - Mendukung arsip penilaian per semester/tahun pelajaran (misal: Semester Ganjil vs Semester Genap).
   - Pengalihan periode instan satu klik via bar navigasi atas.
   - Pembuatan periode baru dengan opsi salin daftar pendidik (dengan nilai bersih atau duplikasi baseline).
   - Analisis komparasi otomatis antar-periode: menghitung delta pertumbuhan mutu (+Poin), pendidik dengan progres tertinggi (*top improver*), dan status evaluasi kesiapan PLC/Coaching.
9. **🔥 Database Hybrid (LocalStorage + Cloud Firebase):**
   - Terintegrasi dengan Google Cloud Firestore / Realtime Database untuk sinkronisasi realtime multi-perangkat.
10. **🖨️ Cetak Laporan Resmi & Ekspor:**
   - Standar cetak A4 untuk Lampiran 3 (Bab A–H), Laporan Analisis, Lampiran 5, Lampiran 6, serta ekspor CSV & JSON.

---

## 🚀 Cara Menjalankan Secara Lokal
Cukup buka berkas `index.html` menggunakan browser apa saja (Google Chrome, Microsoft Edge, atau Mozilla Firefox). Tidak memerlukan instalasi server atau NodeJS.

---

## 🌐 Deploy ke GitHub Pages (Gratis & Online 24 Jam)
1. Buat repository baru di [GitHub](https://github.com/new) dengan nama `supervisi-pembelajaran-mendalam`.
2. Upload berkas: `index.html`, `styles.css`, `data.js`, `app.js`, dan `README.md`.
3. Buka menu **Settings > Pages** pada repository.
4. Pada bagian **Build and deployment > Branch**, pilih branch `main` lalu klik **Save**.
5. Tunggu sekitar 1–2 menit, aplikasi akan langsung online di URL:
   `https://<username-github>.github.io/supervisi-pembelajaran-mendalam/`
