/* ================================================
   BUNKVERSE — Bunk Calculator Logic
   KTU Academic Calendar + Attendance Math
   ================================================ */

// ─── KTU Academic Calendar Data ──────────────────
const KTU_CALENDAR = {
  '2025-26': {
    odd: { start: '2025-07-21', end: '2025-11-28' },
    even: { start: '2026-01-05', end: '2026-05-15' },
    holidays: [
      '2025-08-15', // Independence Day
      '2025-09-02', // Onam (approx)
      '2025-09-03', // Onam
      '2025-09-04', // Onam
      '2025-09-05', // Onam (Thiruvonam)
      '2025-10-02', // Gandhi Jayanti
      '2025-10-20', // Deepavali (approx)
      '2025-11-05', // Kerala Piravi
      '2026-01-26', // Republic Day
      '2026-03-25', // Holi (approx)
      '2026-04-14', // Vishu
      '2026-04-18', // Good Friday
      '2026-05-01', // Labour Day
    ]
  },
  '2026-27': {
    odd: { start: '2026-07-20', end: '2026-11-27' },
    even: { start: '2027-01-04', end: '2027-05-14' },
    holidays: [
      '2026-08-15', // Independence Day
      '2026-08-20', // Onam (approx)
      '2026-08-21',
      '2026-08-22', // Thiruvonam
      '2026-10-02', // Gandhi Jayanti
      '2026-11-05', // Kerala Piravi
      '2026-11-08', // Deepavali (approx)
      '2027-01-26', // Republic Day
      '2027-04-14', // Vishu
      '2027-04-02', // Good Friday
      '2027-05-01', // Labour Day
    ]
  },
  '2024-25': {
    odd: { start: '2024-07-22', end: '2024-11-29' },
    even: { start: '2025-01-06', end: '2025-05-16' },
    holidays: [
      '2024-08-15',
      '2024-09-15', // Onam
      '2024-09-16',
      '2024-09-17',
      '2024-10-02',
      '2024-10-31', // Halloween / Kerala festival
      '2024-11-05',
      '2025-01-26',
      '2025-04-14',
      '2025-04-18',
      '2025-05-01',
    ]
  }
};

