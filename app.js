// Logika Utama Aplikasi Supervisi Pembelajaran Mendalam (Modul KS)

const STORAGE_KEY = "SIM_SPM_MODUL_KS_V1";

let appState = loadState();
let selectedTeacherId = appState.teachers[0]?.id || "";

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_APP_STATE));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.teachers)) return cloneDefaultState();

    if (parsed.schoolInfo && parsed.schoolInfo.namaSekolah === "SD NEGERI HARAPAN BANGSA") {
      parsed.schoolInfo.namaSekolah = "SMA NEGERI 1 LENTENG SUMENEP";
      parsed.schoolInfo.kotaLaporan = "Sumenep";
      parsed.schoolInfo.sasaran =
        "Seluruh guru SMA Negeri 1 Lenteng Sumenep berdasarkan hasil supervisi akademik.";
      const mapelMigration = {
        "Kelas IV / IPAS": "Kelas X / Biologi",
        "Kelas V / Matematika": "Kelas XI / Matematika",
        "Kelas VI / Bahasa Indonesia": "Kelas XII / Bahasa Indonesia",
        "Kelas V / IPAS & KKA": "Kelas X / Informatika & KKA"
      };
      parsed.teachers.forEach((t) => {
        if (mapelMigration[t.kelasMapel]) {
          t.kelasMapel = mapelMigration[t.kelasMapel];
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    // Migrasi Struktur Periode
    if (!Array.isArray(parsed.periods) || parsed.periods.length === 0) {
      const def = cloneDefaultState();
      parsed.periods = def.periods || [
        {
          id: "periode-2025-2026-ganjil",
          nama: `T.P. ${parsed.schoolInfo?.tahunPelajaran || "2025/2026"} - ${parsed.schoolInfo?.semester || "Semester Ganjil"}`,
          tahunPelajaran: parsed.schoolInfo?.tahunPelajaran || "2025/2026",
          semester: parsed.schoolInfo?.semester || "Semester Ganjil",
          tanggalLaporan: parsed.schoolInfo?.tanggalLaporan || "30 April 2026",
          schoolInfo: JSON.parse(JSON.stringify(parsed.schoolInfo || {})),
          matrixChecklist: JSON.parse(JSON.stringify(parsed.matrixChecklist || {})),
          teachers: JSON.parse(JSON.stringify(parsed.teachers || []))
        }
      ];
      parsed.activePeriodId = parsed.periods[0].id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else if (!parsed.activePeriodId || !parsed.periods.some((p) => p.id === parsed.activePeriodId)) {
      parsed.activePeriodId = parsed.periods[0].id;
    }

    return parsed;
  } catch (err) {
    console.warn("Gagal memuat state dari localStorage, menggunakan data default.", err);
    return cloneDefaultState();
  }
}

function syncCurrentDataToActivePeriod() {
  if (!appState || !Array.isArray(appState.periods) || !appState.activePeriodId) return;
  const current = appState.periods.find((p) => p.id === appState.activePeriodId);
  if (current) {
    current.schoolInfo = JSON.parse(JSON.stringify(appState.schoolInfo || {}));
    current.matrixChecklist = JSON.parse(JSON.stringify(appState.matrixChecklist || {}));
    current.teachers = JSON.parse(JSON.stringify(appState.teachers || []));
    current.tahunPelajaran = appState.schoolInfo?.tahunPelajaran || current.tahunPelajaran;
    current.semester = appState.schoolInfo?.semester || current.semester;
  }
}

function saveState() {
  try {
    syncCurrentDataToActivePeriod();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (err) {
    console.error("Gagal menyimpan ke localStorage:", err);
  }

  // Trigger sinkronisasi otomatis ke Firebase Cloud jika aktif
  if (!isRemoteFirebaseUpdate && firebaseCurrentConfig?.autoSync && (firebaseDb || firebaseRtdb)) {
    clearTimeout(firebaseSyncDebounceTimer);
    firebaseSyncDebounceTimer = setTimeout(() => {
      pushToFirebase(true);
    }, 1200);
  }
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// ==========================================
// MODUL PENGELOLAAN MULTI-PERIODE SUPERVISI
// ==========================================

function renderPeriodControls() {
  const select = document.getElementById("select-global-period");
  if (select && Array.isArray(appState.periods)) {
    select.innerHTML = appState.periods
      .map(
        (p) => `
        <option value="${p.id}" ${p.id === appState.activePeriodId ? "selected" : ""}>
          📅 ${escapeHtml(p.nama || p.id)}
        </option>
      `
      )
      .join("");
  }

  const pill = document.getElementById("period-status-pill");
  const curPeriod = (appState.periods || []).find((p) => p.id === appState.activePeriodId);
  if (pill) {
    pill.textContent = curPeriod ? `${curPeriod.nama} (${curPeriod.teachers?.length || 0} Guru)` : "Periode Aktif";
  }

  const badge = document.getElementById("modal-period-count-badge");
  if (badge) {
    badge.textContent = (appState.periods || []).length;
  }
}

function switchPeriod(targetPeriodId) {
  if (!targetPeriodId) return;
  if (targetPeriodId === appState.activePeriodId) {
    renderPeriodControls();
    return;
  }

  syncCurrentDataToActivePeriod();

  const target = (appState.periods || []).find((p) => p.id === targetPeriodId);
  if (!target) return;

  appState.activePeriodId = target.id;
  appState.schoolInfo = JSON.parse(JSON.stringify(target.schoolInfo || {}));
  appState.matrixChecklist = JSON.parse(JSON.stringify(target.matrixChecklist || {}));
  appState.teachers = JSON.parse(JSON.stringify(target.teachers || []));

  if (appState.teachers.length > 0) {
    selectedTeacherId = appState.teachers[0].id;
  } else {
    selectedTeacherId = "";
  }

  saveState();
  renderPeriodControls();
  populateTeacherSelects();
  renderDashboard();
  renderTelaahForm();
  renderObservasiForm();
  renderMatrixTable();
  renderRtlCards();
  renderAnalisisTab();
  renderReportPreview();
  updateAiModeBadge();

  showToast(`Beralih ke periode: ${target.nama}`);
}

function createNewPeriod(formData) {
  const newId = "periode-" + Date.now();
  let teachersCopy = [];

  if (formData.copyMode === "copy-clean") {
    // Salin nama guru, kosongkan skor untuk penilaian siklus baru
    teachersCopy = (appState.teachers || []).map((t, idx) => ({
      id: "guru-" + (idx + 1) + "-" + Date.now().toString(36),
      nama: t.nama,
      nip: t.nip || "-",
      pangkatGol: t.pangkatGol || "-",
      jabatan: t.jabatan || "Guru Mata Pelajaran",
      kelasMapel: t.kelasMapel || "",
      jadwalSupervisi: "",
      jadwalTelaah: "",
      jamKe: "",
      fokusMasalah: "",
      catatanUmumTelaah: "",
      catatanUmumObservasi: "",
      umpanBalik: "",
      skorTelaah: 0,
      skorObservasi: 0,
      skorAkhir: 0,
      predikat: "Perlu Bimbingan",
      telaahAnswers: {},
      observasiAnswers: {},
      rtl: {
        nama: t.nama,
        nip: t.nip || "-",
        hasilSupervisi: 0,
        kategori: "Perlu Bimbingan",
        refleksi: "",
        rencanaPerbaikan: "",
        tindakLanjut: "",
        waktu: "",
        peranKS: ""
      }
    }));
  } else if (formData.copyMode === "copy-full") {
    teachersCopy = JSON.parse(JSON.stringify(appState.teachers || []));
  } else {
    teachersCopy = [];
  }

  const schoolInfoCopy = JSON.parse(JSON.stringify(appState.schoolInfo || {}));
  schoolInfoCopy.tahunPelajaran = formData.tahunPelajaran;
  schoolInfoCopy.semester = formData.semester;
  schoolInfoCopy.tanggalLaporan = formData.tanggalLaporan;
  if (formData.catatan) {
    schoolInfoCopy.tujuanSupervisi = formData.catatan;
  }

  const newPeriod = {
    id: newId,
    nama: formData.nama,
    tahunPelajaran: formData.tahunPelajaran,
    semester: formData.semester,
    tanggalLaporan: formData.tanggalLaporan,
    catatan: formData.catatan || "",
    schoolInfo: schoolInfoCopy,
    matrixChecklist: JSON.parse(JSON.stringify(appState.matrixChecklist || {})),
    teachers: teachersCopy
  };

  syncCurrentDataToActivePeriod();
  if (!Array.isArray(appState.periods)) appState.periods = [];
  appState.periods.push(newPeriod);

  switchPeriod(newId);
  renderPeriodsListTable();
  showToast(`Periode "${formData.nama}" berhasil dibuat & diaktifkan!`);
}

function deletePeriod(periodId) {
  if (!appState.periods || appState.periods.length <= 1) {
    alert("Tidak dapat menghapus periode ini karena minimal harus ada satu periode supervisi.");
    return;
  }
  const p = appState.periods.find((item) => item.id === periodId);
  if (!p) return;
  if (!confirm(`Hapus periode "${p.nama}"?\nSemua data penilaian supervisi pada periode ini akan dihapus permanen.`)) {
    return;
  }

  const wasActive = periodId === appState.activePeriodId;
  appState.periods = appState.periods.filter((item) => item.id !== periodId);

  if (wasActive) {
    const fallback = appState.periods[0];
    switchPeriod(fallback.id);
  } else {
    saveState();
    renderPeriodControls();
  }

  renderPeriodsListTable();
  showToast("Periode berhasil dihapus.");
}

function openPeriodModal(initialView = "list") {
  setPeriodModalSubview(initialView);
  const modal = document.getElementById("modal-period");
  if (modal) {
    modal.showModal();
  }
}

function setPeriodModalSubview(view) {
  const listSub = document.getElementById("period-subview-list");
  const addSub = document.getElementById("period-subview-add");
  const btnList = document.getElementById("btn-subtab-period-list");
  const btnAdd = document.getElementById("btn-subtab-period-add");

  if (view === "add") {
    if (listSub) listSub.style.display = "none";
    if (addSub) addSub.style.display = "block";
    if (btnList) btnList.className = "btn btn-secondary btn-sm";
    if (btnAdd) btnAdd.className = "btn btn-primary btn-sm";

    const tpInput = document.getElementById("input-period-tp");
    const semSelect = document.getElementById("input-period-semester");
    const nameInput = document.getElementById("input-period-name");
    const dateInput = document.getElementById("input-period-date");
    const curPeriod = (appState.periods || []).find((p) => p.id === appState.activePeriodId);

    if (tpInput && !tpInput.value) {
      tpInput.value = curPeriod?.tahunPelajaran || appState.schoolInfo?.tahunPelajaran || "2026/2027";
    }
    if (semSelect) {
      const isCurrentGanjil = (curPeriod?.semester || "").toLowerCase().includes("ganjil");
      semSelect.value = isCurrentGanjil ? "Semester Genap" : "Semester Ganjil";
    }
    const updateSuggestedName = () => {
      if (nameInput) {
        nameInput.value = `T.P. ${tpInput?.value || "2026/2027"} - ${semSelect?.value || "Semester Genap"}`;
      }
    };
    updateSuggestedName();
    if (dateInput && !dateInput.value) {
      dateInput.value = semSelect?.value.includes("Genap") ? "25 Juni 2026" : "15 Desember 2026";
    }
  } else {
    if (listSub) listSub.style.display = "block";
    if (addSub) addSub.style.display = "none";
    if (btnList) btnList.className = "btn btn-primary btn-sm";
    if (btnAdd) btnAdd.className = "btn btn-secondary btn-sm";
    renderPeriodsListTable();
  }
}

function renderPeriodsListTable() {
  const tbody = document.getElementById("periods-list-tbody");
  if (!tbody) return;
  const badge = document.getElementById("modal-period-count-badge");
  if (badge) badge.textContent = (appState.periods || []).length;

  tbody.innerHTML = (appState.periods || [])
    .map((p, idx) => {
      const isActive = p.id === appState.activePeriodId;
      const teacherCount = (p.teachers || []).length;
      let avgScore = 0;
      if (teacherCount > 0) {
        const sum = p.teachers.reduce((acc, t) => {
          const score = t.skorAkhir && t.skorAkhir > 0 ? t.skorAkhir : ((t.skorTelaah || 0) + (t.skorObservasi || 0)) / 2;
          return acc + (score || 0);
        }, 0);
        avgScore = Math.round((sum / teacherCount) * 10) / 10;
      }
      const cat = getCategoryInfo(avgScore);

      return `
        <tr style="${isActive ? "background: #eff6ff;" : ""}">
          <td style="text-align:center; font-weight:700;">${idx + 1}</td>
          <td>
            <div style="font-weight:700; color:var(--text-main); font-size:0.92rem;">
              ${escapeHtml(p.nama)}
              ${isActive ? '<span class="badge badge-sangat-baik" style="margin-left:6px; font-size:0.7rem;">⭐ Sedang Aktif</span>' : ""}
            </div>
            <div style="font-size:0.77rem; color:var(--text-muted);">
              Tahun: <strong>${escapeHtml(p.tahunPelajaran || "-")}</strong> • ${escapeHtml(p.semester || "-")}
            </div>
          </td>
          <td style="font-size:0.83rem;">${escapeHtml(p.tanggalLaporan || "-")}</td>
          <td style="text-align:center; font-weight:700;">${teacherCount} Guru</td>
          <td style="text-align:center;">
            <span class="badge ${cat.badgeClass}">${avgScore} (${cat.label})</span>
          </td>
          <td style="text-align:center;">
            ${isActive ? '<span style="color:#16a34a; font-weight:700; font-size:0.82rem;">Aktif</span>' : '<span style="color:var(--text-muted); font-size:0.82rem;">Arsip</span>'}
          </td>
          <td style="text-align:center;">
            <div style="display:inline-flex; gap:0.35rem;">
              ${
                !isActive
                  ? `<button type="button" class="btn btn-primary btn-sm" onclick="switchPeriod('${p.id}'); document.getElementById('modal-period')?.close();" style="padding:0.25rem 0.55rem; font-size:0.75rem;">Aktifkan</button>`
                  : '<button type="button" class="btn btn-secondary btn-sm" disabled style="padding:0.25rem 0.55rem; font-size:0.75rem; opacity:0.6;">Aktif</button>'
              }
              ${
                appState.periods.length > 1
                  ? `<button type="button" class="btn btn-secondary btn-sm" onclick="deletePeriod('${p.id}')" style="padding:0.25rem 0.55rem; font-size:0.75rem; color:#dc2626;" title="Hapus Periode">🗑️</button>`
                  : ""
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Window bindings untuk inline listener
window.switchPeriod = switchPeriod;
window.deletePeriod = deletePeriod;
window.openPeriodModal = openPeriodModal;
window.setPeriodModalSubview = setPeriodModalSubview;

// State komparasi periode
let selectedComparisonBaseId = null;
let selectedComparisonTargetId = null;

function renderPeriodComparison() {
  const container = document.getElementById("analisis-period-comparison-box");
  if (!container) return;

  const periods = appState.periods || [];
  if (periods.length < 2) {
    container.innerHTML = `
      <div style="padding:1.5rem; text-align:center; background:var(--bg-app); border:1px dashed var(--border-color); border-radius:var(--radius-sm);">
        <p style="margin:0 0 0.75rem 0; font-size:0.92rem; color:var(--text-secondary);">
          Saat ini baru terdapat <strong>1 periode supervisi</strong>. Tambahkan minimal satu periode lagi (misal: Semester Genap) untuk melihat analisis perbandingan dan tren peningkatan mutu pendidik secara otomatis.
        </p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openPeriodModal('add')">
          ➕ Tambah Periode Pembanding Sekarang
        </button>
      </div>
    `;
    return;
  }

  // Pilih periode default jika belum diset
  if (!selectedComparisonBaseId || !periods.some((p) => p.id === selectedComparisonBaseId)) {
    selectedComparisonBaseId = periods[0].id;
  }
  if (!selectedComparisonTargetId || !periods.some((p) => p.id === selectedComparisonTargetId)) {
    selectedComparisonTargetId = periods[periods.length - 1].id;
    if (selectedComparisonTargetId === selectedComparisonBaseId && periods.length > 1) {
      selectedComparisonTargetId = periods[1].id;
    }
  }

  const pBase = periods.find((p) => p.id === selectedComparisonBaseId) || periods[0];
  const pTarget = periods.find((p) => p.id === selectedComparisonTargetId) || periods[periods.length - 1];

  const getPeriodAvg = (period) => {
    const list = period.teachers || [];
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, t) => {
      const s = t.skorAkhir && t.skorAkhir > 0 ? t.skorAkhir : ((t.skorTelaah || 0) + (t.skorObservasi || 0)) / 2;
      return acc + (s || 0);
    }, 0);
    return Math.round((sum / list.length) * 10) / 10;
  };

  const scoreBase = getPeriodAvg(pBase);
  const scoreTarget = getPeriodAvg(pTarget);
  const deltaScore = Math.round((scoreTarget - scoreBase) * 10) / 10;
  const isPositive = deltaScore >= 0;

  const teacherRows = [];
  (pTarget.teachers || []).forEach((tTarget) => {
    const tBase = (pBase.teachers || []).find((tb) => tb.nama === tTarget.nama);
    const sTarget = tTarget.skorAkhir && tTarget.skorAkhir > 0 ? tTarget.skorAkhir : ((tTarget.skorTelaah || 0) + (tTarget.skorObservasi || 0)) / 2;
    const sBase = tBase ? (tBase.skorAkhir && tBase.skorAkhir > 0 ? tBase.skorAkhir : ((tBase.skorTelaah || 0) + (tBase.skorObservasi || 0)) / 2) : null;
    const deltaT = sBase !== null ? Math.round((sTarget - sBase) * 10) / 10 : null;

    teacherRows.push({
      nama: tTarget.nama,
      mapel: tTarget.kelasMapel || "-",
      scoreBase: sBase,
      scoreTarget: sTarget,
      delta: deltaT
    });
  });

  const sortedByDelta = [...teacherRows].filter((r) => r.delta !== null).sort((a, b) => b.delta - a.delta);
  const topImprover = sortedByDelta[0];

  container.innerHTML = `
    <!-- Selektor Periode Komparasi -->
    <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; justify-content:space-between; background:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.85rem 1.1rem; margin-bottom:1.15rem;">
      <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
        <span style="font-weight:700; font-size:0.86rem; color:var(--text-main);">Bandingkan:</span>
        <select id="select-comp-base" class="form-select" style="width:auto; padding:0.35rem 0.65rem; font-size:0.83rem;">
          ${periods.map((p) => `<option value="${p.id}" ${p.id === pBase.id ? "selected" : ""}>Baseline: ${escapeHtml(p.nama)}</option>`).join("")}
        </select>
        <span style="font-weight:800; color:var(--primary);">➔ DENGAN ➔</span>
        <select id="select-comp-target" class="form-select" style="width:auto; padding:0.35rem 0.65rem; font-size:0.83rem;">
          ${periods.map((p) => `<option value="${p.id}" ${p.id === pTarget.id ? "selected" : ""}>Evaluasi: ${escapeHtml(p.nama)}</option>`).join("")}
        </select>
      </div>
      <div style="font-size:0.8rem; color:var(--text-muted);">
        Menampilkan perbandingan capaian <strong>${teacherRows.length} guru</strong>
      </div>
    </div>

    <!-- Ringkasan Delta KPI -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
      <div class="stat-card">
        <span class="stat-label">Rata-rata Baseline (${escapeHtml(pBase.semester || "P1")})</span>
        <span class="stat-value">${scoreBase}</span>
        <span class="stat-meta">${escapeHtml(pBase.nama)}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Rata-rata Evaluasi (${escapeHtml(pTarget.semester || "P2")})</span>
        <span class="stat-value">${scoreTarget}</span>
        <span class="stat-meta">${escapeHtml(pTarget.nama)}</span>
      </div>

      <div class="stat-card ${isPositive ? "stat-emerald" : "stat-accent"}">
        <span class="stat-label">Pertumbuhan Mutu (Delta)</span>
        <span class="stat-value" style="font-size:1.45rem;">
          ${isPositive ? `+${deltaScore}` : deltaScore} Poin
        </span>
        <span class="stat-meta">
          ${isPositive ? "📈 Terjadi peningkatan capaian mutu pembelajaran" : "📉 Perlu tindak lanjut pendampingan lebih intensif"}
        </span>
      </div>

      <div class="stat-card stat-purple">
        <span class="stat-label">Pendidik Kemajuan Tertinggi</span>
        <span class="stat-value" style="font-size:1.15rem;">
          ${topImprover && topImprover.delta > 0 ? `+${topImprover.delta} Poin` : "-"}
        </span>
        <span class="stat-meta">
          ${topImprover && topImprover.delta > 0 ? `<strong>${escapeHtml(topImprover.nama)}</strong> (${escapeHtml(topImprover.mapel)})` : "Belum terdata kenaikan"}
        </span>
      </div>
    </div>

    <!-- Tabel Perkembangan Nilai Setiap Guru -->
    <div class="table-responsive">
      <table class="instrument-table">
        <thead>
          <tr>
            <th style="width:38px;">No</th>
            <th>Nama Pendidik &amp; Mata Pelajaran</th>
            <th style="text-align:center;">Skor Baseline (${escapeHtml(pBase.semester || "Awal")})</th>
            <th style="text-align:center;">Skor Evaluasi (${escapeHtml(pTarget.semester || "Akhir")})</th>
            <th style="text-align:center;">Delta Perkembangan</th>
            <th style="text-align:center;">Status Evaluasi &amp; RTL</th>
          </tr>
        </thead>
        <tbody>
          ${teacherRows
            .map((r, idx) => {
              const deltaStr = r.delta !== null ? (r.delta > 0 ? `+${r.delta}` : `${r.delta}`) : "-";
              const deltaBadge =
                r.delta === null
                  ? '<span class="badge" style="background:#f1f5f9; color:#64748b;">Baru</span>'
                  : r.delta > 0
                  ? `<span class="badge badge-sangat-baik">📈 ${deltaStr} Poin</span>`
                  : r.delta === 0
                  ? `<span class="badge badge-baik">➖ Tetap (0)</span>`
                  : `<span class="badge badge-perlu-bimbingan">📉 ${deltaStr} Poin</span>`;

              let evalStatus = "Mempertahankan Mutu";
              if (r.delta > 5) evalStatus = "🌟 Peningkatan Signifikan (Siap PLC)";
              else if (r.delta > 0) evalStatus = "✅ Berprogres Positif";
              else if (r.delta < 0) evalStatus = "⚠️ Membutuhkan Coaching Ulang";

              return `
              <tr>
                <td style="text-align:center; font-weight:700;">${idx + 1}</td>
                <td>
                  <div style="font-weight:700; color:var(--text-main);">${escapeHtml(r.nama)}</div>
                  <div style="font-size:0.77rem; color:var(--text-muted);">${escapeHtml(r.mapel)}</div>
                </td>
                <td style="text-align:center; font-weight:700;">
                  ${r.scoreBase !== null ? `${r.scoreBase} <span class="badge ${getCategoryInfo(r.scoreBase).badgeClass}">${getCategoryInfo(r.scoreBase).label}</span>` : "-"}
                </td>
                <td style="text-align:center; font-weight:700;">
                  ${r.scoreTarget !== null ? `${r.scoreTarget} <span class="badge ${getCategoryInfo(r.scoreTarget).badgeClass}">${getCategoryInfo(r.scoreTarget).label}</span>` : "-"}
                </td>
                <td style="text-align:center;">${deltaBadge}</td>
                <td style="text-align:center; font-size:0.83rem; font-weight:600;">${evalStatus}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("select-comp-base")?.addEventListener("change", (e) => {
    selectedComparisonBaseId = e.target.value;
    renderPeriodComparison();
  });

  document.getElementById("select-comp-target")?.addEventListener("change", (e) => {
    selectedComparisonTargetId = e.target.value;
    renderPeriodComparison();
  });
}

// ==========================================
// MODUL DATABASE CLOUD FIREBASE
// ==========================================
const FIREBASE_CONFIG_KEY = "SIM_SPM_FIREBASE_CONFIG_V1";
let firebaseApp = null;
let firebaseDb = null;
let firebaseRtdb = null;
let firebaseUnsubscribe = null;
let firebaseSyncDebounceTimer = null;
let isFirebaseSyncing = false;
let isRemoteFirebaseUpdate = false;
let firebaseCurrentConfig = loadFirebaseConfig();

function loadFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveFirebaseConfig(cfg) {
  try {
    if (cfg) {
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(cfg));
    } else {
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
    }
  } catch (e) {}
}

function updateSyncTimestamp() {
  const syncTime = document.getElementById("firebase-sync-timestamp");
  if (syncTime) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    syncTime.textContent = "Terakhir sinkron: " + timeStr;
  }
}

function updateFirebaseStatusUI(status, message) {
  const headerText = document.getElementById("header-firebase-status");
  const modalBadge = document.getElementById("firebase-connection-badge");

  if (status === "connected") {
    if (headerText) {
      headerText.innerHTML = `Firebase <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-left:3px;"></span> (Online)`;
    }
    if (modalBadge) {
      modalBadge.className = "badge badge-sangat-baik";
      const typeStr = firebaseCurrentConfig?.databaseType === "rtdb" ? "Realtime DB" : "Cloud Firestore";
      modalBadge.textContent = "🟢 Terhubung ke " + typeStr;
    }
  } else if (status === "connecting") {
    if (headerText) headerText.textContent = "Firebase (Menghubungkan...)";
    if (modalBadge) {
      modalBadge.className = "badge badge-cukup";
      modalBadge.textContent = "⏳ Sedang Menghubungkan ke Cloud...";
    }
  } else if (status === "error") {
    if (headerText) {
      headerText.innerHTML = `Firebase <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; margin-left:3px;"></span> (Offline)`;
    }
    if (modalBadge) {
      modalBadge.className = "badge badge-kurang";
      modalBadge.textContent = "🔴 Koneksi Gagal: " + (message || "Periksa config & internet");
    }
  } else {
    // disconnected
    if (headerText) headerText.textContent = "Firebase (Lokal)";
    if (modalBadge) {
      modalBadge.className = "badge badge-cukup";
      modalBadge.textContent = "🟡 Mode Lokal (LocalStorage)";
    }
  }
}

function parseFirebaseConfigSnippet(text) {
  if (!text) return null;
  const cleaned = text.trim();

  // Coba parse JSON murni
  try {
    const json = JSON.parse(cleaned);
    if (json.apiKey) return json;
  } catch (e) {}

  // Regex extract dari kode JavaScript snippet
  const res = {};
  const patterns = {
    apiKey: /apiKey\s*:\s*["'`]([^"'`]+)["'`]/,
    authDomain: /authDomain\s*:\s*["'`]([^"'`]+)["'`]/,
    projectId: /projectId\s*:\s*["'`]([^"'`]+)["'`]/,
    storageBucket: /storageBucket\s*:\s*["'`]([^"'`]+)["'`]/,
    messagingSenderId: /messagingSenderId\s*:\s*["'`]([^"'`]+)["'`]/,
    appId: /appId\s*:\s*["'`]([^"'`]+)["'`]/,
    databaseURL: /databaseURL\s*:\s*["'`]([^"'`]+)["'`]/
  };

  for (const [key, regex] of Object.entries(patterns)) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      res[key] = match[1];
    }
  }

  return res.apiKey ? res : null;
}

function handleCloudDataReceived(cloudData) {
  if (!cloudData || !Array.isArray(cloudData.teachers) || !cloudData.schoolInfo) return;
  if (isFirebaseSyncing) return; // Hindari re-trigger dari push lokal kita sendiri

  // Cek apakah data benar-benar berbeda
  const localStr = JSON.stringify(appState);
  const cloudStr = JSON.stringify(cloudData);
  if (localStr === cloudStr) {
    updateSyncTimestamp();
    return;
  }

  isRemoteFirebaseUpdate = true;
  appState = cloudData;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  renderDashboard();
  renderHeaderSchool();
  updateSyncTimestamp();
  isRemoteFirebaseUpdate = false;
  showToast("🔄 Data supervisi diperbarui dari Cloud Firebase secara realtime.");
}

function initFirebase(config, showToasts = false) {
  if (typeof firebase === "undefined") {
    console.warn("Firebase SDK tidak terdeteksi.");
    updateFirebaseStatusUI("error", "Firebase SDK belum termuat.");
    return;
  }

  if (!config || !config.apiKey || !config.projectId) {
    updateFirebaseStatusUI("disconnected");
    return;
  }

  updateFirebaseStatusUI("connecting");

  try {
    if (firebaseUnsubscribe) {
      firebaseUnsubscribe();
      firebaseUnsubscribe = null;
    }

    const appName = "SIM_SPM_APP";
    let app = firebase.apps.find((a) => a.name === appName);
    if (!app) {
      app = firebase.initializeApp(config, appName);
    }
    firebaseApp = app;

    const docId = config.docPath || "sman1_lenteng_sumenep";
    const collectionName = "supervisi_pm";

    if (config.databaseType === "rtdb") {
      firebaseRtdb = app.database();
      firebaseDb = null;
      const ref = firebaseRtdb.ref(collectionName + "/" + docId);

      if (config.autoSync) {
        ref.on("value", (snapshot) => {
          const cloudData = snapshot.val();
          handleCloudDataReceived(cloudData);
        }, (err) => {
          console.error("RTDB error:", err);
          updateFirebaseStatusUI("error", err.message);
        });
      }

      updateFirebaseStatusUI("connected");
      if (showToasts) showToast("Berhasil terhubung ke Firebase Realtime Database!");

    } else {
      // Cloud Firestore (rekomendasi Google)
      const firestore = app.firestore();
      try {
        firestore.settings({ ignoreUndefinedProperties: true });
      } catch (e) {}
      firebaseDb = firestore;
      firebaseRtdb = null;

      const docRef = firestore.collection(collectionName).doc(docId);

      if (config.autoSync) {
        firebaseUnsubscribe = docRef.onSnapshot((docSnapshot) => {
          if (docSnapshot.exists) {
            const cloudData = docSnapshot.data();
            handleCloudDataReceived(cloudData);
          }
        }, (err) => {
          console.error("Firestore error:", err);
          updateFirebaseStatusUI("error", err.message);
        });
      }

      updateFirebaseStatusUI("connected");
      if (showToasts) showToast("Berhasil terhubung ke Cloud Firestore!");
    }

    firebaseCurrentConfig = config;
    saveFirebaseConfig(config);

  } catch (err) {
    console.error("Gagal inisialisasi Firebase:", err);
    updateFirebaseStatusUI("error", err.message);
    if (showToasts) showToast("Gagal terhubung ke Firebase: " + err.message);
  }
}

async function pushToFirebase(isSilent = false) {
  if (!firebaseCurrentConfig || (!firebaseDb && !firebaseRtdb)) {
    if (!isSilent) showToast("Firebase belum dikonfigurasi / belum terhubung.");
    return false;
  }

  isFirebaseSyncing = true;
  const docId = firebaseCurrentConfig.docPath || "sman1_lenteng_sumenep";
  const cleanData = JSON.parse(JSON.stringify(appState));
  cleanData._lastUpdated = new Date().toISOString();

  try {
    if (firebaseCurrentConfig.databaseType === "rtdb" && firebaseRtdb) {
      await firebaseRtdb.ref("supervisi_pm/" + docId).set(cleanData);
    } else if (firebaseDb) {
      await firebaseDb.collection("supervisi_pm").doc(docId).set(cleanData, { merge: true });
    }
    updateSyncTimestamp();
    updateFirebaseStatusUI("connected");
    if (!isSilent) showToast("☁️ Data supervisi berhasil diunggah ke Firebase Cloud!");
    isFirebaseSyncing = false;
    return true;
  } catch (err) {
    console.error("Gagal push ke Firebase:", err);
    updateFirebaseStatusUI("error", err.message);
    if (!isSilent) showToast("Gagal mengunggah ke Firebase: " + err.message);
    isFirebaseSyncing = false;
    return false;
  }
}

async function pullFromFirebase() {
  if (!firebaseCurrentConfig || (!firebaseDb && !firebaseRtdb)) {
    showToast("Firebase belum dikonfigurasi / belum terhubung.");
    return false;
  }

  const docId = firebaseCurrentConfig.docPath || "sman1_lenteng_sumenep";
  try {
    let cloudData = null;
    if (firebaseCurrentConfig.databaseType === "rtdb" && firebaseRtdb) {
      const snap = await firebaseRtdb.ref("supervisi_pm/" + docId).once("value");
      cloudData = snap.val();
    } else if (firebaseDb) {
      const doc = await firebaseDb.collection("supervisi_pm").doc(docId).get();
      if (doc.exists) cloudData = doc.data();
    }

    if (!cloudData || !Array.isArray(cloudData.teachers)) {
      showToast("Data supervisi di Cloud Firebase masih kosong atau belum ada.");
      return false;
    }

    appState = cloudData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    renderDashboard();
    renderHeaderSchool();
    updateSyncTimestamp();
    showToast("📥 Data supervisi berhasil diunduh dari Firebase Cloud!");
    return true;
  } catch (err) {
    console.error("Gagal pull dari Firebase:", err);
    showToast("Gagal mengunduh dari Firebase: " + err.message);
    return false;
  }
}

function disconnectFirebase() {
  if (firebaseUnsubscribe) {
    firebaseUnsubscribe();
    firebaseUnsubscribe = null;
  }
  firebaseApp = null;
  firebaseDb = null;
  firebaseRtdb = null;
  firebaseCurrentConfig = null;
  saveFirebaseConfig(null);
  updateFirebaseStatusUI("disconnected");
  showToast("Koneksi Firebase diputuskan. Aplikasi kembali ke mode LocalStorage murni.");
}

function openFirebaseModal() {
  const modal = document.getElementById("modal-firebase");
  if (!modal) return;

  const cfg = firebaseCurrentConfig || {};
  document.getElementById("fb-api-key").value = cfg.apiKey || "";
  document.getElementById("fb-project-id").value = cfg.projectId || "";
  document.getElementById("fb-auth-domain").value = cfg.authDomain || "";
  document.getElementById("fb-app-id").value = cfg.appId || "";
  document.getElementById("fb-database-type").value = cfg.databaseType || "firestore";
  document.getElementById("fb-doc-path").value = cfg.docPath || "sman1_lenteng_sumenep";
  document.getElementById("fb-auto-sync").checked = cfg.autoSync !== false;

  modal.showModal();
}

// Perhitungan Skor & Kategori (Sesuai Ambang Batas Lampiran 3 Modul KS: <=70 Cukup, 71-85 Baik, >=86 Sangat Baik)
function calcInstrumentScore(scoresObj) {
  let raw = 0;
  for (let i = 1; i <= 15; i++) {
    const val = Number(scoresObj?.[i] ?? 0);
    raw += isNaN(val) ? 0 : val;
  }
  const max = 60; // 15 butir x skala 4
  const nilai = Math.round((raw / max) * 100);
  return { raw, max, nilai };
}

function getCategoryInfo(nilai) {
  if (nilai >= 86) {
    return { label: "Sangat Baik", lower: "sangat baik", badgeClass: "badge-sangat-baik" };
  }
  if (nilai >= 71) {
    return { label: "Baik", lower: "baik", badgeClass: "badge-baik" };
  }
  if (nilai >= 56) {
    return { label: "Cukup", lower: "cukup", badgeClass: "badge-cukup" };
  }
  return { label: "Kurang", lower: "kurang", badgeClass: "badge-kurang" };
}

function calcTeacherSummary(teacher) {
  const telaah = calcInstrumentScore(teacher.telaah?.scores);
  const observasi = calcInstrumentScore(teacher.observasi?.scores);
  const finalScore = Math.round((telaah.nilai + observasi.nilai) / 2);
  const cat = getCategoryInfo(finalScore);
  return {
    telaah,
    observasi,
    finalScore,
    category: cat
  };
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Navigasi Tab
function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  if (tabId === "tab-dashboard") renderDashboard();
  if (tabId === "tab-kerangka") renderKerangkaMatrix();
  if (tabId === "tab-telaah") renderTelaahForm();
  if (tabId === "tab-observasi") renderObservasiForm();
  if (tabId === "tab-analisis") renderAnalisisTab();
  if (tabId === "tab-rtl") renderRtlTab();
  if (tabId === "tab-ai") renderAiTab();
  if (tabId === "tab-laporan") renderReportPreview();
}

// Update Header Subtitle
function renderHeaderSchool() {
  const s = appState.schoolInfo;
  const el = document.getElementById("header-school-subtitle");
  if (el) {
    el.textContent = `${s.namaSekolah} • Tahun Pelajaran ${s.tahunPelajaran} (${s.semester}) • Kepala Sekolah: ${s.kepalaSekolah}`;
  }
}

// Sinkronisasi Dropdown Pemilihan Guru
function populateTeacherSelects() {
  const selects = [
    document.getElementById("select-teacher-telaah"),
    document.getElementById("select-teacher-observasi"),
    document.getElementById("select-teacher-ai"),
    document.getElementById("select-report-teacher")
  ];

  if (!appState.teachers.some((t) => t.id === selectedTeacherId)) {
    selectedTeacherId = appState.teachers[0]?.id || "";
  }

  selects.forEach((sel) => {
    if (!sel) return;
    sel.innerHTML = appState.teachers
      .map(
        (t, idx) =>
          `<option value="${escapeHtml(t.id)}" ${t.id === selectedTeacherId ? "selected" : ""}>${idx + 1}. ${escapeHtml(t.nama)} (${escapeHtml(t.kelasMapel)})</option>`
      )
      .join("");
  });

  const analisisScopeSelect = document.getElementById("select-analisis-scope");
  if (analisisScopeSelect) {
    const currentScope = analisisScopeSelect.value || "all";
    const validScope =
      currentScope === "all" || appState.teachers.some((t) => t.id === currentScope)
        ? currentScope
        : "all";
    analisisScopeSelect.innerHTML =
      `<option value="all" ${validScope === "all" ? "selected" : ""}>🏫 Seluruh Pendidik (Analisis Tingkat Sekolah)</option>` +
      appState.teachers
        .map(
          (t, idx) =>
            `<option value="${escapeHtml(t.id)}" ${validScope === t.id ? "selected" : ""}>👤 ${idx + 1}. ${escapeHtml(t.nama)} (${escapeHtml(t.kelasMapel)})</option>`
        )
        .join("");
  }
}

function getSelectedTeacher() {
  return appState.teachers.find((t) => t.id === selectedTeacherId) || appState.teachers[0] || null;
}

// ==========================================
// 1. RENDER DASHBOARD
// ==========================================
function renderDashboard() {
  renderHeaderSchool();
  populateTeacherSelects();

  const teachers = appState.teachers;
  const totalGuru = teachers.length;

  let sumTelaah = 0;
  let sumObservasi = 0;
  let sumFinal = 0;

  teachers.forEach((t) => {
    const sum = calcTeacherSummary(t);
    sumTelaah += sum.telaah.nilai;
    sumObservasi += sum.observasi.nilai;
    sumFinal += sum.finalScore;
  });

  const avgTelaah = totalGuru ? Math.round(sumTelaah / totalGuru) : 0;
  const avgObservasi = totalGuru ? Math.round(sumObservasi / totalGuru) : 0;
  const avgFinal = totalGuru ? Math.round(sumFinal / totalGuru) : 0;
  const avgCat = getCategoryInfo(avgFinal);

  const statsGrid = document.getElementById("dashboard-stats-grid");
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Pendidik Disupervisi</span>
        <span class="stat-value">${totalGuru} Guru</span>
        <span class="stat-meta">${escapeHtml(appState.schoolInfo.namaSekolah)}</span>
      </div>
      <div class="stat-card stat-emerald">
        <span class="stat-label">Rata-rata Telaah RPP (Lamp. 5)</span>
        <span class="stat-value">${avgTelaah}</span>
        <span class="stat-meta">Predikat: <strong>${getCategoryInfo(avgTelaah).label}</strong> (Skala 0–100)</span>
      </div>
      <div class="stat-card stat-amber">
        <span class="stat-label">Rata-rata Observasi (Lamp. 6)</span>
        <span class="stat-value">${avgObservasi}</span>
        <span class="stat-meta">Predikat: <strong>${getCategoryInfo(avgObservasi).label}</strong> (Skala 0–100)</span>
      </div>
      <div class="stat-card stat-purple">
        <span class="stat-label">Rata-rata Skor Akhir Supervisi</span>
        <span class="stat-value">${avgFinal} <span class="badge ${avgCat.badgeClass}" style="vertical-align:middle;">${avgCat.label}</span></span>
        <span class="stat-meta">Gabungan Perencanaan &amp; Pelaksanaan</span>
      </div>
    `;
  }

  // Hitung rata-rata per kelompok aspek
  const aspectGroups = [
    { label: "1. Keselarasan (Dimensi Profil Lulusan)", items: [1, 2], color: "#2563eb" },
    { label: "2. Kerangka Pembelajaran (Pedagogis, Lingkungan, Kemitraan, Digital)", items: [3, 4, 5, 6], color: "#059669" },
    { label: "3. Pengalaman Belajar PM (Memahami, Mengaplikasi, Merefleksi)", items: [7, 8, 9, 10], color: "#7c3aed" },
    { label: "4. Prinsip Berkesadaran, Bermakna, Menggembirakan & Karakteristik Murid", items: [11, 12], color: "#d97706" },
    { label: "5. Asesmen Pembelajaran (Awal, Proses, Hasil / HOTS)", items: [13, 14, 15], color: "#ea580c" }
  ];

  const aspectContainer = document.getElementById("dashboard-aspect-bars");
  if (aspectContainer) {
    aspectContainer.innerHTML = aspectGroups
      .map((grp) => {
        let totalObtained = 0;
        let totalMax = totalGuru * grp.items.length * 4 * 2; // Telaah + Observasi
        teachers.forEach((t) => {
          grp.items.forEach((no) => {
            totalObtained += Number(t.telaah?.scores?.[no] ?? 0);
            totalObtained += Number(t.observasi?.scores?.[no] ?? 0);
          });
        });
        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        return `
          <div style="margin-bottom:0.85rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:600; margin-bottom:0.3rem;">
              <span>${escapeHtml(grp.label)}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%; background:${grp.color};"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Ringkasan Kesenjangan (Gap Summary)
  const gapContainer = document.getElementById("dashboard-gap-summary");
  if (gapContainer) {
    if (teachers.length === 0) {
      gapContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.88rem;">Belum ada data pendidik.</p>`;
    } else {
      gapContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.65rem;">
          ${teachers
            .map((t) => {
              const s = calcTeacherSummary(t);
              return `
                <div style="padding:0.7rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-app); display:flex; justify-content:space-between; align-items:center; gap:0.75rem;">
                  <div>
                    <div style="font-weight:700; font-size:0.88rem;">${escapeHtml(t.nama)} <span style="font-weight:400; color:var(--text-secondary);">(${escapeHtml(t.kelasMapel)})</span></div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.15rem;">
                      <strong>Temuan:</strong> ${escapeHtml(t.rtl?.hasilEvaluasiManual || `Skor ${s.finalScore} (${s.category.lower})`)} •
                      <strong>Peran KS:</strong> ${escapeHtml(t.rtl?.peranKepsek || "-")}
                    </div>
                  </div>
                  <span class="badge ${s.category.badgeClass}">${s.finalScore} (${s.category.label})</span>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }
  }

  // Tabel Rekapitulasi Pendidik
  const tbody = document.getElementById("dashboard-teacher-tbody");
  if (tbody) {
    tbody.innerHTML = teachers
      .map((t, idx) => {
        const s = calcTeacherSummary(t);
        return `
          <tr>
            <td style="text-align:center; font-weight:700;">${idx + 1}</td>
            <td>
              <div style="font-weight:700; color:var(--text-main);">${escapeHtml(t.nama)}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">${escapeHtml(t.kelasMapel)}</div>
              <div style="font-size:0.76rem; color:var(--text-muted);">NIP: ${escapeHtml(t.nip || "-")} | Tgl: ${escapeHtml(t.tanggalSupervisi || "-")}</div>
            </td>
            <td>
              <div style="font-weight:700; font-size:0.95rem;">${s.telaah.nilai} <span style="font-size:0.78rem; font-weight:400; color:var(--text-muted);">(${s.telaah.raw}/60)</span></div>
              <span class="badge ${getCategoryInfo(s.telaah.nilai).badgeClass}">${getCategoryInfo(s.telaah.nilai).label}</span>
            </td>
            <td>
              <div style="font-weight:700; font-size:0.95rem;">${s.observasi.nilai} <span style="font-size:0.78rem; font-weight:400; color:var(--text-muted);">(${s.observasi.raw}/60)</span></div>
              <span class="badge ${getCategoryInfo(s.observasi.nilai).badgeClass}">${getCategoryInfo(s.observasi.nilai).label}</span>
            </td>
            <td>
              <div style="font-weight:800; font-size:1.05rem;">${s.finalScore}</div>
              <span class="badge ${s.category.badgeClass}">${s.category.label}</span>
            </td>
            <td>
              <div style="font-size:0.82rem;"><strong>Evaluasi:</strong> ${escapeHtml(t.rtl?.hasilEvaluasiManual || "-")}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;"><strong>RTL:</strong> ${escapeHtml(t.rtl?.tindakLanjut || "-")}</div>
              <div style="font-size:0.76rem; color:var(--primary); margin-top:0.2rem; font-weight:600;">Waktu: ${escapeHtml(t.rtl?.waktu || "-")}</div>
            </td>
            <td>
              <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="openTeacherInstrument('${escapeHtml(t.id)}', 'tab-telaah')">📝 Telaah</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openTeacherInstrument('${escapeHtml(t.id)}', 'tab-observasi')">🔍 Observasi</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openTeacherAnalisis('${escapeHtml(t.id)}')">📈 Analisis</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openTeacherInstrument('${escapeHtml(t.id)}', 'tab-rtl')">🎯 RTL</button>
                <button type="button" class="btn btn-accent btn-sm" onclick="openTeacherInstrument('${escapeHtml(t.id)}', 'tab-ai')">🤖 AI</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="openEditTeacherModal('${escapeHtml(t.id)}')">✏️ Edit</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteTeacher('${escapeHtml(t.id)}')">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }
}

window.openTeacherInstrument = function (teacherId, tabId) {
  selectedTeacherId = teacherId;
  populateTeacherSelects();
  switchTab(tabId);
};

window.openTeacherAnalisis = function (teacherId) {
  selectedTeacherId = teacherId;
  populateTeacherSelects();
  const scopeSelect = document.getElementById("select-analisis-scope");
  if (scopeSelect) scopeSelect.value = teacherId;
  switchTab("tab-analisis");
};

// ==========================================
// 2. RENDER KERANGKA SUPERVISI (LAMPIRAN 4)
// ==========================================
function renderKerangkaMatrix() {
  const tbody = document.getElementById("lampiran-4-tbody");
  if (!tbody) return;

  const cols = [
    "praktikPedagogis",
    "kemitraanPembelajaran",
    "lingkunganPembelajaran",
    "pemanfaatanDigital"
  ];

  let checkedCount = 0;
  const totalCells = LAMPIRAN_4_MATRIX.length * cols.length;

  tbody.innerHTML = LAMPIRAN_4_MATRIX.map((row) => {
    const cellsHtml = cols
      .map((colKey) => {
        const checkId = `${row.id}_${colKey}`;
        const isChecked = !!appState.matrixChecklist?.[checkId];
        if (isChecked) checkedCount++;
        return `
          <td class="matrix-cell">
            <label class="matrix-check-label">
              <input type="checkbox" data-matrix-key="${checkId}" ${isChecked ? "checked" : ""} />
              <span>${escapeHtml(row[colKey])}</span>
            </label>
          </td>
        `;
      })
      .join("");

    return `
      <tr>
        <td style="font-weight:700; background:#f8fafc; color:var(--primary);">${escapeHtml(row.tahap)}</td>
        ${cellsHtml}
      </tr>
    `;
  }).join("");

  const pct = Math.round((checkedCount / totalCells) * 100);
  const badgeEl = document.getElementById("kerangka-progress-badge");
  if (badgeEl) {
    badgeEl.innerHTML = `<span class="badge badge-baik" style="font-size:0.85rem; padding:0.4rem 0.85rem;">Progres Implementasi Kerangka: ${checkedCount}/${totalCells} (${pct}%)</span>`;
  }

  tbody.querySelectorAll("input[data-matrix-key]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const key = e.target.dataset.matrixKey;
      if (!appState.matrixChecklist) appState.matrixChecklist = {};
      appState.matrixChecklist[key] = e.target.checked;
      saveState();
      renderKerangkaMatrix();
    });
  });
}

// ==========================================
// 3. RENDER INSTRUMEN TELAAH PERENCANAAN (LAMPIRAN 5)
// ==========================================
function renderTelaahForm() {
  populateTeacherSelects();
  const teacher = getSelectedTeacher();
  const tbody = document.getElementById("lampiran-5-tbody");
  if (!teacher || !tbody) return;

  const metaEl = document.getElementById("telaah-teacher-meta");
  if (metaEl) {
    metaEl.textContent = `NIP: ${teacher.nip || "-"} | ${teacher.kelasMapel} | Tgl Supervisi: ${teacher.tanggalSupervisi || "-"}`;
  }

  updateTelaahSummaryHeader(teacher);

  let lastCategory = "";
  let html = "";

  LAMPIRAN_5_ITEMS.forEach((item) => {
    if (item.kategori !== lastCategory) {
      lastCategory = item.kategori;
      html += `
        <tr class="category-row">
          <td colspan="4">${escapeHtml(item.kategori)}</td>
        </tr>
      `;
    }

    const currentScore = Number(teacher.telaah?.scores?.[item.no] ?? 3);
    const currentComment = teacher.telaah?.comments?.[item.no] || "";

    const subHtml =
      item.subItems && item.subItems.length > 0
        ? `<ul class="sub-item-list">${item.subItems.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
        : "";

    const scaleButtons = [0, 1, 2, 3, 4]
      .map(
        (val) => `
        <button type="button" class="scale-btn ${currentScore === val ? "active" : ""}" data-telaah-no="${item.no}" data-val="${val}" title="${SCALE_LABELS[val].short}">
          ${val}
        </button>
      `
      )
      .join("");

    html += `
      <tr>
        <td style="text-align:center; font-weight:700;">${item.no}</td>
        <td>
          <div>${escapeHtml(item.aspek)}</div>
          ${subHtml}
        </td>
        <td style="text-align:center;">
          <div class="scale-selector">${scaleButtons}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;" id="telaah-scale-label-${item.no}">
            ${SCALE_LABELS[currentScore]?.short || ""}
          </div>
        </td>
        <td>
          <textarea class="form-textarea" data-telaah-comment="${item.no}" placeholder="Tuliskan komentar kritis...">${escapeHtml(currentComment)}</textarea>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // Isi butir 16, 17, 18
  const kelebihanEl = document.getElementById("telaah-kelebihan");
  const tingkatkanEl = document.getElementById("telaah-tingkatkan");
  const rekomendasiEl = document.getElementById("telaah-rekomendasi");

  if (kelebihanEl) {
    kelebihanEl.value = teacher.telaah?.kelebihan || "";
    kelebihanEl.oninput = (e) => {
      teacher.telaah.kelebihan = e.target.value;
      saveState();
    };
  }
  if (tingkatkanEl) {
    tingkatkanEl.value = teacher.telaah?.perluDitingkatkan || "";
    tingkatkanEl.oninput = (e) => {
      teacher.telaah.perluDitingkatkan = e.target.value;
      saveState();
    };
  }
  if (rekomendasiEl) {
    rekomendasiEl.value = teacher.telaah?.rekomendasi || "";
    rekomendasiEl.oninput = (e) => {
      teacher.telaah.rekomendasi = e.target.value;
      saveState();
    };
  }

  // Event Listener Tombol Skala
  tbody.querySelectorAll("button[data-telaah-no]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const no = Number(btn.dataset.telaahNo);
      const val = Number(btn.dataset.val);
      if (!teacher.telaah) teacher.telaah = { scores: {}, comments: {} };
      teacher.telaah.scores[no] = val;
      saveState();

      // Update tombol aktif
      tbody.querySelectorAll(`button[data-telaah-no="${no}"]`).forEach((b) => {
        b.classList.toggle("active", Number(b.dataset.val) === val);
      });
      const lbl = document.getElementById(`telaah-scale-label-${no}`);
      if (lbl) lbl.textContent = SCALE_LABELS[val]?.short || "";
      updateTelaahSummaryHeader(teacher);
    });
  });

  // Event Listener Komentar Kritis
  tbody.querySelectorAll("textarea[data-telaah-comment]").forEach((ta) => {
    ta.addEventListener("input", () => {
      const no = Number(ta.dataset.telaahComment);
      if (!teacher.telaah.comments) teacher.telaah.comments = {};
      teacher.telaah.comments[no] = ta.value;
      saveState();
    });
  });
}

function updateTelaahSummaryHeader(teacher) {
  const summaryEl = document.getElementById("telaah-score-summary");
  if (!summaryEl) return;
  const sc = calcInstrumentScore(teacher.telaah?.scores);
  const cat = getCategoryInfo(sc.nilai);
  summaryEl.innerHTML = `
    <div style="font-size:0.82rem; color:var(--text-secondary);">Skor Perolehan: <strong>${sc.raw} / ${sc.max}</strong></div>
    <div style="font-size:1.25rem; font-weight:800; color:var(--primary);">
      Nilai: ${sc.nilai} <span class="badge ${cat.badgeClass}">${cat.label}</span>
    </div>
  `;
}

// ==========================================
// 4. RENDER INSTRUMEN OBSERVASI PELAKSANAAN (LAMPIRAN 6)
// ==========================================
function renderObservasiForm() {
  populateTeacherSelects();
  const teacher = getSelectedTeacher();
  const tbody = document.getElementById("lampiran-6-tbody");
  if (!teacher || !tbody) return;

  const metaEl = document.getElementById("observasi-teacher-meta");
  if (metaEl) {
    metaEl.textContent = `NIP: ${teacher.nip || "-"} | ${teacher.kelasMapel} | Tgl Supervisi: ${teacher.tanggalSupervisi || "-"}`;
  }

  updateObservasiSummaryHeader(teacher);

  let lastCategory = "";
  let html = "";

  LAMPIRAN_6_ITEMS.forEach((item) => {
    if (item.kategori !== lastCategory) {
      lastCategory = item.kategori;
      html += `
        <tr class="category-row">
          <td colspan="5">${escapeHtml(item.kategori)}</td>
        </tr>
      `;
    }

    const currentScore = Number(teacher.observasi?.scores?.[item.no] ?? 3);
    const currentBukti = teacher.observasi?.bukti?.[item.no] || "";
    const currentCatatan = teacher.observasi?.catatan?.[item.no] || "";

    const descExtraHtml = item.deskripsiTambahan
      ? `<div class="desc-extra">${escapeHtml(item.deskripsiTambahan)}</div>`
      : "";

    const subHtml =
      item.subItems && item.subItems.length > 0
        ? `<ul class="sub-item-list">${item.subItems.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
        : "";

    const scaleButtons = [0, 1, 2, 3, 4]
      .map(
        (val) => `
        <button type="button" class="scale-btn ${currentScore === val ? "active" : ""}" data-obs-no="${item.no}" data-val="${val}" title="${SCALE_LABELS[val].short}">
          ${val}
        </button>
      `
      )
      .join("");

    html += `
      <tr>
        <td style="text-align:center; font-weight:700;">${item.no}</td>
        <td>
          <div>${escapeHtml(item.aspek)}</div>
          ${descExtraHtml}
          ${subHtml}
        </td>
        <td style="text-align:center;">
          <div class="scale-selector">${scaleButtons}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;" id="obs-scale-label-${item.no}">
            ${SCALE_LABELS[currentScore]?.short || ""}
          </div>
        </td>
        <td>
          <textarea class="form-textarea" data-obs-bukti="${item.no}" placeholder="Bukti perilaku/kegiatan nyata di kelas...">${escapeHtml(currentBukti)}</textarea>
        </td>
        <td>
          <textarea class="form-textarea" data-obs-catatan="${item.no}" placeholder="Catatan supervisor...">${escapeHtml(currentCatatan)}</textarea>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // Isi butir 16, 17, 18
  const kelebihanEl = document.getElementById("observasi-kelebihan");
  const tingkatkanEl = document.getElementById("observasi-tingkatkan");
  const rekomendasiEl = document.getElementById("observasi-rekomendasi");

  if (kelebihanEl) {
    kelebihanEl.value = teacher.observasi?.kelebihan || "";
    kelebihanEl.oninput = (e) => {
      teacher.observasi.kelebihan = e.target.value;
      saveState();
    };
  }
  if (tingkatkanEl) {
    tingkatkanEl.value = teacher.observasi?.perluDitingkatkan || "";
    tingkatkanEl.oninput = (e) => {
      teacher.observasi.perluDitingkatkan = e.target.value;
      saveState();
    };
  }
  if (rekomendasiEl) {
    rekomendasiEl.value = teacher.observasi?.rekomendasi || "";
    rekomendasiEl.oninput = (e) => {
      teacher.observasi.rekomendasi = e.target.value;
      saveState();
    };
  }

  // Event Listener Tombol Skala Observasi
  tbody.querySelectorAll("button[data-obs-no]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const no = Number(btn.dataset.obsNo);
      const val = Number(btn.dataset.val);
      if (!teacher.observasi) teacher.observasi = { scores: {}, bukti: {}, catatan: {} };
      teacher.observasi.scores[no] = val;
      saveState();

      tbody.querySelectorAll(`button[data-obs-no="${no}"]`).forEach((b) => {
        b.classList.toggle("active", Number(b.dataset.val) === val);
      });
      const lbl = document.getElementById(`obs-scale-label-${no}`);
      if (lbl) lbl.textContent = SCALE_LABELS[val]?.short || "";
      updateObservasiSummaryHeader(teacher);
    });
  });

  // Event Listener Bukti & Catatan
  tbody.querySelectorAll("textarea[data-obs-bukti]").forEach((ta) => {
    ta.addEventListener("input", () => {
      const no = Number(ta.dataset.obsBukti);
      if (!teacher.observasi.bukti) teacher.observasi.bukti = {};
      teacher.observasi.bukti[no] = ta.value;
      saveState();
    });
  });

  tbody.querySelectorAll("textarea[data-obs-catatan]").forEach((ta) => {
    ta.addEventListener("input", () => {
      const no = Number(ta.dataset.obsCatatan);
      if (!teacher.observasi.catatan) teacher.observasi.catatan = {};
      teacher.observasi.catatan[no] = ta.value;
      saveState();
    });
  });
}

function updateObservasiSummaryHeader(teacher) {
  const summaryEl = document.getElementById("observasi-score-summary");
  if (!summaryEl) return;
  const sc = calcInstrumentScore(teacher.observasi?.scores);
  const cat = getCategoryInfo(sc.nilai);
  summaryEl.innerHTML = `
    <div style="font-size:0.82rem; color:var(--text-secondary);">Skor Perolehan: <strong>${sc.raw} / ${sc.max}</strong></div>
    <div style="font-size:1.25rem; font-weight:800; color:var(--emerald);">
      Nilai: ${sc.nilai} <span class="badge ${cat.badgeClass}">${cat.label}</span>
    </div>
  `;
}

// ==========================================
// 5. RENDER EVALUASI, REFLEKSI & RTL (LAMPIRAN 3)
// ==========================================
function generateSmartRtlForTeacher(teacher) {
  const summary = calcTeacherSummary(teacher);
  const obsScores = teacher.observasi?.scores || {};
  const telScores = teacher.telaah?.scores || {};

  // Cek aspek dengan skor rendah (<=2)
  const lowActiveLearning = (obsScores[3] ?? 3) <= 2 || (obsScores[4] ?? 3) <= 2 || (obsScores[11] ?? 3) <= 2;
  const lowContextual = (obsScores[9] ?? 3) <= 2 || (telScores[8] ?? 3) <= 2;
  const lowHotsAssessment = (obsScores[14] ?? 3) <= 2 || (obsScores[15] ?? 3) <= 2 || (telScores[15] ?? 3) <= 2;
  const lowKkaDigital = (obsScores[6] ?? 3) <= 2 || (telScores[6] ?? 3) <= 2;

  if (lowKkaDigital) {
    return {
      hasilEvaluasiManual: `Skor ${summary.finalScore} (${summary.category.lower}), belum ada KKA`,
      refleksiPenyebab: "Belum memahami konsep CT dan KKA",
      tindakLanjut: "Mengintegrasikan aktivitas berpikir komputasional sederhana",
      peranKepsek: "Coaching & contoh praktik KKA",
      waktu: "2 minggu (awal Mei 2026)"
    };
  }
  if (lowHotsAssessment) {
    return {
      hasilEvaluasiManual: `Skor ${summary.finalScore} (${summary.category.lower}), asesmen masih LOTS`,
      refleksiPenyebab: "Belum memahami penyusunan soal HOTS",
      tindakLanjut: "Menyusun soal HOTS dan rubrik sederhana",
      peranKepsek: "Pelatihan dan review soal bersama",
      waktu: "1 minggu (akhir April 2026)"
    };
  }
  if (lowContextual) {
    return {
      hasilEvaluasiManual: `Skor ${summary.finalScore} (${summary.category.lower}), belum kontekstual`,
      refleksiPenyebab: "Pembelajaran belum dikaitkan dengan kehidupan nyata",
      tindakLanjut: "Menerapkan pembelajaran kontekstual berbasis masalah sederhana",
      peranKepsek: "Pendampingan penyusunan skenario kontekstual",
      waktu: "2 minggu (akhir April 2026)"
    };
  }
  if (lowActiveLearning) {
    return {
      hasilEvaluasiManual: `Skor ${summary.finalScore} (${summary.category.lower}), keterlibatan murid rendah`,
      refleksiPenyebab: "Aktivitas pembelajaran kurang variatif, dominan ceramah",
      tindakLanjut: "Menerapkan diskusi kelompok, ice breaking, dan pertanyaan terbuka",
      peranKepsek: "Coaching & modeling pembelajaran aktif",
      waktu: "2 minggu (akhir April 2026)"
    };
  }

  return {
    hasilEvaluasiManual: `Skor ${summary.finalScore} (${summary.category.lower}), penguatan refleksi metakognisi`,
    refleksiPenyebab: "Tahap merefleksi di akhir pembelajaran masih singkat",
    tindakLanjut: "Memfasilitasi jurnal refleksi mandiri dan berbagi praktik baik di komunitas belajar (PLC)",
    peranKepsek: "Mentoring & fasilitasi berbagi praktik baik (PLC)",
    waktu: "2 minggu"
  };
}

function renderRtlTab() {
  const container = document.getElementById("rtl-cards-container");
  if (!container) return;

  container.innerHTML = appState.teachers
    .map((t, idx) => {
      const s = calcTeacherSummary(t);
      const rtl = t.rtl || {};
      return `
        <div class="card" style="margin-bottom:0; border-left:4px solid var(--primary);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.9rem;">
            <div>
              <h3 style="margin:0; font-size:1rem;">${idx + 1}. ${escapeHtml(t.nama)} <span style="font-weight:400; color:var(--text-secondary);">(${escapeHtml(t.kelasMapel)})</span></h3>
              <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.15rem;">
                Telaah RPP: <strong>${s.telaah.nilai}</strong> | Observasi Kelas: <strong>${s.observasi.nilai}</strong> | Skor Akhir: <strong>${s.finalScore} (${s.category.label})</strong>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" data-auto-rtl="${escapeHtml(t.id)}">
              ✨ Rekomendasi Otomatis dari Skor
            </button>
          </div>

          <div class="form-grid" style="margin-bottom:0;">
            <div class="form-field">
              <label>Hasil Evaluasi (Data &amp; Skor)</label>
              <input type="text" class="form-input" data-rtl-field="hasilEvaluasiManual" data-tid="${escapeHtml(t.id)}" value="${escapeHtml(rtl.hasilEvaluasiManual || "")}" />
            </div>
            <div class="form-field">
              <label>Refleksi (Analisis Penyebab)</label>
              <input type="text" class="form-input" data-rtl-field="refleksiPenyebab" data-tid="${escapeHtml(t.id)}" value="${escapeHtml(rtl.refleksiPenyebab || "")}" />
            </div>
            <div class="form-field">
              <label>Tindak Lanjut (Perbaikan Spesifik)</label>
              <input type="text" class="form-input" data-rtl-field="tindakLanjut" data-tid="${escapeHtml(t.id)}" value="${escapeHtml(rtl.tindakLanjut || "")}" />
            </div>
            <div class="form-field">
              <label>Peran Kepala Sekolah (Coaching/Mentoring/Pelatihan)</label>
              <input type="text" class="form-input" data-rtl-field="peranKepsek" data-tid="${escapeHtml(t.id)}" value="${escapeHtml(rtl.peranKepsek || "")}" />
            </div>
            <div class="form-field">
              <label>Waktu Pelaksanaan</label>
              <input type="text" class="form-input" data-rtl-field="waktu" data-tid="${escapeHtml(t.id)}" value="${escapeHtml(rtl.waktu || "")}" />
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("input[data-rtl-field]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const tid = inp.dataset.tid;
      const field = inp.dataset.rtlField;
      const teacher = appState.teachers.find((x) => x.id === tid);
      if (teacher) {
        if (!teacher.rtl) teacher.rtl = {};
        teacher.rtl[field] = inp.value;
        saveState();
      }
    });
  });

  container.querySelectorAll("button[data-auto-rtl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tid = btn.dataset.autoRtl;
      const teacher = appState.teachers.find((x) => x.id === tid);
      if (teacher) {
        teacher.rtl = {
          ...teacher.rtl,
          ...generateSmartRtlForTeacher(teacher)
        };
        saveState();
        renderRtlTab();
        showToast(`Rekomendasi RTL untuk ${teacher.nama} berhasil diperbarui dari analisis skor.`);
      }
    });
  });
}

// ==========================================
// 5B. ANALISIS HASIL SUPERVISI MENDALAM
// ==========================================
const ANALISIS_CONSTRUCT_MAP = [
  {
    id: 1,
    kategori: "Keselarasan",
    judul: "Keselarasan Tujuan, Langkah & Asesmen dengan Dimensi Profil Lulusan",
    lamp5No: 1,
    lamp6No: 2
  },
  {
    id: 2,
    kategori: "Keselarasan",
    judul: "Keselarasan Antara Perencanaan dan Implementasi Alur Pembelajaran (Awal, Inti, Penutup)",
    lamp5No: 2,
    lamp6No: 1
  },
  {
    id: 3,
    kategori: "Kerangka Pembelajaran",
    judul: "Praktik Pedagogis (Active Learning, Inkuiri, Pengalaman Autentik & Berpikir Tingkat Tinggi)",
    lamp5No: 3,
    lamp6No: 3
  },
  {
    id: 4,
    kategori: "Kerangka Pembelajaran",
    judul: "Lingkungan Pembelajaran (Aman Psikis, Inklusif & Kolaborasi Bersama)",
    lamp5No: 4,
    lamp6No: 4
  },
  {
    id: 5,
    kategori: "Kerangka Pembelajaran",
    judul: "Kemitraan Pembelajaran (Agensi Murid, Suara & Pilihan, Kolaborasi)",
    lamp5No: 5,
    lamp6No: 5
  },
  {
    id: 6,
    kategori: "Kerangka Pembelajaran",
    judul: "Pemanfaatan Digital & Integrasi Berpikir Komputasional / KKA",
    lamp5No: 6,
    lamp6No: 6
  },
  {
    id: 7,
    kategori: "Langkah Pembelajaran PM",
    judul: "Pengalaman Belajar MEMAHAMI (Konstruksi Pengetahuan, Eksplorasi & Karakter)",
    lamp5No: 7,
    lamp6No: 8
  },
  {
    id: 8,
    kategori: "Langkah Pembelajaran PM",
    judul: "Pengalaman Belajar MENGAPLIKASI (Pemecahan Masalah Kontekstual & Solusi Inovatif)",
    lamp5No: 8,
    lamp6No: 9
  },
  {
    id: 9,
    kategori: "Langkah Pembelajaran PM",
    judul: "Pengalaman Belajar MEREFLEKSI (Evaluasi Diri, Metakognisi & Regulasi Emosi)",
    lamp5No: 9,
    lamp6No: 10
  },
  {
    id: 10,
    kategori: "Langkah Pembelajaran PM",
    judul: "Tindakan Saling MEMULIAKAN (Verbal/Nonverbal, Inklusif & Menghargai Keberagaman)",
    lamp5No: 10,
    lamp6No: 7
  },
  {
    id: 11,
    kategori: "Prinsip Pembelajaran Mendalam",
    judul: "Penerapan Prinsip Berkesadaran, Bermakna, dan Menggembirakan",
    lamp5No: 11,
    lamp6No: 11
  },
  {
    id: 12,
    kategori: "Prinsip Pembelajaran Mendalam",
    judul: "Akomodasi Karakteristik Peserta Didik (Minat, Bakat, Perkembangan & Gaya Belajar)",
    lamp5No: 12,
    lamp6No: 12
  },
  {
    id: 13,
    kategori: "Asesmen Pembelajaran",
    judul: "Asesmen Awal Pembelajaran (Kesiapan Emosional, Mental & Pengetahuan Awal)",
    lamp5No: 13,
    lamp6No: 13
  },
  {
    id: 14,
    kategori: "Asesmen Pembelajaran",
    judul: "Asesmen Selama Proses Pembelajaran (Umpan Balik Kontinyu & Beragam Teknik)",
    lamp5No: 14,
    lamp6No: 14
  },
  {
    id: 15,
    kategori: "Asesmen Pembelajaran",
    judul: "Asesmen Hasil Pembelajaran (Bukti Pencapaian Kompetensi Berbasis HOTS, Proyek/Portofolio)",
    lamp5No: 15,
    lamp6No: 15
  }
];

function computeSupervisionAnalysis(scope = "all") {
  const targetTeachers =
    scope === "all"
      ? appState.teachers
      : appState.teachers.filter((t) => t.id === scope);

  const count = targetTeachers.length || 1;

  let totalTelaah = 0;
  let totalObs = 0;
  let totalFinal = 0;

  const teacherComparisons = targetTeachers.map((t) => {
    const sum = calcTeacherSummary(t);
    totalTelaah += sum.telaah.nilai;
    totalObs += sum.observasi.nilai;
    totalFinal += sum.finalScore;
    const gap = sum.observasi.nilai - sum.telaah.nilai;
    let gapStatus = "Selaras & Konsisten";
    let gapBadge = "badge-baik";
    if (gap <= -5) {
      gapStatus = "Implementasi Kelas di Bawah RPP";
      gapBadge = "badge-cukup";
    } else if (gap >= 5) {
      gapStatus = "Praktik Kelas Melampaui RPP";
      gapBadge = "badge-sangat-baik";
    }
    return {
      teacher: t,
      telaahNilai: sum.telaah.nilai,
      obsNilai: sum.observasi.nilai,
      finalScore: sum.finalScore,
      category: sum.category,
      gap,
      gapStatus,
      gapBadge
    };
  });

  const avgTelaah = Math.round(totalTelaah / count);
  const avgObs = Math.round(totalObs / count);
  const avgFinal = Math.round(totalFinal / count);
  const avgGap = avgObs - avgTelaah;

  // Hitung analisis per konstruk indikator (1-15)
  const itemsAnalysis = ANALISIS_CONSTRUCT_MAP.map((c) => {
    let sumL5 = 0;
    let sumL6 = 0;
    targetTeachers.forEach((t) => {
      sumL5 += Number(t.telaah?.scores?.[c.lamp5No] ?? 0);
      sumL6 += Number(t.observasi?.scores?.[c.lamp6No] ?? 0);
    });
    const avgL5Scale = sumL5 / count;
    const avgL6Scale = sumL6 / count;
    const combinedScale = (avgL5Scale + avgL6Scale) / 2;
    const pct = Math.round((combinedScale / 4) * 100);

    let diagLabel = "Baik / Terpenuhi";
    let diagBadge = "badge-baik";
    if (pct >= 85) {
      diagLabel = "Kekuatan Utama";
      diagBadge = "badge-sangat-baik";
    } else if (pct <= 65) {
      diagLabel = "Prioritas Perbaikan";
      diagBadge = "badge-kurang";
    } else if (pct <= 74) {
      diagLabel = "Perlu Penguatan";
      diagBadge = "badge-cukup";
    }

    return {
      ...c,
      avgL5Scale: Number(avgL5Scale.toFixed(2)),
      avgL6Scale: Number(avgL6Scale.toFixed(2)),
      combinedScale: Number(combinedScale.toFixed(2)),
      pct,
      diagLabel,
      diagBadge
    };
  });

  const sortedLowest = [...itemsAnalysis].sort((a, b) => a.pct - b.pct);
  const sortedHighest = [...itemsAnalysis].sort((a, b) => b.pct - a.pct);

  // Dimensi Pembelajaran Mendalam
  const calcGroupPct = (ids) => {
    const sub = itemsAnalysis.filter((x) => ids.includes(x.id));
    if (!sub.length) return 0;
    return Math.round(sub.reduce((acc, cur) => acc + cur.pct, 0) / sub.length);
  };

  const dimensions = [
    { label: "Pengalaman Belajar: MEMAHAMI", pct: calcGroupPct([7]), color: "#2563eb" },
    { label: "Pengalaman Belajar: MENGAPLIKASI (Kontekstual)", pct: calcGroupPct([8]), color: "#059669" },
    { label: "Pengalaman Belajar: MEREFLEKSI (Metakognisi)", pct: calcGroupPct([9]), color: "#7c3aed" },
    { label: "Tindakan Saling MEMULIAKAN & Inklusivitas", pct: calcGroupPct([10]), color: "#0d9488" },
    { label: "Prinsip Berkesadaran, Bermakna, Menggembirakan", pct: calcGroupPct([11, 12]), color: "#d97706" },
    { label: "Kerangka Pedagogis, Lingkungan & Kemitraan", pct: calcGroupPct([3, 4, 5]), color: "#4f46e5" },
    { label: "Pemanfaatan Digital & Integrasi KKA / CT", pct: calcGroupPct([6]), color: "#e11d48" },
    { label: "Kualitas Asesmen Awal, Proses & Hasil (HOTS)", pct: calcGroupPct([13, 14, 15]), color: "#ea580c" }
  ];

  // Kuadran Pemetaan Pendidik
  const quadrants = {
    plc: [],
    coachingActive: [],
    trainingTechnical: [],
    mentoringIntensive: []
  };

  targetTeachers.forEach((t) => {
    const sum = calcTeacherSummary(t);
    const obs = t.observasi?.scores || {};
    const tel = t.telaah?.scores || {};
    if (sum.finalScore >= 80) {
      quadrants.plc.push({ teacher: t, score: sum.finalScore });
    } else if (sum.finalScore < 65) {
      quadrants.mentoringIntensive.push({ teacher: t, score: sum.finalScore });
    } else if ((obs[6] ?? 3) <= 2 || (tel[6] ?? 3) <= 2 || (obs[14] ?? 3) <= 2 || (obs[15] ?? 3) <= 2) {
      quadrants.trainingTechnical.push({ teacher: t, score: sum.finalScore });
    } else {
      quadrants.coachingActive.push({ teacher: t, score: sum.finalScore });
    }
  });

  // Sintesis Narasi Otomatis
  const topStrengths = sortedHighest.slice(0, 2).map((x) => x.judul).join("; ");
  const topWeaknesses = sortedLowest.slice(0, 3).map((x) => x.judul).join("; ");
  const scopeTitle =
    scope === "all"
      ? `Seluruh Pendidik ${appState.schoolInfo.namaSekolah} (${targetTeachers.length} Guru)`
      : `${targetTeachers[0]?.nama} (${targetTeachers[0]?.kelasMapel})`;

  const narrativeText =
    `Berdasarkan analisis kuantitatif dan kualitatif hasil supervisi akademik pada ${scopeTitle}, diperoleh rata-rata Telaah Perencanaan (Lampiran 5) sebesar ${avgTelaah} dan rata-rata Observasi Pelaksanaan (Lampiran 6) sebesar ${avgObs}, dengan Skor Akhir Supervisi ${avgFinal} (Kategori ${getCategoryInfo(avgFinal).label}). ` +
    `Kekuatan utama pembelajaran terletak pada aspek: ${topStrengths}. ` +
    `Namun demikian, masih ditemukan kesenjangan yang memerlukan prioritas perbaikan pada aspek: ${topWeaknesses}. ` +
    `Melalui refleksi berbasis data, permasalahan utama berkaitan dengan variasi strategi pembelajaran aktif, pengaitan materi dengan konteks nyata, penyusunan asesmen berbasis HOTS, serta penguatan konsep Berpikir Komputasional (CT) dan Koding & Kecerdasan Artifisial (KKA). ` +
    `Oleh karena itu, tindak lanjut Kepala Sekolah difokuskan pada coaching, modeling pembelajaran kontekstual, serta pelatihan terfokus secara berkelanjutan.`;

  return {
    scope,
    scopeTitle,
    avgTelaah,
    avgObs,
    avgFinal,
    avgGap,
    teacherComparisons,
    itemsAnalysis,
    sortedLowest,
    sortedHighest,
    dimensions,
    quadrants,
    narrativeText
  };
}

function renderAnalisisTab() {
  populateTeacherSelects();
  const scopeSelect = document.getElementById("select-analisis-scope");
  const sortSelect = document.getElementById("select-analisis-sort");
  const scope = scopeSelect?.value || "all";
  const sortMode = sortSelect?.value || "lowest";

  const analysis = computeSupervisionAnalysis(scope);
  const finalCat = getCategoryInfo(analysis.avgFinal);
  const darkestWeakness = analysis.sortedLowest[0];
  const strongestItem = analysis.sortedHighest[0];

  // 1. KPI Grid
  const kpiGrid = document.getElementById("analisis-kpi-grid");
  if (kpiGrid) {
    const gapText =
      analysis.avgGap === 0
        ? "Selaras (0 Poin)"
        : analysis.avgGap > 0
        ? `+${analysis.avgGap} Poin (Praktik > RPP)`
        : `${analysis.avgGap} Poin (Praktik < RPP)`;

    kpiGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Skor Gabungan &amp; Mutu</span>
        <span class="stat-value">${analysis.avgFinal} <span class="badge ${finalCat.badgeClass}" style="vertical-align:middle;">${finalCat.label}</span></span>
        <span class="stat-meta">${escapeHtml(analysis.scopeTitle)}</span>
      </div>
      <div class="stat-card stat-emerald">
        <span class="stat-label">Selisih Perencanaan vs Pelaksanaan</span>
        <span class="stat-value" style="font-size:1.35rem;">${gapText}</span>
        <span class="stat-meta">RPP: <strong>${analysis.avgTelaah}</strong> vs Observasi: <strong>${analysis.avgObs}</strong></span>
      </div>
      <div class="stat-card stat-purple">
        <span class="stat-label">Indikator Terkuat (Strength)</span>
        <span class="stat-value" style="font-size:1.25rem;">${strongestItem ? strongestItem.pct + "%" : "-"}</span>
        <span class="stat-meta">${escapeHtml(strongestItem ? strongestItem.judul.slice(0, 58) + "..." : "-")}</span>
      </div>
      <div class="stat-card stat-accent">
        <span class="stat-label">Prioritas Perbaikan Utama (Gap)</span>
        <span class="stat-value" style="font-size:1.25rem;">${darkestWeakness ? darkestWeakness.pct + "%" : "-"}</span>
        <span class="stat-meta">${escapeHtml(darkestWeakness ? darkestWeakness.judul.slice(0, 58) + "..." : "-")}</span>
      </div>
    `;
  }

  // 2. Gap Perencanaan vs Pelaksanaan
  const gapContainer = document.getElementById("analisis-gap-plan-exec");
  if (gapContainer) {
    gapContainer.innerHTML = analysis.teacherComparisons
      .map((tc) => {
        const diffSign = tc.gap > 0 ? `+${tc.gap}` : `${tc.gap}`;
        return `
          <div style="padding:0.75rem 0.9rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); margin-bottom:0.65rem; background:var(--bg-app);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
              <div>
                <strong>${escapeHtml(tc.teacher.nama)}</strong>
                <span style="font-size:0.8rem; color:var(--text-secondary);">(${escapeHtml(tc.teacher.kelasMapel)})</span>
              </div>
              <span class="badge ${tc.gapBadge}">Δ ${diffSign} • ${tc.gapStatus}</span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; font-size:0.78rem;">
              <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                  <span>Telaah RPP (Lamp. 5)</span>
                  <strong>${tc.telaahNilai}</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${tc.telaahNilai}%; background:#2563eb;"></div>
                </div>
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                  <span>Observasi Kelas (Lamp. 6)</span>
                  <strong>${tc.obsNilai}</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${tc.obsNilai}%; background:#059669;"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // 3. Peta Ketercapaian Dimensi Pembelajaran Mendalam
  const dimContainer = document.getElementById("analisis-dimension-breakdown");
  if (dimContainer) {
    dimContainer.innerHTML = analysis.dimensions
      .map(
        (d) => `
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:600; margin-bottom:0.25rem;">
            <span>${escapeHtml(d.label)}</span>
            <span>${d.pct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${d.pct}%; background:${d.color};"></div>
          </div>
        </div>
      `
      )
      .join("");
  }

  // 4. Kuadran Pemetaan Pendampingan
  const quadContainer = document.getElementById("analisis-quadrant-container");
  if (quadContainer) {
    const renderList = (arr, emptyMsg) =>
      arr.length === 0
        ? `<div style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">${emptyMsg}</div>`
        : arr
            .map(
              (item) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.45rem 0.65rem; background:#ffffff; border:1px solid var(--border-color); border-radius:6px; margin-top:0.4rem; font-size:0.83rem;">
                <div><strong>${escapeHtml(item.teacher.nama)}</strong> — <span style="color:var(--text-secondary);">${escapeHtml(item.teacher.fokusMasalah || "")}</span></div>
                <span class="badge ${getCategoryInfo(item.score).badgeClass}">Skor ${item.score}</span>
              </div>
            `
            )
            .join("");

    quadContainer.innerHTML = `
      <div style="padding:1rem; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:var(--radius-sm);">
        <div style="font-weight:700; color:#166534; font-size:0.92rem;">🌟 Kuadran I: Praktik Baik &amp; Pengimbasan (PLC)</div>
        <div style="font-size:0.78rem; color:#15803d; margin-bottom:0.5rem;">Skor ≥ 80 • Dilibatkan sebagai guru model / fasilitator Komunitas Belajar</div>
        ${renderList(analysis.quadrants.plc, "Belum ada pendidik pada kuadran ini.")}
      </div>

      <div style="padding:1rem; border:1px solid #bfdbfe; background:#eff6ff; border-radius:var(--radius-sm);">
        <div style="font-weight:700; color:#1e40af; font-size:0.92rem;">🤝 Kuadran II: Coaching &amp; Modeling Pembelajaran Aktif/Kontekstual</div>
        <div style="font-size:0.78rem; color:#1d4ed8; margin-bottom:0.5rem;">Fokus penguatan keterlibatan murid, inkuiri, dan skenario masalah kontekstual</div>
        ${renderList(analysis.quadrants.coachingActive, "Tidak ada pendidik pada kuadran ini.")}
      </div>

      <div style="padding:1rem; border:1px solid #fde68a; background:#fffbeb; border-radius:var(--radius-sm);">
        <div style="font-weight:700; color:#92400e; font-size:0.92rem;">🛠️ Kuadran III: Pelatihan Terfokus &amp; Klinik Asesmen HOTS / KKA</div>
        <div style="font-size:0.78rem; color:#b45309; margin-bottom:0.5rem;">Fokus bedah penyusunan soal HOTS, rubrik autentik, serta konsep CT &amp; KKA</div>
        ${renderList(analysis.quadrants.trainingTechnical, "Tidak ada pendidik pada kuadran ini.")}
      </div>

      <div style="padding:1rem; border:1px solid #fecdd3; background:#fff1f2; border-radius:var(--radius-sm);">
        <div style="font-weight:700; color:#9f1239; font-size:0.92rem;">🧭 Kuadran IV: Mentoring &amp; Pendampingan Intensif</div>
        <div style="font-size:0.78rem; color:#be123c; margin-bottom:0.5rem;">Skor &lt; 65 • Pendampingan bertahap dari telaah RPP hingga supervisi ulang</div>
        ${renderList(analysis.quadrants.mentoringIntensive, "Tidak ada pendidik pada kuadran ini.")}
      </div>
    `;
  }

  // 5. Tabel Analisis Per Butir Indikator
  const itemTbody = document.getElementById("analisis-item-tbody");
  if (itemTbody) {
    let list = [...analysis.itemsAnalysis];
    if (sortMode === "lowest") list.sort((a, b) => a.pct - b.pct);
    if (sortMode === "highest") list.sort((a, b) => b.pct - a.pct);
    if (sortMode === "number") list.sort((a, b) => a.id - b.id);

    itemTbody.innerHTML = list
      .map(
        (item) => `
        <tr>
          <td style="text-align:center; font-weight:700;">${item.id}</td>
          <td><span style="font-weight:600; color:var(--primary); font-size:0.82rem;">${escapeHtml(item.kategori)}</span></td>
          <td>
            <div style="font-weight:600;">${escapeHtml(item.judul)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Lampiran 5 Butir #${item.lamp5No} • Lampiran 6 Butir #${item.lamp6No}</div>
          </td>
          <td style="text-align:center; font-weight:700;">${item.avgL5Scale} <span style="font-weight:400; color:var(--text-muted);">/ 4.00</span></td>
          <td style="text-align:center; font-weight:700;">${item.avgL6Scale} <span style="font-weight:400; color:var(--text-muted);">/ 4.00</span></td>
          <td style="text-align:center;">
            <div style="font-weight:800; color:var(--text-main);">${item.pct}% (${item.combinedScale}/4)</div>
            <div class="progress-track" style="margin-top:0.25rem;">
              <div class="progress-fill" style="width:${item.pct}%;"></div>
            </div>
          </td>
          <td><span class="badge ${item.diagBadge}">${item.diagLabel}</span></td>
        </tr>
      `
      )
      .join("");
  }

  // 6. Kotak Sintesis Narasi
  const narrativeBox = document.getElementById("analisis-narrative-box");
  if (narrativeBox) {
    narrativeBox.innerHTML = `<p style="margin:0;">${escapeHtml(analysis.narrativeText)}</p>`;
  }

  // 7. Analisis Komparasi Tren Antar-Periode
  renderPeriodComparison();
}

// ==========================================
// 5C. ASISTEN AI SUPERVISI PEMBELAJARAN MENDALAM
// ==========================================
const GEMINI_KEY_STORAGE = "SIM_SPM_GEMINI_API_KEY";
let aiChatMessages = [
  {
    role: "ai",
    text: "Halo Ibu/Bapak Kepala Sekolah & Supervisor SMA NEGERI 1 LENTENG SUMENEP! 👋\nSaya Asisten AI Supervisi Pembelajaran Mendalam. Anda dapat menggunakan 5 tombol Generator AI di atas (Dialog Coaching TIRTA, Umpan Balik Memuliakan, Desain CT & KKA, Soal HOTS, atau Rekomendasi Program KS), atau menanyakan apa saja di kolom chat ini."
  }
];
let lastAiGeneratedAction = "feedback";

function getGeminiApiKey() {
  return localStorage.getItem(GEMINI_KEY_STORAGE) || "";
}

function updateAiModeBadge() {
  const badge = document.getElementById("ai-mode-badge");
  const keyInput = document.getElementById("input-gemini-key");
  const key = getGeminiApiKey();
  if (keyInput && key) {
    keyInput.value = key;
  }
  if (badge) {
    if (key) {
      badge.className = "badge badge-sangat-baik";
      badge.textContent = "☁️ Cloud Gemini AI + Pakar PM Aktif";
    } else {
      badge.className = "badge badge-baik";
      badge.textContent = "⚡ AI Pakar PM Lokal Aktif (Tanpa Kuota)";
    }
  }
}

function buildTeacherDiagnosticContext(teacher) {
  const sum = calcTeacherSummary(teacher);
  const lowL5 = [];
  const lowL6 = [];
  const highItems = [];

  LAMPIRAN_5_ITEMS.forEach((it) => {
    const v = Number(teacher.telaah?.scores?.[it.no] ?? 3);
    if (v <= 2) lowL5.push(`Butir ${it.no} (${it.kategori}: ${it.aspek.slice(0, 70)}...)`);
    if (v === 4) highItems.push(it.kategori);
  });

  LAMPIRAN_6_ITEMS.forEach((it) => {
    const v = Number(teacher.observasi?.scores?.[it.no] ?? 3);
    if (v <= 2) lowL6.push(`Butir ${it.no} (${it.kategori}: ${it.aspek.slice(0, 70)}...)`);
    if (v === 4) highItems.push(it.kategori);
  });

  return {
    sum,
    lowL5,
    lowL6,
    highItems
  };
}

function generateLocalAiSupervision(actionType, teacher) {
  const s = appState.schoolInfo;
  const diag = buildTeacherDiagnosticContext(teacher);
  const mapel = teacher.kelasMapel || "Mata Pelajaran SMA";
  const fokus = teacher.fokusMasalah || "penguatan pembelajaran mendalam";

  if (actionType === "coaching") {
    return (
      `🗣️ NASKAH DIALOG COACHING PASCA-OBSERVASI (ALUR TIRTA)\n` +
      `Sekolah       : ${s.namaSekolah}\n` +
      `Coach (KS)    : ${s.kepalaSekolah}\n` +
      `Coachee (Guru): ${teacher.nama} (${mapel})\n` +
      `Data Supervisi: Nilai Telaah RPP ${diag.sum.telaah.nilai} | Nilai Observasi Kelas ${diag.sum.observasi.nilai} | Skor Akhir ${diag.sum.finalScore} (${diag.sum.category.label})\n` +
      `Fokus Temuan  : ${fokus}\n` +
      `====================================================================\n\n` +
      `1. TUJUAN UTAMA (T) — Membangun Kemitraan Setara & Menyepakati Tujuan\n` +
      `• Kepala Sekolah: "Terima kasih Ibu/Bapak ${teacher.nama} telah memfasilitasi pembelajaran di ${mapel} dengan penuh dedikasi. Dari sesi perbincangan refleksi kita hari ini, apa tujuan atau harapan yang ingin Ibu/Bapak capai untuk peningkatan kualitas belajar murid ke depan?"\n` +
      `• ${teacher.nama}: "Saya ingin mendiskusikan hasil observasi tadi, khususnya bagaimana mengatasi kendala '${fokus}' agar murid lebih antusias, berkesadaran, dan memahami materi secara mendalam."\n\n` +
      `2. IDENTIFIKASI (I) — Menggali Kekuatan & Analisis Penyebab Berbasis Data\n` +
      `• Kepala Sekolah: "Berdasarkan catatan observasi, suasana kelas Ibu/Bapak sudah sangat memuliakan murid dan alur pembelajaran berjalan tertib (Skor Akhir ${diag.sum.finalScore}). Menurut Ibu/Bapak, apa hal yang sudah berjalan paling baik, dan apa yang menyebabkan '${fokus}' masih terjadi di kelas?"\n` +
      `• ${teacher.nama}: "${teacher.rtl?.refleksiPenyebab || "Saya menyadari strategi pembelajaran masih perlu divariasikan agar lebih kontekstual dan berpusat pada murid."}"\n` +
      `• Kepala Sekolah: "Analisis yang sangat jujur dan tepat. Jika pada skala 1–10 posisi keterlibatan dan pemahaman mendalam murid saat ini berada di angka 6, Ibu/Bapak ingin meningkatkannya ke angka berapa dalam 2 minggu ke depan?"\n\n` +
      `3. RENCANA AKSI (R) — Merumuskan Perbaikan Spesifik Sesuai Prinsip PM & KKA\n` +
      `• Kepala Sekolah: "Strategi konkret apa yang akan Ibu/Bapak terapkan pada pertemuan ${mapel} berikutnya untuk mewujudkan pengalaman belajar Memahami, Mengaplikasi, dan Merefleksi yang lebih optimal?"\n` +
      `• ${teacher.nama}: "Saya berencana: (1) ${teacher.rtl?.tindakLanjut || "Menerapkan pembelajaran kolaboratif berbasis masalah kontekstual"}, (2) Menyisipkan aktivitas berpikir komputasional (dekomposisi masalah & pengenalan pola), serta (3) Memperkuat sesi refleksi metakognisi di akhir jam pelajaran."\n\n` +
      `4. TANGGUNG JAWAB (TA) — Komitmen, Dukungan Kepala Sekolah & Jadwal Tindak Lanjut\n` +
      `• Kepala Sekolah: "Rencana yang sangat terukur! Untuk mendukung Ibu/Bapak, saya akan berperan melalui '${teacher.rtl?.peranKepsek || "Coaching & pendampingan penyusunan skenario pembelajaran"}'. Kapan kita mulai menerapkan revisi modul ajar ini dan siapa rekan sejawat di Komunitas Belajar (PLC) ${s.namaSekolah} yang dapat diajak berkolaborasi?"\n` +
      `• ${teacher.nama}: "Saya akan menyelesaikan revisi modul ajar minggu ini dan mengimplementasikannya sesuai target waktu: ${teacher.rtl?.waktu || "2 minggu ke depan"}."`
    );
  }

  if (actionType === "feedback") {
    const lowL5Text =
      diag.lowL5.length > 0
        ? diag.lowL5.join("; ")
        : "Pendalaman skenario eksplorasi kontekstual dan integrasi literasi digital/KKA";
    const lowL6Text =
      diag.lowL6.length > 0
        ? diag.lowL6.join("; ")
        : "Penguatan agensi murid (suara & pilihan) serta kedalaman refleksi metakognisi";

    return (
      `💬 REKOMENDASI UMPAN BALIK KONSTRUKTIF & MEMULIAKAN (SIAP DITERAPKAN)\n` +
      `Pendidik : ${teacher.nama} (${mapel}) — ${s.namaSekolah}\n` +
      `Skor     : Telaah RPP ${diag.sum.telaah.nilai} | Observasi ${diag.sum.observasi.nilai} | Akhir ${diag.sum.finalScore} (${diag.sum.category.label})\n` +
      `====================================================================\n\n` +
      `A. REKOMENDASI ISIAN LAMPIRAN 5 (TELAAH PERENCANAAN PEMBELAJARAN)\n` +
      `• [Butir 16 - Kelebihan Perencanaan]:\n` +
      `  "Dokumen modul ajar ${mapel} telah menyelaraskan tujuan pembelajaran, langkah kegiatan, dan asesmen menuju pencapaian Dimensi Profil Lulusan dengan struktur yang sistematis."\n` +
      `• [Butir 17 - Hal yang Perlu Ditingkatkan]:\n` +
      `  "Perlu penguatan operasional pada: ${lowL5Text}, khususnya terkait fokus '${fokus}'."\n` +
      `• [Butir 18 - Rekomendasi & Revisi Sesuai Prinsip PM & KKA]:\n` +
      `  "Merevisi langkah kegiatan inti dengan mempertajam alur Memahami, Mengaplikasi (kontekstual), dan Merefleksi (metakognisi), serta mengintegrasikan aktivitas Berpikir Komputasional (CT/KKA) dan asesmen HOTS."\n\n` +
      `B. REKOMENDASI ISIAN LAMPIRAN 6 (OBSERVASI PELAKSANAAN PEMBELAJARAN)\n` +
      `• [Butir 16 - Kelebihan Pelaksanaan]:\n` +
      `  "Pendidik menunjukkan komunikasi verbal dan nonverbal yang saling memuliakan murid, menciptakan iklim kelas yang aman secara psikis dan inklusif di ${s.namaSekolah}."\n` +
      `• [Butir 17 - Hal yang Perlu Ditingkatkan]:\n` +
      `  "Optimalisasi praktik kelas pada aspek: ${lowL6Text}, sehingga murid lebih aktif mengonstruksi pemahaman mendalam."\n` +
      `• [Butir 18 - Rekomendasi Tindak Lanjut PM & KKA]:\n` +
      `  "${teacher.rtl?.tindakLanjut || "Menerapkan diskusi kolaboratif berbasis masalah kontekstual, asesmen HOTS, dan aktivitas berpikir komputasional"} dengan dukungan ${teacher.rtl?.peranKepsek || "Coaching Kepala Sekolah"}."\n\n` +
      `💡 Tips: Klik tombol "⚡ Terapkan ke Instrumen & RTL Guru Ini" di kanan atas kotak ini untuk langsung mengisi otomatis Butir 16–18 pada Lampiran 5, Lampiran 6, dan RTL!`
    );
  }

  if (actionType === "kka") {
    return (
      `💻 DESAIN INTEGRASI BERPIKIR KOMPUTASIONAL (CT) & KKA\n` +
      `Mata Pelajaran / Kelas : ${mapel} (${teacher.nama})\n` +
      `Satuan Pendidikan      : ${s.namaSekolah}\n` +
      `====================================================================\n\n` +
      `Berikut skenario konkret mengintegrasikan Computational Thinking (CT) dan Koding & Kecerdasan Artifisial (KKA) ke dalam 3 Pengalaman Belajar Pembelajaran Mendalam:\n\n` +
      `1. Tahap MEMAHAMI (Dekomposisi & Pengenalan Pola):\n` +
      `   • Aktivitas Murid: Murid memecah topik/fenomena kompleks pada ${mapel} menjadi bagian-bagian kecil yang lebih mudah dianalisis (Dekomposisi), lalu mengidentifikasi pola keteraturan atau hubungan sebab-akibat dari data/sumber belajar (Pengenalan Pola).\n` +
      `   • Pemanfaatan Digital/AI: Murid membandingkan informasi dari buku teks dengan hasil eksplorasi simulasi interaktif atau prompt AI secara kritis (literasi AI berkesadaran).\n\n` +
      `2. Tahap MENGAPLIKASI (Abstraksi & Perancangan Algoritma):\n` +
      `   • Aktivitas Murid: Murid menyaring informasi inti yang relevan untuk menyelesaikan studi kasus nyata di lingkungan Kabupaten Sumenep (Abstraksi), kemudian menyusun langkah-langkah solusi secara logis, berurutan, dan terstruktur dalam bentuk diagram alir / flowchart atau pseudocode sederhana (Algoritma).\n` +
      `   • Keterkaitan 6C: Melatih Critical Thinking, Collaboration, dan Creativity murid melalui proyek kelompok.\n\n` +
      `3. Tahap MEREFLEKSI (Debugging & Evaluasi Metakognisi):\n` +
      `   • Aktivitas Murid: Murid menguji efektivitas solusi yang mereka rancang, menemukan letak kekeliruan logika (debugging proses berpikir), dan menuliskan refleksi mandiri tentang strategi belajar yang paling efektif bagi mereka.`
    );
  }

  if (actionType === "hots") {
    return (
      `🧠 GENERATOR CONTOH INSTRUMEN ASESMEN HOTS & RUBRIK AUTENTIK\n` +
      `Mata Pelajaran / Kelas : ${mapel} (${teacher.nama})\n` +
      `Satuan Pendidikan      : ${s.namaSekolah}\n` +
      `====================================================================\n\n` +
      `1. STIMULUS KONTEKSTUAL (Berbasis Kehidupan Nyata di Kabupaten Sumenep):\n` +
      `   Sajikan data/fenomena autentik di sekitar Lenteng / Sumenep (misalnya ekosistem lokal, potensi pertanian/kelautan, isu sosial-budaya, atau transformasi digital masyarakat) yang berkaitan langsung dengan kompetensi ${mapel}.\n\n` +
      `2. BUTIR PERTANYAAN BERJENJANG HOTS:\n` +
      `   • Level C4 (Menganalisis): "Berdasarkan data/fenomena di atas, analisislah faktor penyebab utama dan hubungan antarvariabel yang memengaruhi permasalahan tersebut menggunakan konsep ${mapel}!"\n` +
      `   • Level C5 (Mengevaluasi): "Bandingkan dua alternatif solusi berikut. Manakah solusi yang paling efektif, etis, dan berkelanjutan untuk diterapkan di lingkungan sekitar kita? Berikan argumen ilmiahmu!"\n` +
      `   • Level C6 (Mencipta/Mengkreasi): "Rancanglah sebuah gagasan solusi inovatif atau alur langkah sistematis (algoritma tindakan) yang dapat diterapkan oleh generasi muda di Sumenep untuk mengatasi masalah tersebut!"\n\n` +
      `3. RUBRIK PENILAIAN AUTENTIK (Skala 1–4):\n` +
      `   • Skor 4 (Sangat Baik): Analisis tajam berbasis bukti, mampu mengaitkan konsep dengan konteks nyata secara akurat, dan merumuskan solusi inovatif yang logis.\n` +
      `   • Skor 3 (Baik): Analisis tepat dan relevan dengan konteks, namun elaborasi alternatif solusi masih dapat diperdalam.\n` +
      `   • Skor 2 (Kurang): Penjelasan masih bersifat tekstual/menghafal (LOTS) dan belum dikaitkan dengan konteks masalah.\n` +
      `   • Skor 1 (Sangat Kurang): Belum mampu mengidentifikasi konsep dasar maupun menjawab permasalahan.`
    );
  }

  // Default / policy
  const schoolAnalysis = computeSupervisionAnalysis("all");
  return (
    `🏛️ REKOMENDASI KEBIJAKAN & PROGRAM TINDAK LANJUT KEPALA SEKOLAH\n` +
    `Satuan Pendidikan : ${s.namaSekolah}\n` +
    `Kepala Sekolah    : ${s.kepalaSekolah}\n` +
    `Rata-rata Sekolah : Telaah RPP ${schoolAnalysis.avgTelaah} | Observasi ${schoolAnalysis.avgObs} | Skor Akhir ${schoolAnalysis.avgFinal}\n` +
    `====================================================================\n\n` +
    `1. DIAGNOSIS EKSEKUTIF TINGKAT SEKOLAH:\n` +
    `   ${schoolAnalysis.narrativeText}\n\n` +
    `2. PROGRAM PRIORITAS KEPALA SEKOLAH (SIKLUS RTL 4 MINGGU):\n` +
    `   • Minggu 1 (Klinik Modul Ajar PM & Asesmen HOTS): Bedah bersama instrumen asesmen level C4–C6 dan penyelarasan pengalaman belajar Memahami, Mengaplikasi, Merefleksi.\n` +
    `   • Minggu 2 (Coaching & Modeling Kelas Kontekstual): Pendampingan individual berbasis alur TIRTA bagi pendidik dengan fokus keaktifan murid dan pembelajaran kontekstual.\n` +
    `   • Minggu 3 (Workshop Integrasi CT & KKA): Praktik penyusunan aktivitas berpikir komputasional (unplugged & plugged) lintas mata pelajaran di ${s.namaSekolah}.\n` +
    `   • Minggu 4 (Berbagi Praktik Baik di Komunitas Belajar / PLC & Supervisi Ulang): Refleksi kolektif dan pemantauan dampak perbaikan terhadap kualitas belajar murid.`
  );
}

async function callOptionalGeminiApi(promptText) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200
      }
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function runAiGeneratorAction(actionType) {
  lastAiGeneratedAction = actionType;
  const teacher = getSelectedTeacher();
  if (!teacher) return;

  const outputBox = document.getElementById("ai-output-box");
  const outputTitle = document.getElementById("ai-output-title");
  if (!outputBox) return;

  const titles = {
    coaching: `🗣️ Naskah Dialog Coaching TIRTA — ${teacher.nama}`,
    feedback: `💬 Umpan Balik Konstruktif & Memuliakan — ${teacher.nama}`,
    kka: `💻 Desain Integrasi CT & KKA — ${teacher.nama} (${teacher.kelasMapel})`,
    hots: `🧠 Generator Soal & Rubrik HOTS — ${teacher.nama} (${teacher.kelasMapel})`,
    policy: `🏛️ Rekomendasi Program Tindak Lanjut — ${appState.schoolInfo.namaSekolah}`
  };
  if (outputTitle) outputTitle.textContent = titles[actionType] || "✨ Hasil Analisis AI";

  const localText = generateLocalAiSupervision(actionType, teacher);
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    outputBox.textContent = localText;
    return;
  }

  outputBox.textContent = "⏳ Sedang menyusun rekomendasi cerdas melalui Cloud Gemini AI...";
  try {
    const diag = buildTeacherDiagnosticContext(teacher);
    const prompt =
      `Anda adalah Pakar Supervisi Pembelajaran Mendalam untuk Kepala Sekolah ${appState.schoolInfo.namaSekolah} (${appState.schoolInfo.kepalaSekolah}). ` +
      `Data Pendidik: ${teacher.nama}, Mengampu: ${teacher.kelasMapel}, Skor Telaah RPP: ${diag.sum.telaah.nilai}, Skor Observasi: ${diag.sum.observasi.nilai}, Skor Akhir: ${diag.sum.finalScore}, Fokus Masalah: ${teacher.fokusMasalah}. ` +
      `Berdasarkan konteks tersebut, susunlah dokumen berikut secara terstruktur dan aplikatif dalam Bahasa Indonesia:\n\n${localText}`;
    const cloudResult = await callOptionalGeminiApi(prompt);
    outputBox.textContent = cloudResult || localText;
  } catch (err) {
    console.warn("Cloud AI gagal, menggunakan Pakar AI Lokal:", err);
    outputBox.textContent = localText;
  }
}

function renderAiChatHistory() {
  const container = document.getElementById("ai-chat-history");
  if (!container) return;
  container.innerHTML = aiChatMessages
    .map((m) => {
      const isUser = m.role === "user";
      return `
        <div style="align-self:${isUser ? "flex-end" : "flex-start"}; max-width:85%; background:${isUser ? "var(--primary)" : "#ffffff"}; color:${isUser ? "#ffffff" : "var(--text-main)"}; border:1px solid ${isUser ? "var(--primary)" : "var(--border-color)"}; padding:0.75rem 1rem; border-radius:12px; font-size:0.86rem; white-space:pre-wrap; box-shadow:var(--shadow-sm);">
          <div style="font-weight:700; font-size:0.75rem; margin-bottom:0.25rem; opacity:0.85;">${isUser ? "👤 Anda (Kepala Sekolah / Supervisor)" : "🤖 Konsultan AI Supervisi PM"}</div>
          <div>${escapeHtml(m.text)}</div>
        </div>
      `;
    })
    .join("");
  container.scrollTop = container.scrollHeight;
}

async function handleAiChatQuestion(question) {
  const q = question.trim();
  if (!q) return;

  aiChatMessages.push({ role: "user", text: q });
  renderAiChatHistory();

  const teacher = getSelectedTeacher();
  const s = appState.schoolInfo;
  const lowerQ = q.toLowerCase();

  // Cek apakah pertanyaan menyebut nama guru tertentu
  const matchedTeacher =
    appState.teachers.find((t) => lowerQ.includes(t.nama.toLowerCase())) || teacher;

  let localReply = "";
  if (lowerQ.includes("ceramah") || lowerQ.includes("keterlibatan") || lowerQ.includes("aktif")) {
    localReply =
      `💡 Strategi Mengatasi Dominan Ceramah & Meningkatkan Keterlibatan Murid di ${s.namaSekolah}:\n\n` +
      `1. Terapkan Aturan 10-20-70: Maksimal 10% pengantar konsep oleh guru, 20% pemantik diskusi/inkuiri, dan 70% aktivitas eksplorasi kolaboratif oleh murid.\n` +
      `2. Gunakan Teknik Think-Pair-Share & Pertanyaan Terbuka: Sebelum menjelaskan, minta murid mengamati fenomena nyata lalu berdiskusi berpasangan.\n` +
      `3. Pendampingan Kepala Sekolah: Lakukan modeling singkat (co-teaching) bersama ${matchedTeacher?.nama || "guru"} untuk mempraktikkan ice breaking terarah dan pembagian peran dalam kelompok.`;
  } else if (lowerQ.includes("kontekstual") || lowerQ.includes("sumenep") || lowerQ.includes("mengaplikasi")) {
    localReply =
      `🌴 Ide Pembelajaran Kontekstual (Tahap MENGAPLIKASI) untuk Siswa ${s.namaSekolah}:\n\n` +
      `1. Kaitkan materi ${matchedTeacher?.kelasMapel || "pelajaran"} dengan permasalahan autentik di Kecamatan Lenteng & Kabupaten Sumenep (misalnya: ketahanan pangan lokal, konservasi lingkungan pesisir/daratan Madura, ekonomi kreatif lokal, atau efisiensi energi).\n` +
      `2. Gunakan Problem-Based Learning (PBL) Sederhana: Murid diminta mengamati kasus nyata di sekitar tempat tinggal mereka, menganalisis penyebabnya, dan mempresentasikan solusi inovatif.\n` +
      `3. Hasil supervisi menunjukkan pendekatan kontekstual sangat efektif meningkatkan pengalaman belajar yang Bermakna (Meaningful).`;
  } else if (lowerQ.includes("kka") || lowerQ.includes("koding") || lowerQ.includes("komputasional") || lowerQ.includes("ct")) {
    localReply = generateLocalAiSupervision("kka", matchedTeacher);
  } else if (lowerQ.includes("hots") || lowerQ.includes("asesmen") || lowerQ.includes("soal") || lowerQ.includes("lots")) {
    localReply = generateLocalAiSupervision("hots", matchedTeacher);
  } else if (lowerQ.includes("refleksi") || lowerQ.includes("metakognisi") || lowerQ.includes("merefleksi")) {
    localReply =
      `🪞 Panduan Memfasilitasi Tahap MEREFLEKSI (Metakognisi & Regulasi Diri):\n\n` +
      `Gunakan 4 pertanyaan pemantik reflektif berikut di 10 menit terakhir pembelajaran:\n` +
      `1. [Evaluasi Diri]: "Konsep penting apa yang paling mengubah cara pandangmu hari ini?"\n` +
      `2. [Strategi Berpikir]: "Strategi apa yang kamu gunakan saat menghadapi bagian tersulit dari tugas tadi?"\n` +
      `3. [Regulasi Emosi]: "Bagaimana perasaanmu selama bekerja dalam kelompok, dan bagaimana kamu mengelola rasa bingung/kesulitan tadi?"\n` +
      `4. [Tindak Lanjut Mandiri]: "Apa satu tindakan nyata yang akan kamu terapkan setelah keluar dari kelas ini?"`;
  } else if (lowerQ.includes("coaching") || lowerQ.includes("tirta")) {
    localReply = generateLocalAiSupervision("coaching", matchedTeacher);
  } else {
    localReply =
      `📌 Analisis Konsultan AI untuk ${matchedTeacher?.nama || s.namaSekolah} (${matchedTeacher?.kelasMapel || ""}):\n\n` +
      `• Skor Saat Ini: Telaah RPP ${calcTeacherSummary(matchedTeacher).telaah.nilai} | Observasi Kelas ${calcTeacherSummary(matchedTeacher).observasi.nilai} | Skor Akhir ${calcTeacherSummary(matchedTeacher).finalScore}\n` +
      `• Fokus Temuan: ${matchedTeacher?.fokusMasalah || "-"}\n` +
      `• Rekomendasi Tindak Lanjut: ${matchedTeacher?.rtl?.tindakLanjut || "Penguatan pembelajaran mendalam berbasis kolaborasi dan konteks nyata"}\n` +
      `• Peran Kepala Sekolah (${s.kepalaSekolah}): ${matchedTeacher?.rtl?.peranKepsek || "Coaching & pendampingan berkelanjutan"}.\n\n` +
      `Silakan klik salah satu dari 5 tombol Generator AI di atas jika Anda ingin naskah lengkap Dialog Coaching, Umpan Balik Lampiran 5 & 6, Skenario KKA, atau Soal HOTS!`;
  }

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const prompt =
        `Anda adalah Konsultan AI Supervisi Pembelajaran Mendalam untuk Kepala Sekolah ${s.namaSekolah} (${s.kepalaSekolah}). ` +
        `Konteks Guru: ${matchedTeacher?.nama} (${matchedTeacher?.kelasMapel}), Fokus Masalah: ${matchedTeacher?.fokusMasalah}. ` +
        `Jawablah pertanyaan berikut secara praktis, hangat, memuliakan, dan sesuai kerangka Pembelajaran Mendalam (Memahami, Mengaplikasi, Merefleksi, Berkesadaran, Bermakna, Menggembirakan, serta KKA):\n\nPertanyaan: ${q}`;
      const cloudAns = await callOptionalGeminiApi(prompt);
      if (cloudAns) localReply = cloudAns;
    } catch (err) {
      console.warn("Fallback ke respons AI lokal:", err);
    }
  }

  aiChatMessages.push({ role: "ai", text: localReply });
  renderAiChatHistory();
}

function renderAiTab() {
  populateTeacherSelects();
  updateAiModeBadge();
  renderAiChatHistory();
  runAiGeneratorAction(lastAiGeneratedAction || "coaching");
}

// ==========================================
// 6. RENDER LAPORAN RESMI & CETAK (LAMPIRAN 3, ANALISIS, 5, 6)
// ==========================================
function renderReportPreview() {
  populateTeacherSelects();
  const typeSelect = document.getElementById("select-report-type");
  const teacherSelect = document.getElementById("select-report-teacher");
  const container = document.getElementById("report-preview-container");
  if (!typeSelect || !container) return;

  const mode = typeSelect.value;
  if (teacherSelect) {
    teacherSelect.style.display = mode === "lampiran3" || mode === "analisis" ? "none" : "inline-block";
  }

  const s = appState.schoolInfo;

  if (mode === "analisis") {
    const analysis = computeSupervisionAnalysis("all");
    const compRows = analysis.teacherComparisons
      .map(
        (tc, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${escapeHtml(tc.teacher.nama)}<br/><span style="font-size:0.78rem; color:#475569;">${escapeHtml(tc.teacher.kelasMapel)}</span></td>
          <td style="text-align:center;">${tc.telaahNilai}</td>
          <td style="text-align:center;">${tc.obsNilai}</td>
          <td style="text-align:center; font-weight:700;">${tc.finalScore} (${tc.category.label})</td>
          <td style="text-align:center;">${tc.gap > 0 ? "+" + tc.gap : tc.gap} (${tc.gapStatus})</td>
          <td>${escapeHtml(tc.teacher.rtl?.tindakLanjut || "-")}</td>
        </tr>
      `
      )
      .join("");

    const itemRows = analysis.sortedLowest
      .map(
        (it) => `
        <tr>
          <td style="text-align:center;">${it.id}</td>
          <td>${escapeHtml(it.kategori)}</td>
          <td>${escapeHtml(it.judul)}</td>
          <td style="text-align:center;">${it.avgL5Scale}</td>
          <td style="text-align:center;">${it.avgL6Scale}</td>
          <td style="text-align:center; font-weight:700;">${it.pct}%</td>
          <td>${escapeHtml(it.diagLabel)}</td>
        </tr>
      `
      )
      .join("");

    container.innerHTML = `
      <div class="report-header-title">
        <h2>LAPORAN ANALISIS DIAGNOSTIK HASIL SUPERVISI PEMBELAJARAN MENDALAM</h2>
        <h3>${escapeHtml(s.namaSekolah)}</h3>
        <p>Tahun Pelajaran ${escapeHtml(s.tahunPelajaran)} – ${escapeHtml(s.semester)}</p>
        <p>Kepala Sekolah: ${escapeHtml(s.kepalaSekolah)}</p>
      </div>

      <div class="report-section">
        <h4>A. RINGKASAN EKSEKUTIF ANALISIS DATA SUPERVISI</h4>
        <p>${escapeHtml(analysis.narrativeText)}</p>
      </div>

      <div class="report-section">
        <h4>B. ANALISIS KESENJANGAN PERENCANAAN (LAMPIRAN 5) VS PELAKSANAAN (LAMPIRAN 6)</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width:36px;">No</th>
              <th>Nama Pendidik</th>
              <th>Telaah RPP</th>
              <th>Observasi Kelas</th>
              <th>Skor Akhir &amp; Mutu</th>
              <th>Selisih (Gap)</th>
              <th>Rekomendasi Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>${compRows}</tbody>
        </table>
      </div>

      <div class="report-section">
        <h4>C. PERINGKAT DIAGNOSTIK INDIKATOR (PRIORITAS PERBAIKAN → KEKUATAN UTAMA)</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width:36px;">No</th>
              <th style="width:18%;">Dimensi</th>
              <th>Indikator Pembelajaran Mendalam</th>
              <th>Rata-rata L5</th>
              <th>Rata-rata L6</th>
              <th>Capaian (%)</th>
              <th>Status Diagnostik</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div class="report-signature">
        <div class="signature-box">
          <div>${escapeHtml(s.kotaLaporan)}, ${escapeHtml(s.tanggalLaporan)}</div>
          <div>Kepala Sekolah</div>
          <div class="signature-space"></div>
          <div style="font-weight:700; text-decoration:underline;">${escapeHtml(s.kepalaSekolah)}</div>
          ${s.nipKepalaSekolah ? `<div style="font-size:0.82rem;">NIP. ${escapeHtml(s.nipKepalaSekolah)}</div>` : ""}
        </div>
      </div>
    `;
    return;
  }

  if (mode === "lampiran3") {
    const latarParagraphs = (s.latarBelakang || "")
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");

    const penutupParagraphs = (s.penutup || "")
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");

    const rowsHtml = appState.teachers
      .map((t, idx) => {
        const sum = calcTeacherSummary(t);
        const evaluasiText =
          t.rtl?.hasilEvaluasiManual ||
          `Skor ${sum.finalScore} (${sum.category.lower}), ${t.fokusMasalah || ""}`;
        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>${escapeHtml(t.nama)}</td>
            <td>${escapeHtml(evaluasiText)}</td>
            <td>${escapeHtml(t.rtl?.refleksiPenyebab || "-")}</td>
            <td>${escapeHtml(t.rtl?.tindakLanjut || "-")}</td>
            <td>${escapeHtml(t.rtl?.peranKepsek || "-")}</td>
            <td>${escapeHtml(t.rtl?.waktu || "-")}</td>
          </tr>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="report-header-title">
        <h2>LAPORAN EVALUASI, REFLEKSI, DAN TINDAK LANJUT</h2>
        <h3>HASIL SUPERVISI AKADEMIK</h3>
        <h3>${escapeHtml(s.namaSekolah)}</h3>
        <p>Tahun Pelajaran ${escapeHtml(s.tahunPelajaran)} – ${escapeHtml(s.semester)}</p>
        <p>Kepala Sekolah: ${escapeHtml(s.kepalaSekolah)}</p>
      </div>

      <div class="report-section">
        <h4>A. LATAR BELAKANG</h4>
        ${latarParagraphs}
      </div>

      <div class="report-section">
        <h4>B. TUJUAN</h4>
        <ol>
          <li>Mengidentifikasi hasil supervisi akademik secara objektif berbasis data</li>
          <li>Menganalisis penyebab kesenjangan pembelajaran</li>
          <li>Menetapkan prioritas perbaikan pembelajaran</li>
          <li>Menyusun tindak lanjut yang spesifik dan terukur</li>
          <li>Memastikan keberlanjutan perbaikan melalui monitoring</li>
        </ol>
      </div>

      <div class="report-section">
        <h4>C. SASARAN</h4>
        <p>${escapeHtml(s.sasaran)}</p>
      </div>

      <div class="report-section">
        <h4>D. RUANG LINGKUP</h4>
        <ol>
          <li>Evaluasi hasil supervisi (data &amp; skor)</li>
          <li>Refleksi berbasis analisis penyebab</li>
          <li>Penyusunan tindak lanjut (RTL)</li>
          <li>Pendampingan guru (coaching, mentoring, pelatihan)</li>
          <li>Monitoring dan supervisi ulang</li>
        </ol>
      </div>

      <div class="report-section">
        <h4>E. PROGRAM KEGIATAN</h4>
        <p><strong>1. Evaluasi</strong></p>
        <ul>
          <li>Mengumpulkan data pra-observasi, observasi, dan pasca-observasi</li>
          <li>Menganalisis data secara kuantitatif dan kualitatif</li>
          <li>Mengidentifikasi capaian dan kesenjangan pembelajaran</li>
        </ul>
        <p><strong>2. Refleksi</strong></p>
        <ul>
          <li>Mengkaji penyebab masalah pembelajaran</li>
          <li>Mengidentifikasi faktor pendukung dan penghambat</li>
          <li>Menentukan prioritas perbaikan</li>
        </ul>
        <p><strong>3. Tindak Lanjut</strong></p>
        <ul>
          <li>Menyusun perbaikan yang spesifik dan terukur</li>
          <li>Melaksanakan coaching, mentoring, atau pelatihan</li>
          <li>Menetapkan jadwal monitoring dan supervisi ulang</li>
        </ul>
      </div>

      <div class="report-section">
        <h4>F. HASIL EVALUASI, REFLEKSI, DAN TINDAK LANJUT</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width:36px;">No</th>
              <th style="width:14%;">Nama Pendidik</th>
              <th style="width:18%;">Hasil Evaluasi (Data &amp; Skor)</th>
              <th style="width:20%;">Refleksi (Analisis Penyebab)</th>
              <th style="width:21%;">Tindak Lanjut (Perbaikan Spesifik)</th>
              <th style="width:15%;">Peran Kepala Sekolah</th>
              <th style="width:12%;">Waktu</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="report-section">
        <h4>G. SIMPULAN</h4>
        <p>${escapeHtml(s.simpulan)}</p>
      </div>

      <div class="report-section">
        <h4>H. PENUTUP</h4>
        ${penutupParagraphs}
      </div>

      <div class="report-signature">
        <div class="signature-box">
          <div>${escapeHtml(s.kotaLaporan)}, ${escapeHtml(s.tanggalLaporan)}</div>
          <div>Kepala Sekolah</div>
          <div class="signature-space"></div>
          <div style="font-weight:700; text-decoration:underline;">${escapeHtml(s.kepalaSekolah)}</div>
          ${s.nipKepalaSekolah ? `<div style="font-size:0.82rem;">NIP. ${escapeHtml(s.nipKepalaSekolah)}</div>` : ""}
        </div>
      </div>
    `;
    return;
  }

  const teacher = getSelectedTeacher();
  if (!teacher) return;

  if (mode === "lampiran5") {
    const sc = calcInstrumentScore(teacher.telaah?.scores);
    const cat = getCategoryInfo(sc.nilai);
    let lastCat = "";
    let rowsHtml = "";

    LAMPIRAN_5_ITEMS.forEach((item) => {
      if (item.kategori !== lastCat) {
        lastCat = item.kategori;
        rowsHtml += `<tr><td colspan="7" style="font-weight:700; background:#f8fafc;">${escapeHtml(item.kategori)}</td></tr>`;
      }
      const val = Number(teacher.telaah?.scores?.[item.no] ?? 0);
      const comment = teacher.telaah?.comments?.[item.no] || "";
      const subHtml =
        item.subItems?.length
          ? `<div style="margin-top:0.25rem; font-size:0.8rem;">${item.subItems.map((x) => `<div>${escapeHtml(x)}</div>`).join("")}</div>`
          : "";

      rowsHtml += `
        <tr>
          <td style="text-align:center;">${item.no}</td>
          <td>${escapeHtml(item.aspek)}${subHtml}</td>
          <td style="text-align:center; width:28px;">${val === 0 ? "✓" : ""}</td>
          <td style="text-align:center; width:28px;">${val === 1 ? "✓" : ""}</td>
          <td style="text-align:center; width:28px;">${val === 2 ? "✓" : ""}</td>
          <td style="text-align:center; width:28px;">${val === 3 ? "✓" : ""}</td>
          <td style="text-align:center; width:28px;">${val === 4 ? "✓" : ""}</td>
          <td>${escapeHtml(comment)}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="report-header-title">
        <h2>INSTRUMEN TELAAH PERENCANAAN PEMBELAJARAN (LAMPIRAN 5)</h2>
        <h3>${escapeHtml(s.namaSekolah)}</h3>
        <p>Nama Pendidik: <strong>${escapeHtml(teacher.nama)}</strong> | Kelas/Mapel: <strong>${escapeHtml(teacher.kelasMapel)}</strong> | Tanggal: <strong>${escapeHtml(teacher.tanggalSupervisi || "-")}</strong></p>
        <p>Skor Perolehan: <strong>${sc.raw} / ${sc.max}</strong> | Nilai Akhir: <strong>${sc.nilai} (${cat.label})</strong></p>
      </div>

      <table class="report-table">
        <thead>
          <tr>
            <th rowspan="2" style="width:36px;">No</th>
            <th rowspan="2">Aspek yang diamati</th>
            <th colspan="5">Skala</th>
            <th rowspan="2" style="width:24%;">Komentar Kritis</th>
          </tr>
          <tr>
            <th>0</th><th>1</th><th>2</th><th>3</th><th>4</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr>
            <td style="text-align:center;">16</td>
            <td colspan="7"><strong>Tuliskan kelebihan Perencanaan Pembelajaran:</strong><br/>${escapeHtml(teacher.telaah?.kelebihan || "-")}</td>
          </tr>
          <tr>
            <td style="text-align:center;">17</td>
            <td colspan="7"><strong>Tuliskan hal yang perlu ditingkatkan dari Perencanaan Pembelajaran:</strong><br/>${escapeHtml(teacher.telaah?.perluDitingkatkan || "-")}</td>
          </tr>
          <tr>
            <td style="text-align:center;">18</td>
            <td colspan="7"><strong>Tuliskan rekomendasi dan lanjutkan dengan revisi Perencanaan Pembelajaran sesuai prinsip PM dan KKA:</strong><br/>${escapeHtml(teacher.telaah?.rekomendasi || "-")}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:0.82rem; margin-top:0.5rem;">
        <strong>Skala yang digunakan dalam menelaah:</strong> 0 = tidak ada | 1 = sangat kurang | 2 = kurang | 3 = baik | 4 = sangat baik
      </div>

      <div class="report-signature">
        <div class="signature-box">
          <div>${escapeHtml(s.kotaLaporan)}, ${escapeHtml(s.tanggalLaporan)}</div>
          <div>Supervisor / Kepala Sekolah</div>
          <div class="signature-space"></div>
          <div style="font-weight:700; text-decoration:underline;">${escapeHtml(s.kepalaSekolah)}</div>
        </div>
      </div>
    `;
    return;
  }

  if (mode === "lampiran6") {
    const sc = calcInstrumentScore(teacher.observasi?.scores);
    const cat = getCategoryInfo(sc.nilai);
    let lastCat = "";
    let rowsHtml = "";

    LAMPIRAN_6_ITEMS.forEach((item) => {
      if (item.kategori !== lastCat) {
        lastCat = item.kategori;
        rowsHtml += `<tr><td colspan="8" style="font-weight:700; background:#f8fafc;">${escapeHtml(item.kategori)}</td></tr>`;
      }
      const val = Number(teacher.observasi?.scores?.[item.no] ?? 0);
      const bukti = teacher.observasi?.bukti?.[item.no] || "";
      const catatan = teacher.observasi?.catatan?.[item.no] || "";
      const descExtra = item.deskripsiTambahan ? `<div style="font-size:0.78rem; font-style:italic;">${escapeHtml(item.deskripsiTambahan)}</div>` : "";
      const subHtml =
        item.subItems?.length
          ? `<div style="margin-top:0.25rem; font-size:0.78rem;">${item.subItems.map((x) => `<div>${escapeHtml(x)}</div>`).join("")}</div>`
          : "";

      rowsHtml += `
        <tr>
          <td style="text-align:center;">${item.no}</td>
          <td>${escapeHtml(item.aspek)}${descExtra}${subHtml}</td>
          <td style="text-align:center; width:26px;">${val === 0 ? "✓" : ""}</td>
          <td style="text-align:center; width:26px;">${val === 1 ? "✓" : ""}</td>
          <td style="text-align:center; width:26px;">${val === 2 ? "✓" : ""}</td>
          <td style="text-align:center; width:26px;">${val === 3 ? "✓" : ""}</td>
          <td style="text-align:center; width:26px;">${val === 4 ? "✓" : ""}</td>
          <td>${escapeHtml(bukti)}</td>
          <td>${escapeHtml(catatan)}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="report-header-title">
        <h2>INSTRUMEN OBSERVASI PELAKSANAAN PEMBELAJARAN (LAMPIRAN 6)</h2>
        <h3>${escapeHtml(s.namaSekolah)}</h3>
        <p>Nama Pendidik: <strong>${escapeHtml(teacher.nama)}</strong> | Kelas/Mapel: <strong>${escapeHtml(teacher.kelasMapel)}</strong> | Tanggal: <strong>${escapeHtml(teacher.tanggalSupervisi || "-")}</strong></p>
        <p>Skor Perolehan: <strong>${sc.raw} / ${sc.max}</strong> | Nilai Akhir: <strong>${sc.nilai} (${cat.label})</strong></p>
      </div>

      <table class="report-table">
        <thead>
          <tr>
            <th rowspan="2" style="width:34px;">No</th>
            <th rowspan="2">Aspek yang diamati</th>
            <th colspan="5">Skala</th>
            <th rowspan="2" style="width:18%;">Bukti Pembelajaran</th>
            <th rowspan="2" style="width:18%;">Catatan</th>
          </tr>
          <tr>
            <th>0</th><th>1</th><th>2</th><th>3</th><th>4</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr>
            <td style="text-align:center;">16</td>
            <td colspan="8"><strong>Tuliskan kelebihan pelaksanaan pembelajaran:</strong><br/>${escapeHtml(teacher.observasi?.kelebihan || "-")}</td>
          </tr>
          <tr>
            <td style="text-align:center;">17</td>
            <td colspan="8"><strong>Tuliskan hal yang perlu ditingkatkan dari pelaksanaan pembelajaran:</strong><br/>${escapeHtml(teacher.observasi?.perluDitingkatkan || "-")}</td>
          </tr>
          <tr>
            <td style="text-align:center;">18</td>
            <td colspan="8"><strong>Tuliskan rekomendasi dan lanjutkan dengan revisi pelaksanaan pembelajaran sesuai prinsip PM dan KKA:</strong><br/>${escapeHtml(teacher.observasi?.rekomendasi || "-")}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:0.82rem; margin-top:0.5rem;">
        <strong>Skala yang digunakan dalam menelaah:</strong> 0 = tidak ada | 1 = sangat kurang | 2 = kurang | 3 = baik | 4 = sangat baik
      </div>

      <div class="report-signature">
        <div class="signature-box">
          <div>${escapeHtml(s.kotaLaporan)}, ${escapeHtml(s.tanggalLaporan)}</div>
          <div>Supervisor / Kepala Sekolah</div>
          <div class="signature-space"></div>
          <div style="font-weight:700; text-decoration:underline;">${escapeHtml(s.kepalaSekolah)}</div>
        </div>
      </div>
    `;
  }
}

// ==========================================
// FITUR BANTU ISI KOMENTAR & CATATAN OTOMATIS
// ==========================================
function autoFillTelaahForTeacher(teacher) {
  if (!teacher.telaah.comments) teacher.telaah.comments = {};
  const lowItems = [];
  const goodItems = [];

  LAMPIRAN_5_ITEMS.forEach((item) => {
    const val = Number(teacher.telaah?.scores?.[item.no] ?? 3);
    if (val <= 2) {
      lowItems.push(item.aspek);
      if (!teacher.telaah.comments[item.no]) {
        teacher.telaah.comments[item.no] =
          "Perlu diperjelas langkah operasionalnya pada modul ajar agar selaras dengan prinsip Pembelajaran Mendalam.";
      }
    } else if (val >= 3) {
      goodItems.push(item.kategori);
      if (!teacher.telaah.comments[item.no]) {
        teacher.telaah.comments[item.no] = "Sudah tergambar dengan baik dan selaras dalam perencanaan.";
      }
    }
  });

  teacher.telaah.kelebihan =
    "Dokumen perencanaan telah menyelaraskan tujuan pembelajaran, langkah kegiatan, dan asesmen menuju pencapaian Dimensi Profil Lulusan.";
  teacher.telaah.perluDitingkatkan =
    lowItems.length > 0
      ? `Penguatan pada aspek: ${lowItems.slice(0, 2).join("; ")}.`
      : "Pendalaman variasi aktivitas kolaboratif dan eksplorasi kontekstual murid.";
  teacher.telaah.rekomendasi =
    "Merevisi modul ajar dengan memperkuat pengalaman belajar Memahami, Mengaplikasi, dan Merefleksi secara berkesadaran, bermakna, dan menggembirakan serta integrasi konsep berpikir komputasional (KKA).";

  saveState();
  renderTelaahForm();
  showToast("Komentar kritis & ringkasan telaah perencanaan berhasil dilengkapi.");
}

function autoFillObservasiForTeacher(teacher) {
  if (!teacher.observasi.bukti) teacher.observasi.bukti = {};
  if (!teacher.observasi.catatan) teacher.observasi.catatan = {};

  LAMPIRAN_6_ITEMS.forEach((item) => {
    const val = Number(teacher.observasi?.scores?.[item.no] ?? 3);
    if (val <= 2) {
      if (!teacher.observasi.bukti[item.no]) {
        teacher.observasi.bukti[item.no] = "Aktivitas murid pada aspek ini belum tampak optimal selama observasi.";
      }
      if (!teacher.observasi.catatan[item.no]) {
        teacher.observasi.catatan[item.no] = "Perlu ditindaklanjuti melalui coaching dan perbaikan skenario pembelajaran.";
      }
    } else {
      if (!teacher.observasi.bukti[item.no]) {
        teacher.observasi.bukti[item.no] = "Guru memfasilitasi interaksi dan aktivitas belajar murid dengan kondusif.";
      }
    }
  });

  teacher.observasi.kelebihan =
    "Suasana kelas kondusif, bahasa verbal dan nonverbal pendidik saling memuliakan murid, serta alur pembelajaran terlaksana tertib.";
  teacher.observasi.perluDitingkatkan =
    "Penguatan keterlibatan aktif murid dalam pemecahan masalah kontekstual, asesmen penalaran tingkat tinggi (HOTS), dan integrasi KKA.";
  teacher.observasi.rekomendasi =
    "Melaksanakan tindak lanjut melalui coaching/pendampingan terfokus dan revisi pelaksanaan pembelajaran sesuai prinsip Pembelajaran Mendalam (PM) dan KKA.";

  saveState();
  renderObservasiForm();
  showToast("Bukti pembelajaran, catatan, dan rekomendasi observasi berhasil dilengkapi.");
}

// ==========================================
// CRUD PENDIDIK & MODAL PENGATURAN
// ==========================================
function openSchoolModal() {
  const modal = document.getElementById("modal-school");
  const s = appState.schoolInfo;
  document.getElementById("input-school-name").value = s.namaSekolah || "";
  document.getElementById("input-school-year").value = s.tahunPelajaran || "";
  document.getElementById("input-school-semester").value = s.semester || "";
  document.getElementById("input-principal-name").value = s.kepalaSekolah || "";
  document.getElementById("input-principal-nip").value = s.nipKepalaSekolah || "";
  document.getElementById("input-report-city").value = s.kotaLaporan || "";
  document.getElementById("input-report-date").value = s.tanggalLaporan || "";
  document.getElementById("input-report-latar").value = s.latarBelakang || "";
  document.getElementById("input-report-sasaran").value = s.sasaran || "";
  document.getElementById("input-report-simpulan").value = s.simpulan || "";
  document.getElementById("input-report-penutup").value = s.penutup || "";
  modal.showModal();
}

function openAddTeacherModal() {
  const modal = document.getElementById("modal-teacher");
  document.getElementById("modal-teacher-title").textContent = "Tambah Data Pendidik Baru";
  document.getElementById("teacher-id-input").value = "";
  document.getElementById("teacher-name-input").value = "";
  document.getElementById("teacher-nip-input").value = "";
  document.getElementById("teacher-mapel-input").value = "";
  document.getElementById("teacher-date-input").value = new Date().toISOString().slice(0, 10);
  document.getElementById("teacher-focus-preset").value = "";
  document.getElementById("teacher-focus-input").value = "";
  modal.showModal();
}

window.openEditTeacherModal = function (teacherId) {
  const teacher = appState.teachers.find((t) => t.id === teacherId);
  if (!teacher) return;
  const modal = document.getElementById("modal-teacher");
  document.getElementById("modal-teacher-title").textContent = `Edit Data Pendidik: ${teacher.nama}`;
  document.getElementById("teacher-id-input").value = teacher.id;
  document.getElementById("teacher-name-input").value = teacher.nama || "";
  document.getElementById("teacher-nip-input").value = teacher.nip || "";
  document.getElementById("teacher-mapel-input").value = teacher.kelasMapel || "";
  document.getElementById("teacher-date-input").value = teacher.tanggalSupervisi || "";
  document.getElementById("teacher-focus-preset").value = "";
  document.getElementById("teacher-focus-input").value = teacher.fokusMasalah || "";
  modal.showModal();
};

window.deleteTeacher = function (teacherId) {
  const teacher = appState.teachers.find((t) => t.id === teacherId);
  if (!teacher) return;
  if (!confirm(`Hapus data supervisi untuk "${teacher.nama}"?`)) return;
  appState.teachers = appState.teachers.filter((t) => t.id !== teacherId);
  if (selectedTeacherId === teacherId) {
    selectedTeacherId = appState.teachers[0]?.id || "";
  }
  saveState();
  renderDashboard();
  showToast(`Data ${teacher.nama} telah dihapus.`);
};

// ==========================================
// EKSPOR CSV & BACKUP/RESTORE JSON
// ==========================================
function exportRekapCsv() {
  const headers = [
    "No",
    "Nama Pendidik",
    "NIP",
    "Kelas/Mapel",
    "Tanggal Supervisi",
    "Nilai Telaah RPP (Lamp 5)",
    "Nilai Observasi (Lamp 6)",
    "Skor Akhir",
    "Predikat",
    "Hasil Evaluasi (Data & Skor)",
    "Refleksi (Analisis Penyebab)",
    "Tindak Lanjut (Perbaikan Spesifik)",
    "Peran Kepala Sekolah",
    "Waktu"
  ];

  const rows = appState.teachers.map((t, idx) => {
    const s = calcTeacherSummary(t);
    return [
      idx + 1,
      t.nama,
      t.nip || "",
      t.kelasMapel || "",
      t.tanggalSupervisi || "",
      s.telaah.nilai,
      s.observasi.nilai,
      s.finalScore,
      s.category.label,
      t.rtl?.hasilEvaluasiManual || "",
      t.rtl?.refleksiPenyebab || "",
      t.rtl?.tindakLanjut || "",
      t.rtl?.peranKepsek || "",
      t.rtl?.waktu || ""
    ];
  });

  const csvContent =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rekap_Supervisi_Pembelajaran_Mendalam_${appState.schoolInfo.namaSekolah.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Berkas CSV berhasil diunduh.");
}

function exportJsonBackup() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Backup_Supervisi_PM_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Backup data JSON berhasil diunduh.");
}

// ==========================================
// INISIALISASI EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Kontrol Periode Supervisi Global
  document.getElementById("select-global-period")?.addEventListener("change", (e) => {
    switchPeriod(e.target.value);
  });

  document.getElementById("btn-open-add-period")?.addEventListener("click", () => {
    openPeriodModal("add");
  });

  document.getElementById("btn-open-manage-periods")?.addEventListener("click", () => {
    openPeriodModal("list");
  });

  document.getElementById("btn-close-period-modal")?.addEventListener("click", () => {
    document.getElementById("modal-period")?.close();
  });

  document.getElementById("btn-close-period-modal-2")?.addEventListener("click", () => {
    document.getElementById("modal-period")?.close();
  });

  document.getElementById("btn-cancel-add-period")?.addEventListener("click", () => {
    setPeriodModalSubview("list");
  });

  document.getElementById("btn-subtab-period-list")?.addEventListener("click", () => {
    setPeriodModalSubview("list");
  });

  document.getElementById("btn-subtab-period-add")?.addEventListener("click", () => {
    setPeriodModalSubview("add");
  });

  document.getElementById("btn-refresh-period-comp")?.addEventListener("click", () => {
    renderPeriodComparison();
    showToast("Analisis komparasi antar-periode diperbarui.");
  });

  document.getElementById("form-add-period")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const tp = document.getElementById("input-period-tp")?.value.trim();
    const sem = document.getElementById("input-period-semester")?.value.trim();
    const name = document.getElementById("input-period-name")?.value.trim() || `T.P. ${tp} - ${sem}`;
    const date = document.getElementById("input-period-date")?.value.trim() || "30 April 2026";
    const notes = document.getElementById("input-period-notes")?.value.trim() || "";
    const copyMode = document.querySelector('input[name="radio-copy-teachers"]:checked')?.value || "copy-clean";

    if (!tp) {
      alert("Harap masukkan Tahun Pelajaran!");
      return;
    }

    createNewPeriod({
      nama: name,
      tahunPelajaran: tp,
      semester: sem,
      tanggalLaporan: date,
      catatan: notes,
      copyMode: copyMode
    });

    document.getElementById("modal-period")?.close();
  });

  const tpInputEl = document.getElementById("input-period-tp");
  const semSelectEl = document.getElementById("input-period-semester");
  const nameInputEl = document.getElementById("input-period-name");
  const updateSuggestedPeriodName = () => {
    if (nameInputEl && tpInputEl && semSelectEl) {
      nameInputEl.value = `T.P. ${tpInputEl.value || "2026/2027"} - ${semSelectEl.value || "Semester Ganjil"}`;
    }
  };
  tpInputEl?.addEventListener("input", updateSuggestedPeriodName);
  semSelectEl?.addEventListener("change", updateSuggestedPeriodName);

  // Navigasi Tab
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Pemilih Guru pada Tab Telaah, Observasi, dan Laporan
  document.getElementById("select-teacher-telaah")?.addEventListener("change", (e) => {
    selectedTeacherId = e.target.value;
    renderTelaahForm();
  });

  document.getElementById("select-teacher-observasi")?.addEventListener("change", (e) => {
    selectedTeacherId = e.target.value;
    renderObservasiForm();
  });

  document.getElementById("select-report-teacher")?.addEventListener("change", (e) => {
    selectedTeacherId = e.target.value;
    renderReportPreview();
  });

  document.getElementById("select-report-type")?.addEventListener("change", () => {
    renderReportPreview();
  });

  // Kontrol pada Tab Analisis Hasil Supervisi
  document.getElementById("select-analisis-scope")?.addEventListener("change", () => {
    renderAnalisisTab();
  });

  document.getElementById("select-analisis-sort")?.addEventListener("change", () => {
    renderAnalisisTab();
  });

  document.getElementById("btn-apply-analysis-to-report")?.addEventListener("click", () => {
    const analysis = computeSupervisionAnalysis("all");
    appState.schoolInfo.simpulan = analysis.narrativeText;
    appState.teachers.forEach((t) => {
      t.rtl = {
        ...t.rtl,
        ...generateSmartRtlForTeacher(t)
      };
    });
    saveState();
    showToast("Hasil analisis berhasil diterapkan ke Simpulan Laporan (Lampiran 3) dan Matriks RTL!");
  });

  document.getElementById("btn-print-analisis")?.addEventListener("click", () => {
    const typeSelect = document.getElementById("select-report-type");
    if (typeSelect) typeSelect.value = "analisis";
    switchTab("tab-laporan");
    setTimeout(() => window.print(), 250);
  });

  // Kontrol pada Tab Asisten AI Supervisi
  document.getElementById("select-teacher-ai")?.addEventListener("change", (e) => {
    selectedTeacherId = e.target.value;
    runAiGeneratorAction(lastAiGeneratedAction || "coaching");
  });

  document.getElementById("btn-save-gemini-key")?.addEventListener("click", () => {
    const val = document.getElementById("input-gemini-key")?.value.trim() || "";
    if (val) {
      localStorage.setItem(GEMINI_KEY_STORAGE, val);
      showToast("Gemini API Key berhasil disimpan! Mode Cloud AI diaktifkan.");
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      showToast("Kembali ke mode AI Pakar Lokal (Tanpa Kuota).");
    }
    updateAiModeBadge();
  });

  document.querySelectorAll("button[data-ai-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      runAiGeneratorAction(btn.dataset.aiAction);
    });
  });

  document.getElementById("btn-copy-ai-output")?.addEventListener("click", () => {
    const text = document.getElementById("ai-output-box")?.textContent || "";
    if (!text) return;
    navigator.clipboard?.writeText(text);
    showToast("Hasil AI berhasil disalin ke clipboard!");
  });

  document.getElementById("btn-apply-ai-to-teacher")?.addEventListener("click", () => {
    const t = getSelectedTeacher();
    if (!t) return;
    autoFillTelaahForTeacher(t);
    autoFillObservasiForTeacher(t);
    t.rtl = {
      ...t.rtl,
      ...generateSmartRtlForTeacher(t)
    };
    saveState();
    showToast(`Rekomendasi AI berhasil diterapkan ke Lampiran 5, Lampiran 6, dan RTL untuk ${t.nama}!`);
  });

  document.getElementById("btn-clear-ai-chat")?.addEventListener("click", () => {
    aiChatMessages = [
      {
        role: "ai",
        text: "Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan baru seputar Supervisi Pembelajaran Mendalam di SMA NEGERI 1 LENTENG SUMENEP!"
      }
    ];
    renderAiChatHistory();
  });

  document.querySelectorAll("button[data-quick-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.quickPrompt;
      if (q) handleAiChatQuestion(q);
    });
  });

  document.getElementById("form-ai-chat")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = document.getElementById("input-ai-chat");
    if (!inp || !inp.value.trim()) return;
    const q = inp.value;
    inp.value = "";
    handleAiChatQuestion(q);
  });

  // Tombol Bantu Isi & Cetak
  document.getElementById("btn-autofill-telaah")?.addEventListener("click", () => {
    const t = getSelectedTeacher();
    if (t) autoFillTelaahForTeacher(t);
  });

  document.getElementById("btn-autofill-observasi")?.addEventListener("click", () => {
    const t = getSelectedTeacher();
    if (t) autoFillObservasiForTeacher(t);
  });

  document.getElementById("btn-print-telaah")?.addEventListener("click", () => {
    const typeSelect = document.getElementById("select-report-type");
    if (typeSelect) typeSelect.value = "lampiran5";
    switchTab("tab-laporan");
    setTimeout(() => window.print(), 250);
  });

  document.getElementById("btn-print-observasi")?.addEventListener("click", () => {
    const typeSelect = document.getElementById("select-report-type");
    if (typeSelect) typeSelect.value = "lampiran6";
    switchTab("tab-laporan");
    setTimeout(() => window.print(), 250);
  });

  document.getElementById("btn-trigger-print")?.addEventListener("click", () => {
    window.print();
  });

  // Sinkronkan semua RTL
  document.getElementById("btn-sync-all-rtl")?.addEventListener("click", () => {
    appState.teachers.forEach((t) => {
      t.rtl = {
        ...t.rtl,
        ...generateSmartRtlForTeacher(t)
      };
    });
    saveState();
    renderRtlTab();
    showToast("Seluruh matriks Evaluasi, Refleksi & RTL telah disinkronkan dengan skor supervisi.");
  });

  // Reset Data Contoh Modul
  document.getElementById("btn-reset-demo")?.addEventListener("click", () => {
    if (!confirm("Kembalikan seluruh data ke contoh awal (SMA Negeri 1 Lenteng Sumenep - Ibu Ani, Bapak Budi, Ibu Citra, Bapak Dedi)?")) {
      return;
    }
    appState = cloneDefaultState();
    selectedTeacherId = appState.teachers[0]?.id || "";
    saveState();
    renderDashboard();
    showToast("Data berhasil dikembalikan ke contoh asli Modul Pelatihan Supervisi PM.");
  });

  // Modal Sekolah
  const schoolModal = document.getElementById("modal-school");
  document.getElementById("btn-open-school-modal")?.addEventListener("click", openSchoolModal);
  document.getElementById("btn-edit-report-narrative")?.addEventListener("click", openSchoolModal);
  document.getElementById("btn-close-school-modal")?.addEventListener("click", () => schoolModal.close());
  document.getElementById("btn-cancel-school")?.addEventListener("click", () => schoolModal.close());

  document.getElementById("form-school")?.addEventListener("submit", (e) => {
    e.preventDefault();
    appState.schoolInfo = {
      namaSekolah: document.getElementById("input-school-name").value.trim(),
      tahunPelajaran: document.getElementById("input-school-year").value.trim(),
      semester: document.getElementById("input-school-semester").value.trim(),
      kepalaSekolah: document.getElementById("input-principal-name").value.trim(),
      nipKepalaSekolah: document.getElementById("input-principal-nip").value.trim(),
      kotaLaporan: document.getElementById("input-report-city").value.trim(),
      tanggalLaporan: document.getElementById("input-report-date").value.trim(),
      latarBelakang: document.getElementById("input-report-latar").value.trim(),
      sasaran: document.getElementById("input-report-sasaran").value.trim(),
      simpulan: document.getElementById("input-report-simpulan").value.trim(),
      penutup: document.getElementById("input-report-penutup").value.trim()
    };
    saveState();
    schoolModal.close();
    renderDashboard();
    renderReportPreview();
    showToast("Identitas sekolah dan narasi laporan berhasil disimpan.");
  });

  // Modal Tambah/Edit Guru
  const teacherModal = document.getElementById("modal-teacher");
  document.getElementById("btn-open-add-teacher")?.addEventListener("click", openAddTeacherModal);
  document.getElementById("btn-add-teacher-2")?.addEventListener("click", openAddTeacherModal);
  document.getElementById("btn-close-teacher-modal")?.addEventListener("click", () => teacherModal.close());
  document.getElementById("btn-cancel-teacher")?.addEventListener("click", () => teacherModal.close());

  document.getElementById("teacher-focus-preset")?.addEventListener("change", (e) => {
    if (e.target.value) {
      document.getElementById("teacher-focus-input").value = e.target.value;
    }
  });

  document.getElementById("form-teacher")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const idVal = document.getElementById("teacher-id-input").value;
    const nama = document.getElementById("teacher-name-input").value.trim();
    const nip = document.getElementById("teacher-nip-input").value.trim();
    const kelasMapel = document.getElementById("teacher-mapel-input").value.trim();
    const tanggalSupervisi = document.getElementById("teacher-date-input").value;
    const fokusMasalah = document.getElementById("teacher-focus-input").value.trim() || "penguatan pembelajaran mendalam";

    if (idVal) {
      const existing = appState.teachers.find((t) => t.id === idVal);
      if (existing) {
        existing.nama = nama;
        existing.nip = nip;
        existing.kelasMapel = kelasMapel;
        existing.tanggalSupervisi = tanggalSupervisi;
        existing.fokusMasalah = fokusMasalah;
      }
      showToast(`Data ${nama} berhasil diperbarui.`);
    } else {
      const defaultScores = {};
      for (let i = 1; i <= 15; i++) defaultScores[i] = 3;

      const newTeacher = {
        id: "guru-" + Date.now(),
        nama,
        nip,
        kelasMapel,
        tanggalSupervisi,
        fokusMasalah,
        telaah: {
          scores: { ...defaultScores },
          comments: {},
          kelebihan: "Perencanaan pembelajaran sudah mengarah pada Dimensi Profil Lulusan.",
          perluDitingkatkan: `Penguatan pada aspek: ${fokusMasalah}.`,
          rekomendasi: "Merevisi rencana pembelajaran sesuai prinsip Pembelajaran Mendalam (PM) dan KKA."
        },
        observasi: {
          scores: { ...defaultScores },
          bukti: {},
          catatan: {},
          kelebihan: "Interaksi pembelajaran kondusif dan saling memuliakan.",
          perluDitingkatkan: `Penguatan praktik pada fokus: ${fokusMasalah}.`,
          rekomendasi: "Melaksanakan coaching dan tindak lanjut perbaikan sesuai prinsip PM dan KKA."
        },
        rtl: {}
      };
      newTeacher.rtl = generateSmartRtlForTeacher(newTeacher);
      appState.teachers.push(newTeacher);
      selectedTeacherId = newTeacher.id;
      showToast(`Pendidik "${nama}" berhasil ditambahkan.`);
    }

    saveState();
    teacherModal.close();
    renderDashboard();
  });

  // Ekspor & Impor
  document.getElementById("btn-export-csv")?.addEventListener("click", exportRekapCsv);
  document.getElementById("btn-export-json")?.addEventListener("click", exportJsonBackup);
  document.getElementById("input-import-json")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported || !Array.isArray(imported.teachers) || !imported.schoolInfo) {
          alert("Format berkas JSON tidak valid.");
          return;
        }
        appState = imported;
        selectedTeacherId = appState.teachers[0]?.id || "";
        saveState();
        renderDashboard();
        showToast("Data backup JSON berhasil diimpor.");
      } catch (err) {
        alert("Gagal membaca berkas JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // Modal Firebase Database
  const firebaseModal = document.getElementById("modal-firebase");
  document.getElementById("btn-open-firebase-modal")?.addEventListener("click", openFirebaseModal);
  document.getElementById("btn-close-firebase-modal")?.addEventListener("click", () => firebaseModal?.close());
  document.getElementById("btn-cancel-firebase")?.addEventListener("click", () => firebaseModal?.close());

  document.getElementById("btn-parse-firebase-paste")?.addEventListener("click", () => {
    const pasteText = document.getElementById("firebase-config-paste")?.value;
    const extracted = parseFirebaseConfigSnippet(pasteText);
    if (!extracted) {
      alert("Format konfigurasi Firebase tidak terdeteksi. Pastikan Anda menyalin blok 'const firebaseConfig = { ... }' dari Firebase Console.");
      return;
    }
    if (extracted.apiKey) document.getElementById("fb-api-key").value = extracted.apiKey;
    if (extracted.projectId) document.getElementById("fb-project-id").value = extracted.projectId;
    if (extracted.authDomain) document.getElementById("fb-auth-domain").value = extracted.authDomain;
    if (extracted.appId) document.getElementById("fb-app-id").value = extracted.appId;
    if (extracted.databaseURL) {
      document.getElementById("fb-database-type").value = "rtdb";
    }
    showToast("Konfigurasi Firebase berhasil diekstrak ke formulir!");
  });

  document.getElementById("form-firebase")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById("fb-api-key").value.trim();
    const projectId = document.getElementById("fb-project-id").value.trim();
    const authDomain = document.getElementById("fb-auth-domain").value.trim();
    const appId = document.getElementById("fb-app-id").value.trim();
    const databaseType = document.getElementById("fb-database-type").value;
    const docPath = document.getElementById("fb-doc-path").value.trim() || "sman1_lenteng_sumenep";
    const autoSync = document.getElementById("fb-auto-sync").checked;

    if (!apiKey || !projectId) {
      alert("Harap isi minimal API Key dan Project ID Firebase!");
      return;
    }

    const newConfig = {
      apiKey,
      projectId,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      appId: appId || `1:${projectId}:web`,
      databaseType,
      docPath,
      autoSync
    };

    initFirebase(newConfig, true);
    // Jalankan sinkronisasi awal (push local data to cloud)
    await pushToFirebase(true);
    firebaseModal?.close();
  });

  document.getElementById("btn-pull-firebase")?.addEventListener("click", () => {
    pullFromFirebase();
  });

  document.getElementById("btn-push-firebase")?.addEventListener("click", () => {
    pushToFirebase(false);
  });

  document.getElementById("btn-disconnect-firebase")?.addEventListener("click", () => {
    if (confirm("Putuskan koneksi Firebase? Data lokal di browser Anda tetap aman.")) {
      disconnectFirebase();
      firebaseModal?.close();
    }
  });

  // Inisialisasi Firebase jika konfigurasi sudah tersimpan
  if (firebaseCurrentConfig) {
    initFirebase(firebaseCurrentConfig, false);
  } else {
    updateFirebaseStatusUI("disconnected");
  }

  // Render Pertama Kali
  renderPeriodControls();
  renderDashboard();
});
