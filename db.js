const DEFAULT_STUDENTS ={

  "1": [
    { id: "s101", name: "جود العتيبي",    bus: 20, grade: "1" },
    { id: "s102", name: "لانا الشهراني",  bus: 15, grade: "1" },
    { id: "s103", name: "رهف المالكي",    bus: 9,  grade: "1" }
  ],
  "2": [
    { id: "s201", name: "ريم الحارثي",    bus: 20, grade: "2" },
    { id: "s202", name: "دانة العتيبي",   bus: 7,  grade: "2" },
    { id: "s203", name: "سارة الغامدي",   bus: 15, grade: "2" }
  ],
  "3": [
    { id: "s301", name: "نورة الشهري",    bus: 9,  grade: "3" },
    { id: "s302", name: "هيا العتيبي",    bus: 20, grade: "3" },
    { id: "s303", name: "لمى الحربي",     bus: 7,  grade: "3" }
  ],
  "4": [
    { id: "s401", name: "شهد الزهراني",  bus: 15, grade: "4" },
    { id: "s402", name: "جنى الغامدي",   bus: 9,  grade: "4" },
    { id: "s403", name: "غلا الحارثي",   bus: 20, grade: "4" }
  ],
  "5": [
    { id: "s501", name: "أريام العتيبي", bus: 7,  grade: "5" },
    { id: "s502", name: "ليان الشهري",   bus: 15, grade: "5" },
    { id: "s503", name: "تالا الحربي",   bus: 9,  grade: "5" }
  ],
  "6": [
    { id: "s601", name: "لميس الغامدي", bus: 20, grade: "6" },
    { id: "s602", name: "رهف الشهري",   bus: 7,  grade: "6" },
    { id: "s603", name: "رزان الحارثي", bus: 15, grade: "6" }
  ]
};



const DEFAULT_BUSES = [
  { number: "20", seats: 18, available: 0,  photo: "bus.jpg", map: "map.webp", top: "45%", left: "38%" },
  { number: "21", seats: 18, available: 5,  photo: "bus.jpg", map: "map.webp", top: "30%", left: "55%" },
  { number: "9",  seats: 18, available: 3,  photo: "bus.jpg", map: "map.webp", top: "60%", left: "42%" },
  { number: "15", seats: 18, available: 7,  photo: "bus.jpg", map: "map.webp", top: "50%", left: "30%" },
  { number: "7",  seats: 18, available: 2,  photo: "bus.jpg", map: "map.webp", top: "35%", left: "60%" }
];


/* ──────────────────────────────────────────
   2. قاعدة البيانات المشتركة (localStorage)
   ────────────────────────────────────────── */