// ─── Subject Data (per branch/semester) ──────────
// classesPerWeek = how many times per week this subject appears
const SUBJECTS = {
  CSE: {
    S1: [
      { name: 'Engineering Mathematics I', code: 'MA101', classesPerWeek: 4 },
      { name: 'Engineering Physics', code: 'PH100', classesPerWeek: 3 },
      { name: 'Engineering Chemistry', code: 'CY100', classesPerWeek: 3 },
      { name: 'Engineering Graphics', code: 'CE100', classesPerWeek: 4 },
      { name: 'Basics of Civil & Mechanical Engineering', code: 'BE101', classesPerWeek: 3 },
    ],
    S2: [
      { name: 'Engineering Mathematics II', code: 'MA102', classesPerWeek: 4 },
      { name: 'Engineering Physics / Chemistry', code: 'PH/CY', classesPerWeek: 3 },
      { name: 'Basics of Electronics & Electrical Engineering', code: 'BE102', classesPerWeek: 3 },
      { name: 'Computer Programming', code: 'CS110', classesPerWeek: 4 },
      { name: 'Professional Communication', code: 'EN101', classesPerWeek: 2 },
    ],
    S3: [
      { name: 'Discrete Mathematical Structures', code: 'CS201', classesPerWeek: 4 },
      { name: 'Data Structures', code: 'CS203', classesPerWeek: 4 },
      { name: 'Logic System Design', code: 'CS205', classesPerWeek: 3 },
      { name: 'Object Oriented Programming', code: 'CS207', classesPerWeek: 3 },
      { name: 'Engineering Mathematics III', code: 'MA201', classesPerWeek: 3 },
    ],
    S4: [
      { name: 'Graph Theory', code: 'CS202', classesPerWeek: 3 },
      { name: 'Computer Organization and Architecture', code: 'CS204', classesPerWeek: 3 },
      { name: 'Operating Systems', code: 'CS206', classesPerWeek: 4 },
      { name: 'Database Management Systems', code: 'CS208', classesPerWeek: 4 },
      { name: 'Design and Analysis of Algorithms', code: 'CS210', classesPerWeek: 3 },
    ],
    S5: [
      { name: 'Computer Networks', code: 'CS301', classesPerWeek: 4 },
      { name: 'Compiler Design', code: 'CS303', classesPerWeek: 3 },
      { name: 'Microprocessors and Microcontrollers', code: 'CS305', classesPerWeek: 3 },
      { name: 'System Software', code: 'CS307', classesPerWeek: 3 },
      { name: 'Formal Languages & Automata Theory', code: 'CS309', classesPerWeek: 3 },
    ],
    S6: [
      { name: 'Software Engineering', code: 'CS302', classesPerWeek: 3 },
      { name: 'Computer Graphics & Image Processing', code: 'CS304', classesPerWeek: 3 },
      { name: 'Distributed Computing', code: 'CS306', classesPerWeek: 3 },
      { name: 'Artificial Intelligence', code: 'CS308', classesPerWeek: 4 },
      { name: 'Data Mining & Warehousing', code: 'CS310', classesPerWeek: 3 },
    ],
    S7: [
      { name: 'Machine Learning', code: 'CSE401', classesPerWeek: 4 },
      { name: 'Information Security', code: 'CSE403', classesPerWeek: 3 },
      { name: 'Cloud Computing', code: 'CSE405', classesPerWeek: 3 },
      { name: 'Deep Learning', code: 'CSE407', classesPerWeek: 3 },
    ],
    S8: [
      { name: 'Blockchain Technology', code: 'CSE402', classesPerWeek: 3 },
      { name: 'Internet of Things', code: 'CSE404', classesPerWeek: 3 },
      { name: 'Natural Language Processing', code: 'CSE406', classesPerWeek: 3 },
    ]
  },
  ECE: {
    S1: [{ name: 'Engineering Mathematics I', code: 'MA101', classesPerWeek: 4 }, { name: 'Engineering Physics', code: 'PH100', classesPerWeek: 3 }, { name: 'Engineering Chemistry', code: 'CY100', classesPerWeek: 3 }],
    S2: [{ name: 'Engineering Mathematics II', code: 'MA102', classesPerWeek: 4 }, { name: 'Basic Electronics', code: 'EC100', classesPerWeek: 3 }, { name: 'Computer Programming', code: 'CS110', classesPerWeek: 4 }],
    S3: [{ name: 'Network Theory', code: 'EC201', classesPerWeek: 4 }, { name: 'Electronic Devices & Circuits', code: 'EC203', classesPerWeek: 3 }, { name: 'Signals & Systems', code: 'EC205', classesPerWeek: 4 }],
    S4: [{ name: 'Linear IC Applications', code: 'EC202', classesPerWeek: 3 }, { name: 'Digital Electronics', code: 'EC204', classesPerWeek: 3 }, { name: 'Electromagnetic Theory', code: 'EC206', classesPerWeek: 4 }],
    S5: [{ name: 'Communication Engineering', code: 'EC301', classesPerWeek: 4 }, { name: 'Microprocessors', code: 'EC303', classesPerWeek: 3 }, { name: 'Control Systems', code: 'EC305', classesPerWeek: 3 }],
    S6: [{ name: 'VLSI Design', code: 'EC302', classesPerWeek: 3 }, { name: 'Digital Signal Processing', code: 'EC304', classesPerWeek: 4 }, { name: 'Wireless Communication', code: 'EC306', classesPerWeek: 3 }],
    S7: [{ name: 'Antenna & Propagation', code: 'EC401', classesPerWeek: 3 }, { name: 'Embedded Systems', code: 'EC403', classesPerWeek: 4 }],
    S8: [{ name: 'Optical Communication', code: 'EC402', classesPerWeek: 3 }, { name: 'Radar & TV', code: 'EC404', classesPerWeek: 3 }],
  },
  EEE: {
    S5: [{ name: 'Power Systems', code: 'EE301', classesPerWeek: 4 }, { name: 'Control Systems', code: 'EE303', classesPerWeek: 3 }, { name: 'Electrical Machines', code: 'EE305', classesPerWeek: 3 }],
    S6: [{ name: 'Power Electronics', code: 'EE302', classesPerWeek: 3 }, { name: 'Digital Electronics', code: 'EE304', classesPerWeek: 3 }],
    S3: [{ name: 'Circuit Theory', code: 'EE201', classesPerWeek: 4 }, { name: 'Electronic Devices', code: 'EE203', classesPerWeek: 3 }],
    S4: [{ name: 'Linear Integrated Circuits', code: 'EE202', classesPerWeek: 3 }, { name: 'Electromagnetic Theory', code: 'EE204', classesPerWeek: 4 }],
    S1: [{ name: 'Engineering Mathematics I', code: 'MA101', classesPerWeek: 4 }], S2: [{ name: 'Engineering Mathematics II', code: 'MA102', classesPerWeek: 4 }],
    S7: [{ name: 'High Voltage Engineering', code: 'EE401', classesPerWeek: 3 }], S8: [{ name: 'Energy Management', code: 'EE402', classesPerWeek: 3 }],
  },
  ME: {
    S5: [{ name: 'Heat Transfer', code: 'ME301', classesPerWeek: 4 }, { name: 'Machine Design', code: 'ME303', classesPerWeek: 3 }, { name: 'Manufacturing Technology', code: 'ME305', classesPerWeek: 3 }],
    S6: [{ name: 'Dynamics of Machinery', code: 'ME302', classesPerWeek: 3 }, { name: 'Fluid Mechanics', code: 'ME304', classesPerWeek: 4 }],
    S3: [{ name: 'Mechanics of Solids', code: 'ME201', classesPerWeek: 4 }, { name: 'Thermodynamics', code: 'ME203', classesPerWeek: 3 }],
    S4: [{ name: 'Fluid Mechanics', code: 'ME202', classesPerWeek: 3 }, { name: 'Kinematics', code: 'ME204', classesPerWeek: 4 }],
    S1: [{ name: 'Engineering Mathematics I', code: 'MA101', classesPerWeek: 4 }], S2: [{ name: 'Engineering Mathematics II', code: 'MA102', classesPerWeek: 4 }],
    S7: [{ name: 'Automobile Engineering', code: 'ME401', classesPerWeek: 3 }], S8: [{ name: 'Robotics', code: 'ME402', classesPerWeek: 3 }],
  },
  CE: {
    S5: [{ name: 'Structural Analysis', code: 'CE301', classesPerWeek: 4 }, { name: 'Geotechnical Engineering', code: 'CE303', classesPerWeek: 3 }, { name: 'Transportation Engineering', code: 'CE305', classesPerWeek: 3 }],
    S6: [{ name: 'Design of RC Structures', code: 'CE302', classesPerWeek: 4 }, { name: 'Water Supply & Sanitation', code: 'CE304', classesPerWeek: 3 }],
    S3: [{ name: 'Mechanics of Solids', code: 'CE201', classesPerWeek: 4 }, { name: 'Surveying', code: 'CE203', classesPerWeek: 3 }],
    S4: [{ name: 'Fluid Mechanics', code: 'CE202', classesPerWeek: 3 }, { name: 'Building Materials', code: 'CE204', classesPerWeek: 3 }],
    S1: [{ name: 'Engineering Mathematics I', code: 'MA101', classesPerWeek: 4 }], S2: [{ name: 'Engineering Mathematics II', code: 'MA102', classesPerWeek: 4 }],
    S7: [{ name: 'Foundation Engineering', code: 'CE401', classesPerWeek: 3 }], S8: [{ name: 'Construction Management', code: 'CE402', classesPerWeek: 3 }],
  },
  IT: {
    S5: [{ name: 'Computer Networks', code: 'IT301', classesPerWeek: 4 }, { name: 'Software Engineering', code: 'IT303', classesPerWeek: 3 }, { name: 'Web Technologies', code: 'IT305', classesPerWeek: 3 }],
    S6: [{ name: 'Distributed Systems', code: 'IT302', classesPerWeek: 3 }, { name: 'Mobile Computing', code: 'IT304', classesPerWeek: 3 }, { name: 'Artificial Intelligence', code: 'IT306', classesPerWeek: 4 }],
    S3: [{ name: 'Data Structures', code: 'IT201', classesPerWeek: 4 }, { name: 'Database Systems', code: 'IT203', classesPerWeek: 3 }],
    S4: [{ name: 'Operating Systems', code: 'IT202', classesPerWeek: 4 }, { name: 'Design of Algorithms', code: 'IT204', classesPerWeek: 3 }],
    S1: [{ name: 'Engineering Mathematics I', code: 'MA101', classesPerWeek: 4 }], S2: [{ name: 'Engineering Mathematics II', code: 'MA102', classesPerWeek: 4 }],
    S7: [{ name: 'Cloud Computing', code: 'IT401', classesPerWeek: 3 }], S8: [{ name: 'IoT & Embedded Systems', code: 'IT402', classesPerWeek: 3 }],
  }
};

