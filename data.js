// Data & Instrumen Resmi berdasarkan Modul KS: Pelatihan Supervisi Pembelajaran Mendalam
// Lampiran 3, Lampiran 4, Lampiran 5, dan Lampiran 6

const SCALE_LABELS = {
  0: { label: "Tidak Ada", short: "0 - Tidak Ada", badge: "scale-0" },
  1: { label: "Sangat Kurang", short: "1 - Sangat Kurang", badge: "scale-1" },
  2: { label: "Kurang", short: "2 - Kurang", badge: "scale-2" },
  3: { label: "Baik", short: "3 - Baik", badge: "scale-3" },
  4: { label: "Sangat Baik", short: "4 - Sangat Baik", badge: "scale-4" }
};

// Lampiran 4: Tahapan Supervisi Akademik Sesuai Kerangka Pembelajaran (Hal. 70)
const LAMPIRAN_4_MATRIX = [
  {
    id: "perencanaan",
    tahap: "1. Perencanaan",
    badgeColor: "blue",
    praktikPedagogis:
      "Menyusun instrumen observasi yang fokus pada strategi active learning dan kemampuan berpikir kritis (HOTS).",
    kemitraanPembelajaran:
      "Mendiskusikan fokus observasi bersama guru secara setara (bukan top-down) untuk membangun kepercayaan.",
    lingkunganPembelajaran:
      "Merancang penataan kelas yang fleksibel untuk mendukung kolaborasi antar siswa.",
    pemanfaatanDigital:
      "Menentukan alat bantu digital (LMS, aplikasi interaktif) yang akan digunakan untuk mendukung tujuan pembelajaran."
  },
  {
    id: "pelaksanaan",
    tahap: "2. Pelaksanaan",
    badgeColor: "emerald",
    praktikPedagogis:
      "Mengamati bagaimana guru memfasilitasi inkuiri dan memberikan umpan balik yang mendorong pemahaman mendalam.",
    kemitraanPembelajaran:
      "Supervisor mengamati interaksi antara guru dan siswa, serta bagaimana agensi siswa (suara dan pilihan) difasilitasi di kelas.",
    lingkunganPembelajaran:
      "Mengamati apakah suasana kelas aman secara psikis sehingga siswa berani mengambil risiko dan bertanya.",
    pemanfaatanDigital:
      "Meninjau efektivitas penggunaan teknologi dalam meningkatkan keterlibatan siswa, bukan sekadar mengganti kertas ke layar."
  },
  {
    id: "evaluasi_refleksi",
    tahap: "3. Evaluasi Refleksi",
    badgeColor: "amber",
    praktikPedagogis:
      "Menganalisis data observasi untuk melihat sejauh mana siswa mencapai kompetensi 6C (Character, Citizenship, Collaboration, etc).",
    kemitraanPembelajaran:
      "Melakukan refleksi bersama (dialog pasca-observasi) untuk merencanakan pengembangan diri guru secara berkelanjutan.",
    lingkunganPembelajaran:
      "Mengevaluasi apakah budaya kelas sudah mendukung komunitas belajar yang inklusif dan suportif.",
    pemanfaatanDigital:
      "Mengidentifikasi kebutuhan pelatihan digital lebih lanjut atau penggunaan alat baru yang lebih relevan untuk materi mendatang."
  },
  {
    id: "rtl",
    tahap: "4. Rencana Tindak Lanjut",
    badgeColor: "purple",
    praktikPedagogis:
      "Penyusunan rencana pengembangan profesi (micro-teaching atau pelatihan) untuk memperkuat strategi pedagogi baru.",
    kemitraanPembelajaran:
      "Membangun komunitas belajar antar guru (PLC) untuk saling berbagi praktik baik hasil dari supervisi.",
    lingkunganPembelajaran:
      "Mengembangkan budaya sekolah yang konsisten dalam menciptakan lingkungan belajar yang aman, nyaman, dan berpihak pada murid.",
    pemanfaatanDigital:
      "Eksplorasi teknologi baru atau pendalaman fitur digital yang belum optimal berdasarkan hasil temuan di kelas."
  }
];