const DB = {

  /* --- الطلاب --- */
  students: {
    getAll() {
      const raw = localStorage.getItem("eq_students");
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
    },
    save(data) {
      localStorage.setItem("eq_students", JSON.stringify(data));
    },
    add(grade, student) {
      const all = this.getAll();
      if (!all[grade]) all[grade] = [];
      all[grade].push(student);
      this.save(all);
    },
    getByBus(busId) {
      const result = [];
      Object.values(this.getAll()).forEach(list =>
        list.forEach(s => { if (String(s.bus) === String(busId)) result.push(s); })
      );
      return result;
    },
    getById(id) {
      for (const list of Object.values(this.getAll())) {
        const s = list.find(st => st.id === id);
        if (s) return s;
      }
      return null;
    }
  },

  /* --- الباصات --- */
  buses: {
    getAll() {
      const raw = localStorage.getItem("eq_buses");
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_BUSES));
    },
    save(data) {
      localStorage.setItem("eq_buses", JSON.stringify(data));
    },
    get(number) {
      return this.getAll().find(b => String(b.number) === String(number)) || null;
    }
  },

  /* --- الإشعارات --- */
  notifications: {
    getAll() {
      return JSON.parse(localStorage.getItem("eq_notifications") || "[]");
    },
    save(list) {
      localStorage.setItem("eq_notifications", JSON.stringify(list));
    },
    add(msg, type = "info") {
      const list = this.getAll();
      list.unshift({ id: Date.now(), msg, type, time: Date.now(), read: false });
      if (list.length > 50) list.pop();
      this.save(list);
      Nav.updateBadge();
    },
    markAllRead() {
      this.save(this.getAll().map(n => ({ ...n, read: true })));
      Nav.updateBadge();
    },
    unreadCount() {
      return this.getAll().filter(n => !n.read).length;
    },
    removeOld() {
      const limit = 48 * 60 * 60 * 1000;
      const valid = this.getAll().filter(n => Date.now() - n.time <= limit);
      this.save(valid);
      return valid;
    }
  },

  /* --- الحضور --- */
  attendance: {
    todayKey() {
      return new Date().toISOString().slice(0, 10);
    },
    getAll() {
      return JSON.parse(localStorage.getItem("eq_attendance") || "{}");
    },
    save(data) {
      localStorage.setItem("eq_attendance", JSON.stringify(data));
    },
    markPresent(studentId, studentName, busId) {
      const data = this.getAll();
      const today = this.todayKey();
      if (!data[today]) data[today] = {};
      const time = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
      data[today][studentId] = { status: "present", time, busId };
      this.save(data);
      DB.notifications.add("✅ " + studentName + " ركبت الباص " + busId + " — " + time, "success");
    },
    isPresent(studentId) {
      const today = this.getAll()[this.todayKey()] || {};
      return today[studentId]?.status === "present";
    },
    getToday() {
      return this.getAll()[this.todayKey()] || {};
    }
  },

  /* --- المدفوعات --- */
  payments: {
    getAll() {
      return JSON.parse(localStorage.getItem("eq_payments") || "{}");
    },
    save(data) {
      localStorage.setItem("eq_payments", JSON.stringify(data));
    },
    markPaid(studentId, method) {
      const data = this.getAll();
      data[studentId] = {
        paid: true, method: method || "غير محدد",
        date: new Date().toLocaleDateString("ar-SA"), amount: 200
      };
      this.save(data);
      DB.notifications.add("💰 تم سداد رسوم الطالبة " + studentId + " بـ " + (method || ""), "success");
    },
    isPaid(studentId) {
      return this.getAll()[studentId]?.paid === true;
    }
  }
};


/* ──────────────────────────────────────────
   3. وظائف التنقل (Navigation)
   ────────────────────────────────────────── */
const Nav = {

  /* الانتقال إلى صفحة */
  go(page) {
    window.location.href = page;
  },

  /* الرجوع للخلف */
  back() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  },

  /* تحديث شارة الإشعارات غير المقروءة */
  updateBadge() {
    const count = DB.notifications.unreadCount();
    document.querySelectorAll(".notif-badge").forEach(el => {
      el.textContent  = count > 0 ? count : "";
      el.style.display = count > 0 ? "inline-block" : "none";
    });
  },

  /* إصلاح روابط role.html المكسورة */
  fixRoleLink() {
    document.querySelectorAll('a[href="role.html"]').forEach(a => {
      a.href = "index.html";
    });
  },

  /* إصلاح روابط Financialfees.html المكسورة */
  fixFinancialLink() {
    document.querySelectorAll('a[href="Financialfees.html"]').forEach(a => {
      a.href = "payment.html";
    });
  },

  /* إصلاح روابط map.html المكسورة */
  fixMapLink() {
    document.querySelectorAll('a[href="map.html"]').forEach(a => {
      a.href = "trackingmap.html";
    });
  },

  /* إصلاح روابط profile.html و records.html المكسورة */
  fixMiscLinks() {
    document.querySelectorAll('a[href="profile.html"]').forEach(a => {
      a.href = "list.html";
    });
    document.querySelectorAll('a[href="records.html"]').forEach(a => {
      a.href = "DataList.html";
    });
  },

  /* تشغيل كل الإصلاحات عند تحميل الصفحة */
  init() {
    this.fixRoleLink();
    this.fixFinancialLink();
    this.fixMapLink();
    this.fixMiscLinks();
    this.updateBadge();
  }
};


/* ──────────────────────────────────────────
   4. محاكاة استدعاءات API (بديل api.php)
   تُستخدم في: studentsdb.html, trackingmapdb.html, welcomedb.html
   ────────────────────────────────────────── */