// ─── Verdicts ────────────────────────────────────
const VERDICTS = {
  safe_high: {
    emoji: '😎',
    title: 'Bro is TOO SAFE!',
    sub: 'You can bunk this and still be the class topper. Go enjoy life.',
    ml: '"Nee safe aanu bro! ഒന്ന് relax ചെയ്!"',
    class: 'safe'
  },
  safe: {
    emoji: '👀',
    title: 'Risk is Manageable',
    sub: 'Attendance is holding up. Watch out though — one more bunk and things get spicy.',
    ml: '"Okay okay... careful aakku. Oru class koothi."',
    class: 'safe'
  },
  careful: {
    emoji: '😬',
    title: 'Careful... Attendance Getting Suspicious',
    sub: 'You\'re walking on a tightrope. Teacher is watching. We recommend attending.',
    ml: '"Bro ⚠️ 75% borderline aanu. Pokk classroom-il!"',
    class: 'warning'
  },
  danger: {
    emoji: '💀',
    title: 'BRO. JUST GO TO CLASS.',
    sub: 'Your attendance has entered danger zone. This isn\'t a simulation anymore. This is reality.',
    ml: '"Ninteyee attendance teernu poyittund! College gate kandu pidi! 🚨"',
    class: 'danger'
  },
  dead: {
    emoji: '☠️',
    title: 'YOU. ARE. DONE. 💀',
    sub: 'Bunkverse cannot save you. God cannot save you. Your attendance is beyond salvation.',
    ml: '"Bro... nee already dead aanu. College ID card return cheyy. ☠️"',
    class: 'danger'
  }
};