// Lampiran 5: Instrumen Telaah Perencanaan Pembelajaran (Hal. 71 - 74)
const LAMPIRAN_5_ITEMS = [
  {
    no: 1,
    kategori: "Keselarasan",
    aspek:
      "Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah mengarah pada pencapaian Dimensi Profil Lulusan",
    subItems: []
  },
  {
    no: 2,
    kategori: "Keselarasan",
    aspek:
      "Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah selaras",
    subItems: []
  },
  {
    no: 3,
    kategori: "Kerangka Pembelajaran",
    aspek:
      "Praktik pedagogis yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran",
    subItems: []
  },
  {
    no: 4,
    kategori: "Kerangka Pembelajaran",
    aspek:
      "Lingkungan belajar yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran",
    subItems: []
  },
  {
    no: 5,
    kategori: "Kerangka Pembelajaran",
    aspek:
      "Kemitraan pembelajaran yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran",
    subItems: []
  },
  {
    no: 6,
    kategori: "Kerangka Pembelajaran",
    aspek:
      "Pemanfaatan digital yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran",
    subItems: []
  },
  {
    no: 7,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEMAHAMI (terlibat aktif mengonstruksi pengetahuan agar dapat memahami secara mendalam konsep atau materi dari berbagai sumber dan konteks).",
    subItems: [
      "a. Menghubungkan pengetahuan baru dengan pengetahuan sebelumnya",
      "b. Menstimulasi proses berpikir murid",
      "c. Menghubungkan dengan konteks nyata dan/atau kehidupan sehari-hari",
      "d. Memberikan kebebasan eksploratif dan kolaboratif",
      "e. Menanamkan nilai-nilai moral dan etika dan nilai positif lainnya",
      "f. Mengaitkan pembelajaran dengan pembentukan karakter murid"
    ]
  },
  {
    no: 8,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MENGAPLIKASI (mengaplikasi pemahaman secara kontekstual dalam kehidupan nyata sebagai bagian dari pendalaman pengetahuan)",
    subItems: [
      "a. Menghubungkan konsep baru dengan pengetahuan sebelumnya.",
      "b. Menerapkan pengetahuan ke dalam situasi nyata atau bidang lain.",
      "c. Mengembangkan pemahaman dengan eksplorasi lebih lanjut.",
      "d. Berpikir Kritis dan mencari solusi inovatif berdasarkan pengetahuan yang ada."
    ]
  },
  {
    no: 9,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEREFLEKSI (mengevaluasi dan memaknai proses serta hasil dari tindakan atau praktik nyata yang telah mereka lakukan dan menentukan tindaklanjut ke depan; serta mengelola proses belajarnya secara mandiri).",
    subItems: [
      "a. Memotivasi diri sendiri untuk terus belajar bagaimana cara belajar",
      "b. Refleksi terhadap pencapaian tujuan pembelajaran (evaluasi diri)",
      "c. Menerapkan strategi berpikir",
      "d. Memiliki kemampuan metakognisi (meregulasi diri dalam pembelajaran)",
      "e. Meregulasi emosi dalam pembelajaran"
    ]
  },
  {
    no: 10,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Langkah perencanaan pembelajaran dapat memfasilitasi tindakan saling MEMULIAKAN antara pendidik-Murid, Murid-pendidik, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal",
    subItems: []
  },
  {
    no: 11,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Prinsip pembelajaran mendalam berupa berkesadaran, bermakna, dan/atau menggembirakan sudah tergambar pada setiap pengalaman belajar di langkah pembelajaran",
    subItems: []
  },
  {
    no: 12,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Perencanaan pembelajaran sudah mengakomodir pengalaman belajar yang sesuai dengan karakteristik peserta didik",
    subItems: []
  },
  {
    no: 13,
    kategori: "Asesmen",
    aspek:
      "Asesmen pada awal pembelajaran telah dilaksanakan untuk mendapatkan bukti kesiapan belajar secara emosional dan mental, pengetahuan awal, dan kebutuhan belajar murid",
    subItems: []
  },
  {
    no: 14,
    kategori: "Asesmen",
    aspek:
      "Asesmen selama Proses Pembelajaran telah dilaksanakan sesuai perencanaan untuk memantau perkembangan belajar murid, memberikan umpan balik untuk perbaikan kontinyu (baik dari pendidik ke murid, maupun dari murid ke pendidik), melalui beragam teknik",
    subItems: []
  },
  {
    no: 15,
    kategori: "Asesmen",
    aspek:
      "Asesmen hasil Pembelajaran direncanakan untuk mengukur pencapaian kompetensi sebagai bukti keberhasilan pembelajaran dengan beragam cara, antara lain: tes, portofolio, proyek, presentasi, dsb.",
    subItems: []
  }
];