const API = {

  /* محاكاة GET api.php — تُرجع بيانات الطلاب */
  getStudents() {
    return new Promise(resolve => {
      setTimeout(() => {
        const all = DB.students.getAll();
        // تحويل القاموس إلى مصفوفة مسطّحة
        const flat = [];
        Object.values(all).forEach(list => list.forEach(s => flat.push(s)));
        resolve({ ok: true, data: flat });
      }, 300);
    });
  },

  /* محاكاة GET api_bus.php — تُرجع بيانات الباصات */
  getBuses() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ok: true, data: DB.buses.getAll() });
      }, 300);
    });
  },

  /* محاكاة GET api.php — للتحقق من اتصال الخادم */
  ping() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ ok: true }), 200);
    });
  }
};


/* ──────────────────────────────────────────
   5. صفحة welcome.html و welcomedb.html
   — إصلاح استدعاء api.php وإصلاح الرابط role.html
   ────────────────────────────────────────── */
function initWelcomePage() {
  const loadingEl = document.getElementById("loading");
  const startBtn  = document.getElementById("startBtn");
  if (!loadingEl || !startBtn) return;

  // إصلاح رابط زر المتابعة
  startBtn.href = "index.html";

  // استبدال fetch("api.php") بمحاكاة
  API.ping().then(() => {
    loadingEl.style.display = "none";
    startBtn.style.display  = "inline-block";
  }).catch(() => {
    loadingEl.innerHTML = "تعذر الاتصال بالنظام";
    loadingEl.classList.add("error");
  });
}


/* ──────────────────────────────────────────
   6. صفحة studentsdb.html
   — بديل loadData() الذي يستدعي api.php
   ────────────────────────────────────────── */