// ─── Helper: Is it a working day? ────────────────
function isWorkingDay(dateStr, holidaySet) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  // Skip Sunday (0) and Saturday (6)
  if (day === 0 || day === 6) return false;
  if (holidaySet.has(dateStr)) return false;
  return true;
}

// ─── Count working days in a range ───────────────
function countWorkingDays(startStr, endStr, holidaySet) {
  let count = 0;
  const end = new Date(endStr + 'T00:00:00');
  let cur = new Date(startStr + 'T00:00:00');
  while (cur <= end) {
    const curStr = cur.toISOString().split('T')[0];
    if (isWorkingDay(curStr, holidaySet)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ─── Get semester info from academic year + sem ──
function getSemesterInfo(academicYear, semCode) {
  const cal = KTU_CALENDAR[academicYear];
  if (!cal) return null;
  const semNum = parseInt(semCode.replace('S', ''));
  // Odd semesters: S1, S3, S5, S7
  // Even semesters: S2, S4, S6, S8
  if (semNum % 2 === 1) return { ...cal.odd, holidays: cal.holidays };
  return { ...cal.even, holidays: cal.holidays };
}

// ─── State for Multi-Select Subjects & Periods ────
let isMultiSubjectMode = false;
let selectedSubjectIndices = new Set([0]);
let selectedPeriods = new Set([1]);

// ─── Populate subjects dropdown & interactive chips ───
function updateSubjects() {
  const branch = document.getElementById('branch').value;
  const sem = document.getElementById('semester').value;
  const select = document.getElementById('subject');
  const tagsContainer = document.getElementById('subjectTags');
  select.innerHTML = '';
  if (tagsContainer) tagsContainer.innerHTML = '';

  const subs = (SUBJECTS[branch] && SUBJECTS[branch][sem]) || [];
  if (subs.length === 0) {
    select.innerHTML = '<option value="CUSTOM">Custom Subject (3 classes/week)</option>';
    if (tagsContainer) {
      tagsContainer.innerHTML = '<span class="subject-tag selected">Custom Subject (3 classes/week)</span>';
    }
    selectedSubjectIndices = new Set(['CUSTOM']);
    updateSubjectBadge();
    return;
  }

  // Populate dropdown options
  subs.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${s.name} (${s.code}) — ${s.classesPerWeek} hrs/week`;
    select.appendChild(opt);
  });

  // Ensure selected indices are valid
  if (!selectedSubjectIndices.has(0) && selectedSubjectIndices.size === 0) {
    selectedSubjectIndices = new Set([0]);
  }
  // Remove invalid indices if semester changed
  selectedSubjectIndices.forEach(idx => {
    if (typeof idx === 'number' && idx >= subs.length) {
      selectedSubjectIndices.delete(idx);
    }
  });
  if (selectedSubjectIndices.size === 0) {
    selectedSubjectIndices = new Set([0]);
  }

  // Populate interactive subject tags
  if (tagsContainer) {
    subs.forEach((s, i) => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'subject-tag' + (selectedSubjectIndices.has(i) ? ' selected' : '');
      tag.id = `subTag_${i}`;
      tag.innerHTML = `<span>📚</span> <strong>${s.code}</strong> ${s.name} (${s.classesPerWeek}h)`;
      tag.onclick = () => toggleSubjectTag(i);
      tagsContainer.appendChild(tag);
    });
  }

  // Sync dropdown with first selected
  const firstSelected = Array.from(selectedSubjectIndices)[0];
  if (firstSelected !== undefined && select.options[firstSelected]) {
    select.selectedIndex = firstSelected;
  }

  updateSubjectBadge();
}

// ─── Interactive Subject Tag Selection ────────────
function toggleSubjectTag(index) {
  if (isMultiSubjectMode) {
    // Multi-subject toggle: can select multiple buttons!
    if (selectedSubjectIndices.has(index)) {
      if (selectedSubjectIndices.size > 1) {
        selectedSubjectIndices.delete(index);
      } else {
        showToast('At least 1 subject must be selected!', 'info', 1500);
        return;
      }
    } else {
      selectedSubjectIndices.add(index);
    }
  } else {
    // Single-select mode: pick this one
    selectedSubjectIndices = new Set([index]);
    const select = document.getElementById('subject');
    if (select && select.options[index]) {
      select.selectedIndex = index;
    }
  }

  // Update tag styling
  document.querySelectorAll('.subject-tag').forEach((el, i) => {
    el.classList.toggle('selected', selectedSubjectIndices.has(i));
  });

  updateSubjectBadge();
}

function toggleMultiSubjectMode() {
  isMultiSubjectMode = !isMultiSubjectMode;
  const btn = document.getElementById('multiSubjectModeBtn');
  if (btn) {
    btn.textContent = isMultiSubjectMode ? '✅ Multi-Subject: ON (Click to Pick Many)' : '✨ Toggle Multi-Subject Mode';
    btn.className = isMultiSubjectMode ? 'btn btn-primary btn-xs' : 'btn btn-ghost btn-xs';
  }
  showToast(isMultiSubjectMode ? 'Multi-subject mode enabled! Click multiple subjects 📚' : 'Single subject mode enabled', 'info', 1800);
  updateSubjectBadge();
}

function syncSubjectFromDropdown() {
  const select = document.getElementById('subject');
  const val = parseInt(select.value);
  if (!isNaN(val)) {
    selectedSubjectIndices = new Set([val]);
    document.querySelectorAll('.subject-tag').forEach((el, i) => {
      el.classList.toggle('selected', i === val);
    });
    updateSubjectBadge();
  }
}

function updateSubjectBadge() {
  const badge = document.getElementById('subjectSelectionBadge');
  if (!badge) return;

  const branch = document.getElementById('branch').value;
  const sem = document.getElementById('semester').value;
  const subs = (SUBJECTS[branch] && SUBJECTS[branch][sem]) || [];

  const selectedNames = Array.from(selectedSubjectIndices).map(idx => {
    if (idx === 'CUSTOM') return 'Custom Subject';
    return subs[idx] ? subs[idx].code : `Sub #${idx + 1}`;
  });

  if (selectedSubjectIndices.size > 1) {
    badge.innerHTML = `📚 Selected (${selectedSubjectIndices.size} subjects): <strong>${selectedNames.join(', ')}</strong> (Impact calculated cumulatively)`;
  } else {
    badge.innerHTML = `📌 Selected subject: <strong>${selectedNames[0] || 'None'}</strong> — Click subject tags to switch or multi-select`;
  }
}

// ─── Semester & Branch Pill Button Sync ───────────
function setSemester(semCode) {
  const select = document.getElementById('semester');
  if (select) select.value = semCode;
  document.querySelectorAll('#semesterPills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === semCode);
  });
  updateSubjects();
}