// Lampiran 6: Instrumen Observasi Pelaksanaan Pembelajaran (Hal. 75 - 82)
const LAMPIRAN_6_ITEMS = [
  {
    no: 1,
    kategori: "Keselarasan",
    aspek: "Apakah implementasi pembelajaran selaras dengan perencanaan?",
    subItems: [
      "a. awal pembelajaran",
      "b. inti pembelajaran dalam proses memahami, mengaplikasi, dan merefleksi",
      "c. penutupan pembelajaran"
    ]
  },
  {
    no: 2,
    kategori: "Keselarasan",
    aspek:
      "Apakah upaya mencapai tujuan pembelajaran menuju pencapaian dimensi profil lulusan selaras dengan perencanaan pembelajaran dan disesuaikan dengan konteks kebutuhan belajar siswa?",
    subItems: []
  },
  {
    no: 3,
    kategori: "Implementasi Kerangka Pembelajaran",
    aspek:
      "Strategi pembelajaran — Apakah kegiatan pembelajaran dan/atau asesmen pembelajaran menggambarkan: a. Praktik pedagogis",
    deskripsiTambahan:
      "(Fokus pada pengalaman belajar peserta didik yang autentik, mengutamakan praktik nyata, mendorong keterampilan berpikir tingkat tinggi dan kolaborasi)",
    subItems: []
  },
  {
    no: 4,
    kategori: "Implementasi Kerangka Pembelajaran",
    aspek: "b. Lingkungan belajar",
    deskripsiTambahan:
      "(Membentuk hubungan yang dinamis antara pendidik, peserta didik, orang tua, komunitas, dan mitra profesional. Pendekatan ini memindahkan kontrol pembelajaran dari pendidik saja menjadi kolaborasi bersama)",
    subItems: []
  },
  {
    no: 5,
    kategori: "Implementasi Kerangka Pembelajaran",
    aspek: "c. Kemitraan pembelajaran",
    deskripsiTambahan:
      "(Menekankan integrasi antara ruang fisik, ruang virtual, dan budaya belajar sebagai tempat yang mendorong kolaborasi, refleksi, eksplorasi, dan berbagi ide, sehingga dapat mengakomodasi berbagai gaya belajar peserta didik dengan optimal.)",
    subItems: []
  },
  {
    no: 6,
    kategori: "Implementasi Kerangka Pembelajaran",
    aspek: "d. Pemanfaatan digital",
    deskripsiTambahan:
      "(Menciptakan pembelajaran dan menyediakan sumber belajar yang lebih interaktif, kolaboratif, dan kontekstual)",
    subItems: []
  },
  {
    no: 7,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Apakah langkah pembelajaran memfasilitasi tindakan saling MEMULIAKAN antara pendidik-Murid, Murid-pendidik, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal?",
    deskripsiTambahan:
      "(memuliakan dapat dimaknai sebagai pelayanan pembelajaran yang menghargai keberagaman, menjunjung keseimbangan gender, serta memberikan kesempatan yang sama bagi seluruh murid tanpa membedakan agama, suku, maupun jenis kelamin, termasuk murid penyandang disabilitas)",
    subItems: []
  },
  {
    no: 8,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Apakah langkah pembelajaran memfasilitasi murid untuk MEMAHAMI? MEMAHAMI mendorong murid terlibat aktif mengkonstruksi pengetahuan agar dapat memahami secara mendalam konsep atau materi dari berbagai sumber dan konteks, mis. melalui:",
    subItems: [
      "a. Menghubungkan pengetahuan baru dengan pengetahuan sebelumnya",
      "b. Menstimulasi proses berpikir murid",
      "c. Menghubungkan dengan konteks nyata dan/atau kehidupan sehari-hari",
      "d. Memberikan kebebasan eksploratif dan kolaboratif",
      "e. Mengkonstruksi pemahaman melalui pengalaman nyata",
      "f. Menanamkan nilai-nilai moral dan etika dan nilai positif lainnya",
      "g. Mengaitkan pembelajaran dengan pembentukan karakter murid"
    ]
  },
  {
    no: 9,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Apakah langkah pembelajaran memfasilitasi murid untuk MENGAPLIKASI? MENGAPLIKASI pemahaman secara kontekstual dalam kehidupan nyata sebagai bagian dari pendalaman pengetahuan, mis. melalui:",
    subItems: [
      "e. Menghubungkan konsep baru dengan pengetahuan sebelumnya.",
      "f. Menerapkan pengetahuan ke dalam situasi nyata atau bidang lain.",
      "g. Melakukan praktik pemecahan masalah/isu yang kontekstual dalam kehidupan",
      "h. Mengembangkan pemahaman dengan eksplorasi lebih lanjut.",
      "i. Berpikir kritis, menghubungkan ide-ide, dan mencari solusi inovatif berdasarkan pengetahuan yang ada"
    ]
  },
  {
    no: 10,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Apakah langkah pembelajaran memfasilitasi murid untuk MEREFLEKSI? MEREFLEKSI merupakan proses evaluasi dan memaknai proses serta hasil dari tindakan atau praktik nyata yang telah mereka lakukan dan menentukan tindaklanjut ke depan; serta mengelola proses belajarnya secara mandiri, misalnya melalui:",
    subItems: [
      "a. Memotivasi diri sendiri untuk terus belajar bagaimana cara belajar",
      "b. Refleksi terhadap pencapaian tujuan pembelajaran (evaluasi diri)",
      "c. Menerapkan strategi berpikir",
      "d. Memiliki kemampuan metakognisi (meregulasi diri dalam pembelajaran)",
      "e. Meregulasi emosi dalam pembelajaran"
    ]
  },
  {
    no: 11,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Apakah pembelajaran menerapkan prinsip berkesadaran, bermakna, dan/atau menggembirakan?",
    deskripsiTambahan:
      "(Prinsip tergambar pada setiap pengalaman belajar melalui langkah pembelajaran yang diimplementasikan)",
    subItems: []
  },
  {
    no: 12,
    kategori: "Langkah Pembelajaran",
    aspek:
      "Apakah pembelajaran mengakomodir pengalaman belajar yang sesuai dengan karakteristik peserta didik?",
    deskripsiTambahan:
      "(Karakteristik mencakup umur, tingkat perkembangan, kemampuan, bakat dan minat, gaya belajar, dll.)",
    subItems: []
  },
  {
    no: 13,
    kategori: "Asesmen",
    aspek: "Apakah pendidik melaksanakan asesmen awal pembelajaran?",
    deskripsiTambahan:
      "(Asesmen untuk mendapatkan bukti kesiapan belajar secara emosional dan mental, pengetahuan awal, dan kebutuhan belajar murid)",
    subItems: []
  },
  {
    no: 14,
    kategori: "Asesmen",
    aspek:
      "Apakah pendidik melakukan asesmen selama pembelajaran melalui beragam teknik?",
    deskripsiTambahan:
      "(Asesmen selama pembelajaran untuk memantau perkembangan belajar murid, memberikan umpan balik untuk perbaikan berkelanjutan baik dari pendidik ke murid, maupun dari murid ke pendidik)",
    subItems: []
  },
  {
    no: 15,
    kategori: "Asesmen",
    aspek:
      "Apakah pendidik melakukan asesmen hasil pembelajaran untuk mengukur pencapaian kompetensi?",
    deskripsiTambahan:
      "(Asesmen hasil pembelajaran sebagai bukti keberhasilan pembelajaran melalui beragam cara: tes, portofolio, proyek, presentasi, dsb.)",
    subItems: []
  }
];