function initStudentsDbPage() {
  const gradeListEl   = document.getElementById("gradeList");
  const studentListEl = document.getElementById("studentList");
  const pageTitleEl   = document.getElementById("pageTitle");
  const sectionLabelEl = document.getElementById("sectionLabel");
  const backBtn       = document.getElementById("backBtn");
  if (!gradeListEl) return;

  let allStudents = []; // مصفوفة مسطّحة

  // --- جلب البيانات ---
  API.getStudents().then(res => {
    allStudents = res.data;
    showGrades();
  }).catch(() => {
    gradeListEl.innerHTML = '<p class="empty">تعذر الاتصال بقاعدة البيانات</p>';
  });

  // --- عرض الصفوف ---
  function showGrades() {
    const gradesMap = {};
    allStudents.forEach(s => {
      if (!gradesMap[s.grade]) gradesMap[s.grade] = 0;
      gradesMap[s.grade]++;
    });
    gradeListEl.innerHTML = "";
    gradeListEl.style.display = "flex";
    if (studentListEl) studentListEl.style.display = "none";
    if (pageTitleEl)   pageTitleEl.innerText   = "الطالبات";
    if (sectionLabelEl) sectionLabelEl.innerText = "قائمة الصفوف";
    if (backBtn) backBtn.onclick = () => Nav.back();

    const gradeNames = { "1":"الأول","2":"الثاني","3":"الثالث","4":"الرابع","5":"الخامس","6":"السادس" };
    Object.keys(gradesMap).sort().forEach(g => {
      const card = document.createElement("div");
      card.className = "card";
      card.onclick   = () => showStudents(g);
      card.innerHTML = `
        <div class="icon-box"><span class="grade-num">${g}</span></div>
        <div class="info">
          <div class="name">الصف ${gradeNames[g] || g}</div>
          <div class="meta">${gradesMap[g]} طالبات</div>
        </div>
        <div class="arrow-btn">
          <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      gradeListEl.appendChild(card);
    });
  }

  // --- عرض الطالبات ---
  function showStudents(grade) {
    const gradeNames = { "1":"الأول","2":"الثاني","3":"الثالث","4":"الرابع","5":"الخامس","6":"السادس" };
    const list = allStudents.filter(s => String(s.grade) === String(grade));
    if (pageTitleEl)    pageTitleEl.innerText    = "طالبات الصف " + (gradeNames[grade] || grade);
    if (sectionLabelEl) sectionLabelEl.innerText = "قائمة الطالبات";
    gradeListEl.style.display = "none";

    const rows = list.map(s => `
      <div class="student-row">
        <div class="student-avatar">👧</div>
        <div class="student-info">
          <div class="student-name">${s.name}</div>
          <div class="student-meta">الصف ${gradeNames[s.grade] || s.grade}</div>
        </div>
        <span class="bus-badge">باص ${s.bus}</span>
      </div>`).join("") || '<p class="empty">لا توجد طالبات</p>';

    if (studentListEl) {
      studentListEl.innerHTML = `<div class="student-card">${rows}</div>`;
      studentListEl.style.display = "block";
    }
    if (backBtn) backBtn.onclick = showGrades;
  }
}


/* ──────────────────────────────────────────
   7. صفحة trackingmapdb.html
   — بديل loadBuses() الذي يستدعي api_bus.php
   ────────────────────────────────────────── */
function initTrackingMapDbPage() {
  const contentEl = document.getElementById("content");
  if (!contentEl) return;

  API.getBuses().then(res => {
    displayBuses(res.data);
  }).catch(() => {
    contentEl.innerHTML = '<p class="loading">تعذر الاتصال بقاعدة البيانات</p>';
  });

  function displayBuses(buses) {
    contentEl.innerHTML = "";
    if (!buses.length) {
      contentEl.innerHTML = '<p class="loading">لا توجد باصات</p>';
      return;
    }
    buses.forEach(bus => {
      const busCard = document.createElement("div");
      busCard.className = "bus-card";
      busCard.innerHTML = `
        <div class="bus-info">
          رقم : ${bus.number}<br>
          عدد المقاعد : ${bus.seats}<br>
          عدد المقاعد المتاحة : ${bus.available}
        </div>
        <img class="bus-photo" src="${bus.photo}" alt="صورة الباص">`;

      const mapCard = document.createElement("div");
      mapCard.className = "map-card";
      mapCard.innerHTML = `
        <img class="map-img" src="${bus.map}" alt="الخريطة">
        <div class="bus-pin" style="top:${bus.top};left:${bus.left};">
          <img src="${bus.photo}" alt="الباص">
        </div>`;

      contentEl.appendChild(busCard);
      contentEl.appendChild(mapCard);
    });
  }
}


/* ──────────────────────────────────────────
   8. صفحة notifications.html
   — ربط الإشعارات بقاعدة البيانات
   ────────────────────────────────────────── */
function initNotificationsPage() {
  const container = document.getElementById("notificationsList");
  if (!container) return;

  DB.notifications.markAllRead();
  const list = DB.notifications.removeOld();

  if (!list.length) {
    container.innerHTML = "<p style='text-align:center;padding:30px;color:#888;'>لا توجد إشعارات حديثة</p>";
    return;
  }

  const typeColors = { success: "#16a34a", info: "#1b7c80", warning: "#d97706", error: "#dc2626" };
  container.innerHTML = list.map(n => {
    const date = new Date(n.time).toLocaleString("ar-SA");
    const color = typeColors[n.type] || typeColors.info;
    return `<div style="
        background:#fff; border-radius:12px; margin:10px 16px;
        padding:14px 16px; box-shadow:0 2px 8px rgba(0,0,0,.07);
        border-right:4px solid ${color};">
      <div style="font-weight:700; color:#1e1e2e;">${n.msg}</div>
      <div style="font-size:12px; color:#888; margin-top:4px;">${date}</div>
    </div>`;
  }).join("");
}


/* ──────────────────────────────────────────
   9. صفحة qr_scanner.html
   — ربط مسح QR بتسجيل الحضور وإرسال إشعار
   ────────────────────────────────────────── */
function initQrScannerPage() {
  // البحث عن زر المحاكاة أو عنصر النتيجة
  const resultEl = document.getElementById("scanResult");
  if (!resultEl) return;

  // الطلاب الموجودون على الباص 20 (باص السائق الافتراضي)
  const busStudents = DB.students.getByBus(20);

  resultEl.innerHTML = `
    <div style="padding:16px;">
      <p style="color:#1b7c80; font-weight:700; margin-bottom:10px;">
        اختر الطالبة لتسجيل ركوبها:
      </p>
      ${busStudents.map(s => `
        <button onclick="registerScan('${s.id}','${s.name}',20)"
          style="display:block; width:100%; margin-bottom:8px; padding:12px;
                 background:#1b7c80; color:#fff; border:none; border-radius:10px;
                 font-family:Tajawal,sans-serif; font-size:15px; cursor:pointer;">
          ${DB.attendance.isPresent(s.id) ? "✅" : "📷"} ${s.name}
        </button>`).join("")}
    </div>`;
}

function registerScan(studentId, studentName, busId) {
  if (DB.attendance.isPresent(studentId)) {
    alert(studentName + " سبق تسجيل حضورها اليوم ✅");
    return;
  }
  DB.attendance.markPresent(studentId, studentName, busId);
  alert("✅ تم تسجيل حضور " + studentName + " بنجاح!");
  initQrScannerPage(); // تحديث القائمة
}


/* ──────────────────────────────────────────
   10. صفحة payment.html
   — ربط زر "ادفع الآن" بتسجيل الدفع
   ────────────────────────────────────────── */
function initPaymentPage() {
  const payNow    = document.getElementById("payNow");
  const payBadge  = document.getElementById("payBadge");
  const madaBadge = document.getElementById("madaBadge");
  const madaModal = document.getElementById("madaModal");
  const madaForm  = document.getElementById("madaForm");
  const closeMada = document.getElementById("closeMada");
  if (!payNow) return;

  let selectedMethod = null;

  if (payBadge) payBadge.addEventListener("click", () => {
    selectedMethod = "Apple Pay";
    payBadge.style.boxShadow  = "0 0 0 3px #1b7c80";
    if (madaBadge) madaBadge.style.boxShadow = "";
  });

  if (madaBadge) madaBadge.addEventListener("click", () => {
    selectedMethod = "مدى";
    madaBadge.style.boxShadow = "0 0 0 3px #1b7c80";
    if (payBadge) payBadge.style.boxShadow  = "";
    if (madaModal) { madaModal.style.display = "flex"; madaModal.setAttribute("aria-hidden","false"); }
  });

  if (closeMada) closeMada.addEventListener("click", () => {
    if (madaModal) { madaModal.style.display = "none"; madaModal.setAttribute("aria-hidden","true"); }
  });

  if (madaForm) madaForm.addEventListener("submit", e => {
    e.preventDefault();
    if (madaModal) { madaModal.style.display = "none"; madaModal.setAttribute("aria-hidden","true"); }
    completePay("مدى");
  });

  payNow.addEventListener("click", () => {
    if (!selectedMethod) { alert("يرجى اختيار طريقة الدفع أولاً"); return; }
    if (selectedMethod === "Apple Pay") completePay("Apple Pay");
  });

  function completePay(method) {
    DB.payments.markPaid("PA504_student", method);
    alert("✅ تم الدفع بنجاح بـ " + method + "\nشكراً لك!");
    setTimeout(() => Nav.go("attendance.html"), 500);
  }
}


/* ──────────────────────────────────────────
   11. صفحة attendance.html (ولي الأمر)
   — عرض حالة الحضور والدفع
   ────────────────────────────────────────── */
function initAttendancePage() {
  // إضافة زر سريع لعرض حالة الحضور إن وُجد العنصر
  const statusEl = document.getElementById("attendanceStatus");
  if (!statusEl) return;

  const today = DB.attendance.getToday();
  const count  = Object.keys(today).length;
  statusEl.textContent = count > 0
    ? "عدد الطالبات الحاضرات اليوم: " + count
    : "لا يوجد تسجيل حضور حتى الآن";
}


/* ──────────────────────────────────────────
   12. تشغيل كل شيء عند تحميل الصفحة
   ────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {

  // إصلاح الروابط المكسورة في جميع الصفحات
  Nav.init();

  // تحديد الصفحة الحالية وتشغيل الدالة المناسبة
  const page = location.pathname.split("/").pop() || "index.html";

  const pageHandlers = {
    "welcome.html":       initWelcomePage,
    "welcomedb.html":     initWelcomePage,
    "studentsdb.html":    initStudentsDbPage,
    "trackingmapdb.html": initTrackingMapDbPage,
    "notifications.html": initNotificationsPage,
    "qr_scanner.html":    initQrScannerPage,
    "payment.html":       initPaymentPage,
    "attendance.html":    initAttendancePage
  };

  if (pageHandlers[page]) pageHandlers[page]();
});