function syncSemesterFromDropdown() {
  const select = document.getElementById('semester');
  if (select) {
    document.querySelectorAll('#semesterPills .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === select.value);
    });
  }
  updateSubjects();
}

function setBranch(branchCode) {
  const select = document.getElementById('branch');
  if (select) select.value = branchCode;
  document.querySelectorAll('#branchPills .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === branchCode);
  });
  updateSubjects();
}

function syncBranchFromDropdown() {
  const select = document.getElementById('branch');
  if (select) {
    document.querySelectorAll('#branchPills .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === select.value);
    });
  }
  updateSubjects();
}

function updateSemesters() { syncSemesterFromDropdown(); }
function updateBranches() { syncBranchFromDropdown(); }

// ─── Multi-Period Selector Logic ──────────────────
function togglePeriod(periodNum) {
  if (selectedPeriods.has(periodNum)) {
    selectedPeriods.delete(periodNum);
  } else {
    selectedPeriods.add(periodNum);
  }

  // Update button visual state
  const btn = document.getElementById(`periodBtn_${periodNum}`);
  if (btn) btn.classList.toggle('selected', selectedPeriods.has(periodNum));

  // Sync to bunkCount input
  const bunkInput = document.getElementById('bunkCount');
  if (bunkInput) bunkInput.value = selectedPeriods.size;

  updatePeriodSummary();
}

function selectPeriodsPreset(preset) {
  selectedPeriods = new Set();
  if (preset === 'all') {
    selectedPeriods = new Set([1, 2, 3, 4, 5, 6]);
  } else if (preset === 'morning') {
    selectedPeriods = new Set([1, 2, 3]);
  } else if (preset === 'afternoon') {
    selectedPeriods = new Set([4, 5, 6]);
  } else if (preset === 'p1') {
    selectedPeriods = new Set([1]);
  } // 'none' leaves it empty

  // Update all 6 buttons
  for (let i = 1; i <= 6; i++) {
    const btn = document.getElementById(`periodBtn_${i}`);
    if (btn) btn.classList.toggle('selected', selectedPeriods.has(i));
  }

  const bunkInput = document.getElementById('bunkCount');
  if (bunkInput) bunkInput.value = selectedPeriods.size;

  updatePeriodSummary();
}