// Data Awal Sesuai Lampiran 3 Modul KS (Hal. 67 - 69)
const DEFAULT_INITIAL_TEACHERS = [
  {
    id: "guru-1",
    nama: "Ibu Ani",
    nip: "19840310 201001 2 012",
    kelasMapel: "Kelas X / Biologi",
    tanggalSupervisi: "2025-10-15",
    fokusMasalah: "keterlibatan murid rendah",
    telaah: {
      scores: {
        1: 3, 2: 3, 3: 2, 4: 3, 5: 2,
        6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
        11: 2, 12: 3, 13: 3, 14: 3, 15: 3
      },
      comments: {
        3: "Strategi active learning dalam RPP masih didominasi penjelasan satu arah.",
        5: "Kolaborasi antar murid perlu diperjelas skenarionya.",
        11: "Unsur menggembirakan dan keaktifan murid perlu diperkuat."
      },
      kelebihan:
        "Tujuan pembelajaran, langkah, dan asesmen awal hingga akhir sudah tersusun rapi dan selaras dengan Dimensi Profil Lulusan.",
      perluDitingkatkan:
        "Variasi aktivitas diskusi kelompok dan pemantik berpikir aktif murid dalam modul ajar masih kurang.",
      rekomendasi:
        "Merevisi langkah kegiatan inti dengan menambahkan diskusi kelompok kolaboratif, ice breaking terarah, dan pertanyaan terbuka sesuai prinsip Pembelajaran Mendalam (PM)."
    },
    observasi: {
      scores: {
        1: 3, 2: 3, 3: 2, 4: 2, 5: 2,
        6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
        11: 2, 12: 3, 13: 3, 14: 3, 15: 4
      },
      bukti: {
        1: "Guru membuka, memfasilitasi kegiatan inti, dan menutup pembelajaran sesuai alur.",
        3: "Guru menyampaikan materi menggunakan slide namun masih dominan ceramah.",
        4: "Kontrol pembelajaran masih berpusat pada guru.",
        7: "Guru menyapa dan menghargai seluruh pendapat murid dengan bahasa santun.",
        15: "Evaluasi akhir menggunakan lembar kerja dan kuis singkat."
      },
      catatan: {
        3: "Perlu mengurangi porsi ceramah dan memperbanyak inkuiri siswa.",
        4: "Berikan ruang diskusi antar murid lebih luas.",
        11: "Beberapa murid tampak pasif di pertengahan jam pelajaran."
      },
      kelebihan:
        "Pengelolaan waktu, sikap memuliakan murid, dan pelaksanaan asesmen berjalan tertib.",
      perluDitingkatkan:
        "Keterlibatan aktif murid selama kegiatan inti masih rendah karena metode pembelajaran kurang variatif.",
      rekomendasi:
        "Menerapkan diskusi kelompok, ice breaking, serta pertanyaan pemantik terbuka untuk meningkatkan keaktifan murid sesuai prinsip PM dan KKA."
    },
    rtl: {
      hasilEvaluasiManual: "Skor 70 (cukup), keterlibatan murid rendah",
      refleksiPenyebab: "Aktivitas pembelajaran kurang variatif, dominan ceramah",
      tindakLanjut: "Menerapkan diskusi kelompok, ice breaking, dan pertanyaan terbuka",
      peranKepsek: "Coaching & modeling pembelajaran aktif",
      waktu: "2 minggu (akhir April 2026)",
      statusRtl: "Terjadwal"
    }
  },
  {
    id: "guru-2",
    nama: "Bapak Budi",
    nip: "19810722 200902 1 004",
    kelasMapel: "Kelas XI / Matematika",
    tanggalSupervisi: "2025-10-18",
    fokusMasalah: "belum kontekstual",
    telaah: {
      scores: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3,
        6: 3, 7: 3, 8: 2, 9: 3, 10: 3,
        11: 3, 12: 3, 13: 3, 14: 3, 15: 3
      },
      comments: {
        8: "Langkah mengaplikasi masih berupa latihan soal tekstual di buku paket, belum dikaitkan dengan masalah nyata."
      },
      kelebihan:
        "Struktur modul ajar sangat sistematis, asesmen formatif dan sumatif terencana dengan baik.",
      perluDitingkatkan:
        "Pengaitan materi dengan situasi nyata dalam kehidupan sehari-hari murid (pengalaman Mengaplikasi).",
      rekomendasi:
        "Menambahkan skenario pemecahan masalah kontekstual (Problem-Based Learning sederhana) pada rencana pembelajaran sesuai prinsip PM."
    },
    observasi: {
      scores: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3,
        6: 3, 7: 4, 8: 3, 9: 2, 10: 3,
        11: 3, 12: 3, 13: 3, 14: 3, 15: 2
      },
      bukti: {
        7: "Interaksi guru dan murid sangat positif dan inklusif.",
        8: "Murid aktif menjawab pertanyaan konsep dasar.",
        9: "Murid mengerjakan soal hitungan abstrak tanpa studi kasus kehidupan sehari-hari."
      },
      catatan: {
        9: "Contoh kasus perlu diambil dari lingkungan sekitar murid agar lebih bermakna."
      },
      kelebihan:
        "Komunikasi kelas hidup, murid antusias dan merasa dihargai saat bertanya.",
      perluDitingkatkan:
        "Pembelajaran belum dikaitkan secara langsung dengan konteks kehidupan nyata murid.",
      rekomendasi:
        "Menerapkan pembelajaran kontekstual berbasis masalah sederhana di lingkungan sekolah/rumah."
    },
    rtl: {
      hasilEvaluasiManual: "Skor 73 (baik), belum kontekstual",
      refleksiPenyebab: "Pembelajaran belum dikaitkan dengan kehidupan nyata",
      tindakLanjut: "Menerapkan pembelajaran kontekstual berbasis masalah sederhana",
      peranKepsek: "Pendampingan penyusunan skenario kontekstual",
      waktu: "2 minggu (akhir April 2026)",
      statusRtl: "Dalam Proses"
    }
  },
  {
    id: "guru-3",
    nama: "Ibu Citra",
    nip: "19881105 201403 2 007",
    kelasMapel: "Kelas XII / Bahasa Indonesia",
    tanggalSupervisi: "2025-10-22",
    fokusMasalah: "asesmen masih LOTS",
    telaah: {
      scores: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3,
        6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
        11: 3, 12: 3, 13: 3, 14: 2, 15: 2
      },
      comments: {
        14: "Instrumen asesmen proses belum memuat rubrik berpikir kritis.",
        15: "Butir soal evaluasi hasil pembelajaran masih didominasi ingatan/pemahaman dasar (LOTS)."
      },
      kelebihan:
        "Langkah memahami, mengaplikasi, dan merefleksi sudah dirancang dengan aktivitas kolaboratif yang menarik.",
      perluDitingkatkan:
        "Kualitas instrumen asesmen formatif dan sumatif masih berada pada level LOTS.",
      rekomendasi:
        "Menyusun kisi-kisi soal berbasis HOTS (analisis, evaluasi, kreasi) beserta rubrik penilaian autentik."
    },
    observasi: {
      scores: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3,
        6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
        11: 3, 12: 3, 13: 3, 14: 2, 15: 2
      },
      bukti: {
        8: "Murid berdiskusi menganalisis teks bacaan dalam kelompok.",
        14: "Pertanyaan lisan dan tertulis saat asesmen hanya menanyakan informasi tersurat (apa, siapa, kapan).",
        15: "Tes akhir berupa soal pilihan ganda level C1-C2."
      },
      catatan: {
        14: "Umpan balik perlu diarahkan untuk menstimulasi penalaran kritis murid.",
        15: "Perlu penguatan penyusunan soal HOTS dan rubrik penilaian proyek/unjuk kerja."
      },
      kelebihan:
        "Fasilitasi kelas dan kemitraan belajar antar murid sudah berjalan baik dan kondusif.",
      perluDitingkatkan:
        "Asesmen proses dan hasil pembelajaran belum mengukur keterampilan berpikir tingkat tinggi (HOTS).",
      rekomendasi:
        "Mengikuti pelatihan terarah dan review bersama penyusunan soal HOTS serta rubrik sederhana."
    },
    rtl: {
      hasilEvaluasiManual: "Skor 72 (baik), asesmen masih LOTS",
      refleksiPenyebab: "Belum memahami penyusunan soal HOTS",
      tindakLanjut: "Menyusun soal HOTS dan rubrik sederhana",
      peranKepsek: "Pelatihan dan review soal bersama",
      waktu: "1 minggu (akhir April 2026)",
      statusRtl: "Selesai"
    }
  },
  {
    id: "guru-4",
    nama: "Bapak Dedi",
    nip: "19900218 201903 1 009",
    kelasMapel: "Kelas X / Informatika & KKA",
    tanggalSupervisi: "2025-10-25",
    fokusMasalah: "belum ada KKA",
    telaah: {
      scores: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3,
        6: 2, 7: 3, 8: 2, 9: 2, 10: 3,
        11: 3, 12: 3, 13: 3, 14: 3, 15: 2
      },
      comments: {
        6: "Pemanfaatan digital baru sebatas menampilkan tayangan statis, belum mengintegrasikan Koding dan Kecerdasan Artifisial (KKA) / Berpikir Komputasional.",
        8: "Aktivitas pemecahan masalah algoritmik/komputasional sederhana belum tampak."
      },
      kelebihan:
        "Kesiapan dokumen perencanaan baik dan mengakomodasi keberagaman karakteristik peserta didik.",
      perluDitingkatkan:
        "Integrasi aktivitas Berpikir Komputasional (Computational Thinking) dan literasi KKA dalam langkah pembelajaran.",
      rekomendasi:
        "Merevisi modul ajar dengan menyisipkan aktivitas berpikir komputasional (dekomposisi, pengenalan pola, abstraksi, algoritma) sesuai prinsip PM dan KKA."
    },
    observasi: {
      scores: {
        1: 3, 2: 3, 3: 2, 4: 3, 5: 3,
        6: 2, 7: 3, 8: 3, 9: 2, 10: 2,
        11: 3, 12: 3, 13: 3, 14: 3, 15: 3
      },
      bukti: {
        6: "Menggunakan proyektor hanya untuk memindahkan teks buku ke layar.",
        9: "Belum ada aktivitas pengurutan langkah logis (algoritma/CT) dalam pemecahan masalah."
      },
      catatan: {
        6: "Teknologi perlu digunakan secara interaktif dan mendukung konsep CT/KKA.",
        9: "Latih murid memecah masalah kompleks menjadi langkah-langkah terstruktur (unplugged/plugged coding)."
      },
      kelebihan:
        "Suasana kelas aman secara psikis dan murid berani mengajukan pertanyaan.",
      perluDitingkatkan:
        "Pemahaman dan penerapan konsep Computational Thinking (CT) serta integrasi KKA dalam pembelajaran.",
      rekomendasi:
        "Mengintegrasikan aktivitas berpikir komputasional sederhana (unplugged maupun digital) melalui coaching dan contoh praktik KKA."
    },
    rtl: {
      hasilEvaluasiManual: "Skor 68 (cukup), belum ada KKA",
      refleksiPenyebab: "Belum memahami konsep CT dan KKA",
      tindakLanjut: "Mengintegrasikan aktivitas berpikir komputasional sederhana",
      peranKepsek: "Coaching & contoh praktik KKA",
      waktu: "2 minggu (awal Mei 2026)",
      statusRtl: "Terjadwal"
    }
  }
];