function syncBunkCountToPeriods() {
  const count = parseInt(document.getElementById('bunkCount').value) || 0;
  selectedPeriods = new Set();

  for (let i = 1; i <= 6; i++) {
    const btn = document.getElementById(`periodBtn_${i}`);
    const shouldSelect = i <= count;
    if (shouldSelect) selectedPeriods.add(i);
    if (btn) btn.classList.toggle('selected', shouldSelect);
  }

  updatePeriodSummary();
}

function updatePeriodSummary() {
  const summaryEl = document.getElementById('periodSelectionSummary');
  if (!summaryEl) return;

  const sorted = Array.from(selectedPeriods).sort((a, b) => a - b);
  const count = parseInt(document.getElementById('bunkCount').value) || sorted.length;

  if (sorted.length === 0) {
    summaryEl.innerHTML = `⚠️ No periods selected (0 classes). Click period buttons above!`;
    summaryEl.style.color = 'var(--gold)';
  } else {
    const listStr = sorted.map(p => `P${p}`).join(', ');
    summaryEl.innerHTML = `🎯 Selected: <strong>${listStr}</strong> (${count} class${count > 1 ? 'es' : ''})`;
    summaryEl.style.color = 'var(--cyan)';
  }
}

// ─── Media tab switcher ───────────────────────────
function switchMediaTab(tabEl, tabId) {
  document.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.media-tab-content').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ─── Main Calculation ─────────────────────────────
function calculateBunk() {
  const academicYear = document.getElementById('academicYear').value;
  const semCode = document.getElementById('semester').value;
  const branch = document.getElementById('branch').value;
  const bunkDateStr = document.getElementById('bunkDate').value;
  const bunkCount = parseInt(document.getElementById('bunkCount').value) || selectedPeriods.size || 1;
  const alreadyBunked = parseInt(document.getElementById('alreadyBunked').value) || 0;
  const extraAttended = parseInt(document.getElementById('extraAttended').value) || 0;

  if (!bunkDateStr) { showToast('Bunk date select cheyyuu! 📅', 'error'); return; }

  const semInfo = getSemesterInfo(academicYear, semCode);
  if (!semInfo) { showToast('Academic year data not found!', 'error'); return; }

  const subs = SUBJECTS[branch] && SUBJECTS[branch][semCode];
  let classesPerWeek = 3; // default
  let subjectName = 'Custom Subject';

  if (subs && selectedSubjectIndices.size > 0) {
    const selectedSubs = Array.from(selectedSubjectIndices)
      .map(i => subs[i])
      .filter(Boolean);

    if (selectedSubs.length > 0) {
      const totalWeekly = selectedSubs.reduce((acc, s) => acc + s.classesPerWeek, 0);
      classesPerWeek = Math.round(totalWeekly / selectedSubs.length);
      subjectName = selectedSubs.map(s => s.name).join(' & ');
    }
  }

  // Show calculating state
  document.getElementById('resultSection').classList.remove('visible');
  document.getElementById('calculatingState').classList.add('active');
  document.getElementById('calculateBtn').classList.add('btn-loading');

  const subLabel = selectedSubjectIndices.size > 1 ? `${selectedSubjectIndices.size} Selected Subjects` : subjectName;

  const calcMsgs = [
    '📅 Consulting KTU Academic Calendar...',
    '🗓️ Counting working days & holidays...',
    `📚 Analyzing "${subLabel}" frequency...`,
    `💀 Evaluating impact of bunking ${bunkCount} class(es)...`,
    '🤖 Consulting the Bunk Oracle...',
    '💀 Calculating your fate...',
  ];

  fakeAILoad(calcMsgs, document.getElementById('calcMessages'), () => {
    // Actual calculation
    const holidaySet = new Set(semInfo.holidays);
    const today = new Date().toISOString().split('T')[0];
    const semStart = semInfo.start;
    const semEnd = semInfo.end;

    // Working days from sem start to today (or bunk date, whichever is sooner)
    const conductedUntil = bunkDateStr < today ? bunkDateStr : today;
    const workingDaysConducted = countWorkingDays(semStart, conductedUntil, holidaySet);
    // Weeks elapsed (approximate)
    const weeksElapsed = Math.max(1, Math.floor(workingDaysConducted / 5));
    const classesConducted = weeksElapsed * classesPerWeek;

    // Attended = conducted - alreadyBunked + extraAttended
    const classesAttended = Math.max(0, classesConducted - alreadyBunked + extraAttended);

    // Current attendance %
    const currentPct = classesConducted > 0 ? (classesAttended / classesConducted) * 100 : 0;

    // After bunk
    const afterAttended = Math.max(0, classesAttended - bunkCount);
    const afterPct = classesConducted > 0 ? (afterAttended / classesConducted) * 100 : 0;

    // Upcoming classes (from bunk date to semester end)
    const workingDaysRemaining = countWorkingDays(bunkDateStr, semEnd, holidaySet);
    const weeksRemaining = Math.max(0, Math.floor(workingDaysRemaining / 5));
    const upcomingClasses = weeksRemaining * classesPerWeek;

    // Safe bunks remaining (how many more can be bunked keeping pct >= 75%)
    // (attended - x) / conducted >= 0.75 => x <= attended - 0.75*conducted
    const safeBunks = Math.max(0, Math.floor(classesAttended - 0.75 * classesConducted));

    document.getElementById('calculatingState').classList.remove('active');
    document.getElementById('calculateBtn').classList.remove('btn-loading');

    displayResult({
      currentPct, afterPct, classesConducted, classesAttended,
      alreadyBunked, bunkCount, upcomingClasses, safeBunks,
      subjectName, semCode, branch
    });
  }, 700);
}

function displayResult(data) {
  const { currentPct, afterPct, classesConducted, classesAttended, alreadyBunked, bunkCount, upcomingClasses, safeBunks } = data;

  // Attendance circle
  const circle = document.getElementById('attendanceCircle');
  circle.className = 'attendance-circle ' + (currentPct >= 80 ? 'safe' : currentPct >= 75 ? 'warning' : 'danger');

  // Set current pct display (animate)
  const curEl = document.getElementById('currentPct');
  curEl.className = 'attendance-pct ' + (currentPct >= 80 ? 'gradient-text' : currentPct >= 75 ? 'gradient-text-gold' : 'gradient-text-red');
  animateCounter(curEl, 0, Math.round(currentPct), 1000, '%');

  // After bunk pct
  const afterEl = document.getElementById('afterBunkPct');
  afterEl.style.color = afterPct >= 75 ? 'var(--green)' : 'var(--red)';
  animateCounter(afterEl, Math.round(currentPct), Math.round(afterPct * 10) / 10, 800, '%');

  document.getElementById('bunkCountDisplay').textContent = bunkCount;

  // Change indicator
  const diff = afterPct - currentPct;
  const changeEl = document.getElementById('attendanceChange');
  changeEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}% change`;
  changeEl.style.color = diff >= 0 ? 'var(--green)' : 'var(--red)';

  // Stats
  document.getElementById('statConducted').textContent = classesConducted;
  document.getElementById('statAttended').textContent = classesAttended;
  document.getElementById('statMissed').textContent = alreadyBunked;
  document.getElementById('statPlannedBunk').textContent = bunkCount;
  document.getElementById('statUpcoming').textContent = upcomingClasses;
  document.getElementById('statSafeBunks').textContent = safeBunks;

  // Verdict
  let verdict;
  if (afterPct >= 90) verdict = VERDICTS.safe_high;
  else if (afterPct >= 80) verdict = VERDICTS.safe;
  else if (afterPct >= 75) verdict = VERDICTS.careful;
  else if (afterPct >= 60) verdict = VERDICTS.danger;
  else verdict = VERDICTS.dead;

  const verdictCard = document.getElementById('verdictCard');
  verdictCard.className = `verdict-big ${verdict.class}`;
  document.getElementById('verdictEmoji').textContent = verdict.emoji;
  document.getElementById('verdictTitle').textContent = verdict.title;
  document.getElementById('verdictSub').textContent = verdict.sub;
  document.getElementById('verdictMalayalam').textContent = verdict.ml;

  // Progress bars
  document.getElementById('progressCurrentPct').textContent = currentPct.toFixed(1) + '%';
  document.getElementById('progressAfterPct').textContent = afterPct.toFixed(1) + '%';

  const currentFill = document.getElementById('progressCurrent');
  currentFill.style.width = '0%';
  currentFill.className = 'progress-fill ' + (currentPct >= 80 ? 'green' : currentPct >= 75 ? 'gold' : 'red');
  setTimeout(() => { currentFill.style.width = Math.min(100, currentPct) + '%'; }, 100);

  const afterFill = document.getElementById('progressAfter');
  afterFill.style.width = '0%';
  afterFill.className = 'progress-fill ' + (afterPct >= 75 ? 'cyan' : 'red');
  setTimeout(() => { afterFill.style.width = Math.min(100, afterPct) + '%'; }, 300);

  // Load gallery media for this category
  loadGalleryMedia(afterPct);

  // Show result
  const resultSection = document.getElementById('resultSection');
  resultSection.classList.add('visible');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Direct Media Switchers for Bunk Reaction ────────
function setBunkMediaImage(src, caption, btnEl) {
  const img = document.getElementById('activeMemeImg') || document.querySelector('#bunkMemeImage img');
  if (img) img.src = src;
  const cap = document.getElementById('bunkMemeCategory');
  if (cap) cap.textContent = `Reaction: ${caption}`;

  if (btnEl) {
    document.querySelectorAll('#bunkMemeImage .reaction-btn').forEach(b => b.classList.remove('selected-reaction'));
    btnEl.classList.add('selected-reaction');
  }

  showToast(`Switched meme: ${caption}`, 'info', 1500);
}

function setBunkMediaVideo(src, caption, btnEl) {
  const vid = document.getElementById('bunkVideoPlayer') || document.querySelector('#bunkMemeVideo video');
  if (vid) {
    vid.src = src;
    vid.load();
    vid.play().catch(() => {});
  }
  const cap = document.getElementById('bunkVideoCaption');
  if (cap) cap.textContent = caption;

  if (btnEl) {
    document.querySelectorAll('#bunkMemeVideo .reaction-btn').forEach(b => b.classList.remove('selected-reaction'));
    btnEl.classList.add('selected-reaction');
  }

  showToast(`Switched video reaction! 🎬`, 'info', 1500);
}

// ─── Load media from gallery (Storage with Preset Fallback) ──────
function loadGalleryMedia(pct) {
  let category;
  if (pct >= 90) category = 'above90';
  else if (pct >= 80) category = '80to89';
  else if (pct >= 75) category = '75to79';
  else category = 'below75';

  const categoryLabel = getCategoryLabel(category);
  const media = typeof getCategoryMedia === 'function'
    ? getCategoryMedia(category)
    : (Storage.get(`gallery_${category}`, {}));

  // Update image
  const img = document.getElementById('activeMemeImg');
  const catEl = document.getElementById('bunkMemeCategory');
  if (img && media.image) {
    img.src = media.image;
    if (catEl) catEl.textContent = `Reaction: ${categoryLabel} ${media.isCustomImage ? '• Custom' : '• From Files'}`;
  } else if (!img) {
    const memeBox = document.getElementById('bunkMemeImage');
    if (memeBox && media.image) {
      memeBox.innerHTML = `
        <img id="activeMemeImg" src="${media.image}" alt="${categoryLabel} Meme" style="width:100%;max-height:360px;object-fit:contain;border-radius:var(--radius);background:#000;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
        <div style="margin-top:10px;font-size:0.85rem;color:var(--purple-light);font-weight:600;" id="bunkMemeCategory">Reaction: ${categoryLabel}</div>`;
    }
  }

  // Update video
  const vid = document.getElementById('bunkVideoPlayer');
  const vidCap = document.getElementById('bunkVideoCaption');
  if (vid && media.video) {
    vid.src = media.video;
    vid.load();
    if (vidCap) vidCap.textContent = `🎬 Reaction Video: ${categoryLabel}`;
  } else if (!vid) {
    const videoBox = document.getElementById('bunkMemeVideo');
    if (videoBox && media.video) {
      videoBox.innerHTML = `
        <video id="bunkVideoPlayer" src="${media.video}" controls playsinline preload="auto" style="width:100%;max-height:360px;border-radius:var(--radius);background:#000;box-shadow:0 8px 24px rgba(0,0,0,0.4);"></video>
        <div style="margin-top:10px;font-size:0.85rem;color:var(--cyan);font-weight:600;" id="bunkVideoCaption">🎬 Reaction Video: ${categoryLabel}</div>`;
    }
  }

  // Update dialogue
  const diaText = document.getElementById('activeDialogueText');
  const diaCap = document.getElementById('dialogueCaption');
  if (diaText && media.dialogue) {
    diaText.textContent = `"${media.dialogue}"`;
    if (diaCap) diaCap.textContent = `${categoryLabel} Dialogue Reaction`;
  }
}

function getCategoryLabel(cat) {
  const labels = {
    above90: '90%+ Attendance 😇',
    '80to89': '80–89% Attendance 😎',
    '75to79': '75–79% Attendance 😬',
    below75: 'Below 75% Attendance 💀'
  };
  return labels[cat] || cat;
}

function toggleReactionPreview() {
  const resultSec = document.getElementById('resultSection');
  const btn = document.getElementById('toggleReactionPreviewBtn');
  if (resultSec) {
    const isVisible = resultSec.classList.contains('visible');
    if (isVisible) {
      resultSec.classList.remove('visible');
      if (btn) btn.textContent = '👀 Preview / Test Reactions';
    } else {
      resultSec.classList.add('visible');
      if (btn) btn.textContent = '🙈 Hide Preview';
      // Load default media if not populated
      loadGalleryMedia(85);
      resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function resetForm() {
  document.getElementById('resultSection').classList.remove('visible');
  const previewBtn = document.getElementById('toggleReactionPreviewBtn');
  if (previewBtn) previewBtn.textContent = '👀 Preview / Test Reactions';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateSubjects();
  // Set default date to today, allow picking future dates
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('bunkDate');
  if (dateInput) {
    dateInput.value = today;
    dateInput.max = '2027-06-30';
  }
  // Initialize period selection (Period 1 selected by default)
  selectPeriodsPreset('p1');
});