const DEFAULT_SCHOOL_INFO = {
  namaSekolah: "SMA NEGERI 1 LENTENG SUMENEP",
  tahunPelajaran: "2025/2026",
  semester: "Semester Ganjil",
  kepalaSekolah: "Anik Rahmawati, M.Pd.",
  nipKepalaSekolah: "19780512 200501 2 008",
  kotaLaporan: "Sumenep",
  tanggalLaporan: "30 April 2026",
  latarBelakang:
    "Supervisi akademik yang telah dilaksanakan tidak berhenti pada observasi dan pemberian umpan balik, tetapi perlu ditindaklanjuti melalui evaluasi, refleksi, dan tindak lanjut agar memberikan dampak nyata terhadap peningkatan kualitas pembelajaran.\nBerdasarkan laporan pelaksanaan supervisi akademik, masih ditemukan kesenjangan dalam praktik pembelajaran, khususnya pada keterlibatan murid, pembelajaran kontekstual, asesmen berbasis HOTS, serta integrasi Koding dan Kecerdasan Artifisial (KKA).\nOleh karena itu, diperlukan program evaluasi, refleksi, dan tindak lanjut yang berbasis data, reflektif, dan berkelanjutan.",
  sasaran:
    "Seluruh guru SMA Negeri 1 Lenteng Sumenep berdasarkan hasil supervisi akademik.",
  simpulan:
    "Hasil evaluasi menunjukkan bahwa pembelajaran sudah berjalan dengan baik, namun masih perlu penguatan pada keterlibatan murid, pembelajaran kontekstual, asesmen HOTS, dan integrasi KKA. Melalui refleksi berbasis data, diperoleh pemahaman bahwa permasalahan utama terletak pada strategi pembelajaran dan pemahaman guru terhadap Pembelajaran Mendalam. Tindak lanjut difokuskan pada perbaikan spesifik melalui coaching, pendampingan, dan pelatihan yang berkelanjutan.",
  penutup:
    "Program evaluasi, refleksi, dan tindak lanjut ini disusun untuk memastikan bahwa supervisi akademik tidak berhenti pada kegiatan observasi, tetapi berlanjut pada perbaikan nyata dalam pembelajaran.\nMelalui pendekatan berbasis data, reflektif, dan berkelanjutan, diharapkan kualitas pembelajaran meningkat dan berdampak pada pengalaman belajar murid yang lebih bermakna, berkesadaran, dan menggembirakan."
};

const DEFAULT_MATRIX_CHECKLIST = {
  perencanaan_praktikPedagogis: true,
  perencanaan_kemitraanPembelajaran: true,
  perencanaan_lingkunganPembelajaran: true,
  perencanaan_pemanfaatanDigital: true,
  pelaksanaan_praktikPedagogis: true,
  pelaksanaan_kemitraanPembelajaran: true,
  pelaksanaan_lingkunganPembelajaran: true,
  pelaksanaan_pemanfaatanDigital: true,
  evaluasi_refleksi_praktikPedagogis: true,
  evaluasi_refleksi_kemitraanPembelajaran: true,
  evaluasi_refleksi_lingkunganPembelajaran: true,
  evaluasi_refleksi_pemanfaatanDigital: false,
  rtl_praktikPedagogis: true,
  rtl_kemitraanPembelajaran: false,
  rtl_lingkunganPembelajaran: true,
  rtl_pemanfaatanDigital: false
};

const DEFAULT_APP_STATE = {
  activePeriodId: "periode-2025-2026-ganjil",
  schoolInfo: JSON.parse(JSON.stringify(DEFAULT_SCHOOL_INFO)),
  matrixChecklist: JSON.parse(JSON.stringify(DEFAULT_MATRIX_CHECKLIST)),
  teachers: JSON.parse(JSON.stringify(DEFAULT_INITIAL_TEACHERS)),
  periods: [
    {
      id: "periode-2025-2026-ganjil",
      nama: "T.P. 2025/2026 - Semester Ganjil",
      tahunPelajaran: "2025/2026",
      semester: "Semester Ganjil",
      tanggalLaporan: "15 Desember 2025",
      catatan: "Supervisi Siklus 1 (Baseline & Diagnosis Awal)",
      schoolInfo: JSON.parse(JSON.stringify(DEFAULT_SCHOOL_INFO)),
      matrixChecklist: JSON.parse(JSON.stringify(DEFAULT_MATRIX_CHECKLIST)),
      teachers: JSON.parse(JSON.stringify(DEFAULT_INITIAL_TEACHERS))
    },
    {
      id: "periode-2025-2026-genap",
      nama: "T.P. 2025/2026 - Semester Genap",
      tahunPelajaran: "2025/2026",
      semester: "Semester Genap",
      tanggalLaporan: "30 April 2026",
      catatan: "Supervisi Siklus 2 (Pasca-Pendampingan & Evaluasi Dampak)",
      schoolInfo: {
        ...DEFAULT_SCHOOL_INFO,
        semester: "Semester Genap",
        tanggalLaporan: "30 April 2026"
      },
      matrixChecklist: {
        ...DEFAULT_MATRIX_CHECKLIST,
        evaluasi_refleksi_pemanfaatanDigital: true,
        rtl_pemanfaatanDigital: true,
        rtl_kemitraanPembelajaran: true
      },
      teachers: [
        {
          id: "guru-genap-1",
          nama: "Ibu Ani",
          nip: "19840310 201001 2 012",
          kelasMapel: "Kelas X / Biologi",
          tanggalSupervisi: "2026-04-10",
          fokusMasalah: "peningkatan diskusi inkuiri murid",
          telaah: {
            scores: { 1: 4, 2: 4, 3: 3, 4: 4, 5: 3, 6: 3, 7: 4, 8: 3, 9: 3, 10: 4, 11: 3, 12: 4, 13: 4, 14: 3, 15: 4 },
            comments: { 3: "Skenario diskusi kelompok interaktif sudah tergambar sangat baik." },
            kelebihan: "Peningkatan signifikan pada rancangan aktivitas active learning.",
            perluDitingkatkan: "Eksplorasi pemanfaatan augmented reality biologi.",
            rekomendasi: "Lanjutkan praktik baik pada semester berikutnya."
          },
          observasi: {
            scores: { 1: 4, 2: 4, 3: 3, 4: 3, 5: 3, 6: 3, 7: 4, 8: 4, 9: 3, 10: 3, 11: 3, 12: 4, 13: 4, 14: 3, 15: 4 },
            bukti: { 3: "Murid aktif bertanya dan berdiskusi memecahkan studi kasus ekosistem." },
            catatan: { 3: "Waktu ceramah berkurang drastis, kelas hidup dan menggembirakan." },
            kelebihan: "Keterlibatan murid meningkat pesat dibanding Semester Ganjil.",
            perluDitingkatkan: "Manajemen waktu presentasi kelompok.",
            rekomendasi: "Jadikan guru model untuk rekan sejawat di Komunitas Belajar."
          },
          rtl: {
            hasilEvaluasiManual: "Skor 83 (baik), keterlibatan murid tinggi",
            refleksiPenyebab: "Penerapan ice breaking dan pertanyaan terbuka berhasil efektif",
            tindakLanjut: "Pengimbasan praktik baik ke MGMP Biologi",
            peranKepsek: "Fasilitasi sharing session Komunitas Belajar (PLC)",
            waktu: "1 minggu",
            statusRtl: "Selesai"
          }
        },
        {
          id: "guru-genap-2",
          nama: "Bapak Budi",
          nip: "19810722 200902 1 004",
          kelasMapel: "Kelas XI / Matematika",
          tanggalSupervisi: "2026-04-12",
          fokusMasalah: "studi kasus kontekstual pesisir Sumenep",
          telaah: {
            scores: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 4, 6: 3, 7: 4, 8: 3, 9: 3, 10: 4, 11: 3, 12: 3, 13: 4, 14: 3, 15: 3 },
            comments: { 8: "Skenario masalah kontekstual statistika berbasis data hasil tangkapan nelayan Sumenep sangat baik." },
            kelebihan: "Modul ajar sangat kontekstual dan dekat dengan lingkungan murid.",
            perluDitingkatkan: "Alokasi waktu pengerjaan tugas proyek kontekstual.",
            rekomendasi: "Pertahankan integrasi konteks lokal Madura."
          },
          observasi: {
            scores: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 4, 6: 3, 7: 4, 8: 4, 9: 3, 10: 3, 11: 4, 12: 3, 13: 3, 14: 3, 15: 3 },
            bukti: { 9: "Murid antusias menghitung regresi linier menggunakan data riil lokal." },
            catatan: { 9: "Siswa merasa matematika aplikatif dan bermakna." },
            kelebihan: "Pembelajaran kontekstual berjalan sukses.",
            perluDitingkatkan: "Variasi rubrik asesmen antar kelompok.",
            rekomendasi: "Kembangkan ke materi trigonometri kontekstual."
          },
          rtl: {
            hasilEvaluasiManual: "Skor 81 (baik), kontekstual optimal",
            refleksiPenyebab: "Masalah nyata membuat murid termotivasi",
            tindakLanjut: "Menerapkan proyek mini matematika terapan",
            peranKepsek: "Apresiasi & penguatan materi",
            waktu: "2 minggu",
            statusRtl: "Selesai"
          }
        },
        {
          id: "guru-genap-3",
          nama: "Ibu Citra",
          nip: "19881105 201403 2 007",
          kelasMapel: "Kelas XII / Bahasa Indonesia",
          tanggalSupervisi: "2026-04-15",
          fokusMasalah: "asesmen HOTS & rubrik analitis",
          telaah: {
            scores: { 1: 4, 2: 4, 3: 3, 4: 4, 5: 3, 6: 3, 7: 4, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 3, 15: 3 },
            comments: { 15: "Soal evaluasi telah mengintegrasikan stimulus kritis tingkat C4–C5." },
            kelebihan: "Instrumen asesmen telah bertransformasi dari LOTS menjadi HOTS.",
            perluDitingkatkan: "Variasi asesmen peer-assessment antar murid.",
            rekomendasi: "Pertahankan dan kembangkan rubrik portofolio esai."
          },
          observasi: {
            scores: { 1: 4, 2: 4, 3: 3, 4: 4, 5: 3, 6: 3, 7: 4, 8: 4, 9: 3, 10: 3, 11: 4, 12: 4, 13: 3, 14: 3, 15: 3 },
            bukti: { 14: "Guru memberikan umpan balik formatif berbasis rubrik penalaran logis." },
            catatan: { 15: "Murid mampu mengkritisi teks opini secara berbobot." },
            kelebihan: "Asesmen proses dan hasil terbukti mengukur nalar kritis murid.",
            perluDitingkatkan: "Pemberian waktu elaborasi tulisan siswa.",
            rekomendasi: "Lanjutkan asesmen otentik portofolio."
          },
          rtl: {
            hasilEvaluasiManual: "Skor 80 (baik), asesmen berbasis HOTS",
            refleksiPenyebab: "Pelatihan review kisi-kisi soal HOTS memberikan pemahaman jelas",
            tindakLanjut: "Membuat bank soal HOTS Bahasa Indonesia",
            peranKepsek: "Review & validasi instrumen",
            waktu: "2 minggu",
            statusRtl: "Selesai"
          }
        },
        {
          id: "guru-genap-4",
          nama: "Bapak Dedi",
          nip: "19900218 201903 1 009",
          kelasMapel: "Kelas X / Informatika & KKA",
          tanggalSupervisi: "2026-04-18",
          fokusMasalah: "proyek koding & etika kecerdasan artifisial",
          telaah: {
            scores: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 3, 6: 4, 7: 4, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 3, 15: 3 },
            comments: { 6: "Integrasi Computational Thinking dan etika AI tersusun sangat aplikatif." },
            kelebihan: "Modul ajar mengintegrasikan konsep KKA (AI & Koding) secara utuh.",
            perluDitingkatkan: "Aktivitas unplugged untuk variasi non-komputer.",
            rekomendasi: "Diseminasikan ke guru-guru mata pelajaran lain."
          },
          observasi: {
            scores: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 4, 7: 4, 8: 4, 9: 3, 10: 3, 11: 4, 12: 4, 13: 3, 14: 4, 15: 3 },
            bukti: { 6: "Siswa mempraktikkan dekomposisi masalah dan logika percabangan koding." },
            catatan: { 6: "Teknologi dimanfaatkan secara interaktif dan mendorong kolaborasi." },
            kelebihan: "Peningkatan tertinggi dari 68 menjadi 84 poin.",
            perluDitingkatkan: "Pendampingan bagi siswa yang lambat adaptasi.",
            rekomendasi: "Jadikan koordinator program integrasi KKA sekolah."
          },
          rtl: {
            hasilEvaluasiManual: "Skor 84 (baik), integrasi KKA & CT berhasil",
            refleksiPenyebab: "Contoh konkret dan coaching intensif mempermudah implementasi",
            tindakLanjut: "Menyelenggarakan mini-showcase proyek koding siswa",
            peranKepsek: "Dukungan sarana lab & apresiasi karya",
            waktu: "1 bulan",
            statusRtl: "Selesai"
          }
        }
      ]
    }
  ]
};
