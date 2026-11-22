// ── State ────────────────────────────────────────────────
const state = {
  section: 'nonlab',
  nlMode:  'mid',
  labMode: 'mid',
  counts: { nlQuiz:1, nlAssign:1, tQuiz:1, tAssign:1, labAssign:1, labQuiz:0 },
};

// ── Row Config ───────────────────────────────────────────
const ROW_CFG = {
  nlQuiz:    { container: 'nl-quizRows',        label: 'Quiz'            },
  nlAssign:  { container: 'nl-assignRows',       label: 'Assignment'      },
  tQuiz:     { container: 'lab-tQuizRows',       label: 'Theory Quiz'     },
  tAssign:   { container: 'lab-tAssignRows',     label: 'Theory Assign'   },
  labAssign: { container: 'lab-labAssignRows',   label: 'Lab Assign'      },
  labQuiz:   { container: 'lab-labQuizRows',     label: 'Lab Quiz'        },
};

// ── Navigation ───────────────────────────────────────────
function setSection(s) {
  state.section = s;
  document.getElementById('sec-nonlab').style.display = s === 'nonlab' ? 'block' : 'none';
  document.getElementById('sec-lab').style.display    = s === 'lab'    ? 'block' : 'none';
  document.getElementById('nav-nonlab').classList.toggle('active', s === 'nonlab');
  document.getElementById('nav-lab').classList.toggle('active',    s === 'lab');
  clearErrors();
}

function setNLMode(m) {
  state.nlMode = m;
  ['mid','final','target'].forEach(x =>
    document.getElementById('nl-tab-' + x).classList.toggle('active', x === m));
  const isFinal  = m === 'final';
  const isTarget = m === 'target';
  document.getElementById('nl-finalComp').style.display   = (isFinal || isTarget) ? 'block' : 'none';
  document.getElementById('nl-finalObtWrap').style.display = isTarget ? 'none'  : 'contents';
  document.getElementById('nl-finalTitle').textContent     = isTarget ? 'Final Exam (Max Marks)' : 'Final Exam';
  document.getElementById('nl-targetCard').style.display   = isTarget ? 'block' : 'none';
  document.getElementById('nl-calcBtn').textContent        = isTarget ? 'Calculate Required Final Marks' : 'Calculate';
  hideNLResult();
}

function setLabMode(m) {
  state.labMode = m;
  ['mid','final','target'].forEach(x =>
    document.getElementById('lab-tab-' + x).classList.toggle('active', x === m));
  const isFinal  = m === 'final';
  const isTarget = m === 'target';
  document.getElementById('lab-tFinalComp').style.display    = isFinal  ? 'block' : 'none';
  document.getElementById('lab-labFinalComp').style.display  = isFinal  ? 'block' : 'none';
  document.getElementById('lab-targetCard').style.display    = isTarget ? 'block' : 'none';
  document.getElementById('lab-calcBtn').textContent         = isTarget ? 'Show Current Standing' : 'Calculate';
  hideLabResult();
}

// ── Row Management ───────────────────────────────────────
function getRowVals(prefix, count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      obt:   (document.getElementById(prefix + '_obt_'   + i)?.value ?? '').replace(',', '.'),
      total: (document.getElementById(prefix + '_total_' + i)?.value ?? '').replace(',', '.'),
    });
  }
  return rows;
}

function renderRows(prefix, count, savedVals) {
  const cfg = ROW_CFG[prefix];
  const el  = document.getElementById(cfg.container);
  if (count === 0) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 0; i < count; i++) {
    const v  = savedVals?.[i] ?? {};
    const rm = count > 1
      ? `<button class="rm-btn" onclick="removeRow('${prefix}',${i},${count})" title="Remove">&#x2715;</button>`
      : '';
    html += `
      <div class="marks-row">
        <span class="row-label">${cfg.label} ${i + 1}</span>
        <input type="number" id="${prefix}_obt_${i}"   class="marks-input"
          placeholder="Obtained" value="${v.obt ?? ''}"   min="0"    step="any">
        <span class="slash">/</span>
        <input type="number" id="${prefix}_total_${i}" class="marks-input"
          placeholder="Total"    value="${v.total ?? ''}" min="0.01" step="any">
        ${rm}
      </div>`;
  }
  el.innerHTML = html;
}

function addRow(prefix) {
  const saved = getRowVals(prefix, state.counts[prefix]);
  state.counts[prefix]++;
  renderRows(prefix, state.counts[prefix], saved);
  hideNLResult(); hideLabResult();
}

function removeRow(prefix, idx, count) {
  const saved = getRowVals(prefix, count).filter((_, i) => i !== idx);
  state.counts[prefix]--;
  renderRows(prefix, state.counts[prefix], saved);
  hideNLResult(); hideLabResult();
}

// ── Helpers ──────────────────────────────────────────────
function numVal(id) {
  const v = document.getElementById(id)?.value;
  if (v === '' || v == null) return null;
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Pool all rows: sum(obt)/sum(total)*100 — never average individual %
function poolRows(rows) {
  const valid = rows.filter(r => {
    if (r.obt === '' || r.total === '' || r.obt == null || r.total == null) return false;
    const obt = parseFloat(String(r.obt).replace(',', '.'));
    const tot = parseFloat(String(r.total).replace(',', '.'));
    return !isNaN(obt) && !isNaN(tot) && tot > 0;
  });
  if (!valid.length) return null;
  const sumObt   = valid.reduce((s, r) => s + parseFloat(String(r.obt).replace(',',   '.')), 0);
  const sumTotal = valid.reduce((s, r) => s + parseFloat(String(r.total).replace(',', '.')), 0);
  return { sumObt, sumTotal, pct: sumObt / sumTotal * 100 };
}

function fmt(n, d = 2) {
  if (n === null || n === undefined) return '—';
  return (+n).toFixed(d);
}

function grade(pct) {
  if (pct >= 85) return { letter: 'A',  gpa: '4.00', cls: 'g-a'  };
  if (pct >= 80) return { letter: 'B+', gpa: '3.50', cls: 'g-b'  };
  if (pct >= 75) return { letter: 'B',  gpa: '3.00', cls: 'g-b'  };
  if (pct >= 70) return { letter: 'C+', gpa: '2.50', cls: 'g-c'  };
  if (pct >= 65) return { letter: 'C',  gpa: '2.00', cls: 'g-c'  };
  if (pct >= 60) return { letter: 'D+', gpa: '1.50', cls: 'g-d'  };
  if (pct >= 55) return { letter: 'D',  gpa: '1.00', cls: 'g-d'  };
  return               { letter: 'F',  gpa: '0.00', cls: 'g-f'  };
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearErrors() {
  document.getElementById('errorMsg').classList.remove('show');
}

function hideNLResult() {
  document.getElementById('nl-result').style.display = 'none';
  clearErrors();
}

function hideLabResult() {
  const lr = document.getElementById('lab-result');
  const tr = document.getElementById('lab-tgt-result');
  if (lr) lr.style.display = 'none';
  if (tr) { tr.style.display = 'none'; tr.innerHTML = ''; }
  clearErrors();
}

function showResult(id, html) {
  const el = document.getElementById(id);
  el.innerHTML = html;
  el.style.display = 'block';
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

// ── Validation helpers ───────────────────────────────────
function validatePair(obt, total, label) {
  if (obt === null || total === null) return `Enter ${label} marks.`;
  if (total <= 0) return `${label} total must be > 0.`;
  if (obt < 0)   return `${label} obtained cannot be negative.`;
  if (obt > total) return `${label} obtained (${fmt(obt)}) exceeds total (${fmt(total)}).`;
  return null;
}

// ── Shared theory calculation ─────────────────────────────
// Returns full theory detail object. finalObt/finalTotal null = midterm mode.
function computeTheory(quizRows, assignRows, midObt, midTotal, finalObt, finalTotal) {
  const qPool = poolRows(quizRows);
  const aPool = poolRows(assignRows);
  const quizContrib   = qPool ? qPool.pct * 0.15 : 0;
  const assignContrib = aPool ? aPool.pct * 0.10 : 0;
  const midContrib    = midObt / midTotal * 25;
  const isFinal = finalObt !== null && finalTotal !== null && finalTotal > 0;
  const finalContrib  = isFinal ? finalObt / finalTotal * 50 : 0;
  const total = quizContrib + assignContrib + midContrib + finalContrib;
  return { quizContrib, assignContrib, midContrib, finalContrib, total, isFinal, qPool, aPool };
}

// ── Lab entries pooler ────────────────────────────────────
function labPool(labAssignRows, labQuizRows, singlePairs) {
  const singles = singlePairs
    .filter(p => p.obt !== null && p.total !== null && p.total > 0)
    .map(p => ({ obt: String(p.obt), total: String(p.total) }));
  return poolRows([...labAssignRows, ...labQuizRows, ...singles]);
}

// ── Current lab state (without finals) ──────────────────
function computeLabCurrent() {
  const tQuizRows   = getRowVals('tQuiz',   state.counts.tQuiz);
  const tAssignRows = getRowVals('tAssign',  state.counts.tAssign);
  const tMidObt     = numVal('lab-tMidObt');
  const tMidTotal   = numVal('lab-tMidTotal');
  if (tMidObt === null || tMidTotal === null || tMidTotal <= 0) return null;

  const th = computeTheory(tQuizRows, tAssignRows, tMidObt, tMidTotal, null, null);

  const labAssignRows = getRowVals('labAssign', state.counts.labAssign);
  const labQuizRows   = getRowVals('labQuiz',   state.counts.labQuiz);
  const labMidObt     = numVal('lab-labMidObt');
  const labMidTotal   = numVal('lab-labMidTotal');
  const lPool = labPool(labAssignRows, labQuizRows, [{obt: labMidObt, total: labMidTotal}]);

  const theoryMidMarks = th.total; // 0–50
  const theoryEarned   = theoryMidMarks / 100 * 67;
  const labEarned      = lPool ? lPool.pct / 100 * 33 : 0;

  return { th, lPool, theoryMidMarks, theoryEarned, labEarned };
}

// ── NON-LAB CALCULATOR ───────────────────────────────────
function calcNonLab() {
  clearErrors();
  const m = state.nlMode;

  const quizRows   = getRowVals('nlQuiz',   state.counts.nlQuiz);
  const assignRows = getRowVals('nlAssign',  state.counts.nlAssign);
  const midObt     = numVal('nl-midObt');
  const midTotal   = numVal('nl-midTotal');

  const midErr = validatePair(midObt, midTotal, 'Midterm');
  if (midErr) return showError(midErr);

  if (m === 'mid') {
    const th = computeTheory(quizRows, assignRows, midObt, midTotal, null, null);
    const pct = th.total / 50 * 100;
    const g   = grade(pct);
    showResult('nl-result', buildNLMidResult(th, pct, g));
    saveToHistory({ type:'nonlab', mode:'mid', marks: fmt(th.total)+' / 50', pct, grade: g });
    return;
  }

  if (m === 'final') {
    const finalObt   = numVal('nl-finalObt');
    const finalTotal = numVal('nl-finalTotal');
    const fErr = validatePair(finalObt, finalTotal, 'Final Exam');
    if (fErr) return showError(fErr);
    const th = computeTheory(quizRows, assignRows, midObt, midTotal, finalObt, finalTotal);
    const pct = th.total; // already out of 100
    const g   = grade(pct);
    showResult('nl-result', buildNLFinalResult(th, pct, g));
    saveToHistory({ type:'nonlab', mode:'final', marks: fmt(th.total)+' / 100', pct, grade: g });
    return;
  }

  if (m === 'target') {
    const target     = numVal('nl-target');
    const finalTotal = numVal('nl-finalTotal');
    if (target === null) return showError('Enter your target score (out of 100).');
    if (target < 0 || target > 100) return showError('Target must be between 0 and 100.');
    if (finalTotal === null || finalTotal <= 0) return showError('Enter Final Exam max marks.');
    const th = computeTheory(quizRows, assignRows, midObt, midTotal, null, null);
    const currentMarks = th.total; // 0–50
    const reqFinalContrib = target - currentMarks; // 0–50 scale
    const reqFinalRaw     = reqFinalContrib / 50 * finalTotal;
    const maxAchievable   = currentMarks + 50;
    showResult('nl-result', buildNLTargetResult(th, target, finalTotal, currentMarks, reqFinalContrib, reqFinalRaw, maxAchievable));
  }
}

// ── LAB CALCULATOR ───────────────────────────────────────
function calcLab() {
  clearErrors();
  const m = state.labMode;

  const cur = computeLabCurrent();
  if (!cur) return showError('Enter Theory Midterm marks.');

  const { th, lPool, theoryMidMarks, theoryEarned, labEarned } = cur;

  if (m === 'mid') {
    const available  = 66.5; // (50/100*67) + 33
    const actual     = theoryEarned + labEarned;
    const normalized = actual / available * 50;
    const g = grade(normalized / 50 * 100);
    showResult('lab-result', buildLabMidResult(th, lPool, theoryMidMarks, theoryEarned, labEarned, actual, available, normalized, g));
    saveToHistory({ type:'lab', mode:'mid', marks: fmt(normalized)+' / 50', pct: normalized / 50 * 100, grade: g });
    return;
  }

  if (m === 'final') {
    const tFinalObt   = numVal('lab-tFinalObt');
    const tFinalTotal = numVal('lab-tFinalTotal');
    const tfErr = validatePair(tFinalObt, tFinalTotal, 'Theory Final Exam');
    if (tfErr) return showError(tfErr);

    const labFinalObt   = numVal('lab-labFinalObt');
    const labFinalTotal = numVal('lab-labFinalTotal');
    const lfErr = validatePair(labFinalObt, labFinalTotal, 'Lab Final Exam');
    if (lfErr) return showError(lfErr);

    const tQuizRows   = getRowVals('tQuiz',   state.counts.tQuiz);
    const tAssignRows = getRowVals('tAssign',  state.counts.tAssign);
    const tMidObt     = numVal('lab-tMidObt');
    const tMidTotal   = numVal('lab-tMidTotal');
    const thFull = computeTheory(tQuizRows, tAssignRows, tMidObt, tMidTotal, tFinalObt, tFinalTotal);

    const labAssignRows = getRowVals('labAssign', state.counts.labAssign);
    const labQuizRows   = getRowVals('labQuiz',   state.counts.labQuiz);
    const labMidObt     = numVal('lab-labMidObt');
    const labMidTotal   = numVal('lab-labMidTotal');
    const lPoolFull = labPool(labAssignRows, labQuizRows, [
      {obt: labMidObt,   total: labMidTotal},
      {obt: labFinalObt, total: labFinalTotal},
    ]);

    const theoryContrib = thFull.total / 100 * 67;
    const labContrib    = lPoolFull ? lPoolFull.pct / 100 * 33 : 0;
    const total = theoryContrib + labContrib;
    const g = grade(total);
    showResult('lab-result', buildLabFinalResult(thFull, lPoolFull, theoryContrib, labContrib, total, g));
    saveToHistory({ type:'lab', mode:'final', marks: fmt(total)+' / 100', pct: total, grade: g });
    return;
  }

  if (m === 'target') {
    const available  = 66.5;
    const actual     = theoryEarned + labEarned;
    const normalized = actual / available * 50;
    showResult('lab-result', buildLabCurrentResult(th, lPool, theoryMidMarks, theoryEarned, labEarned, actual, available, normalized));
  }
}

// ── LAB TARGET OPTION CALCULATORS ───────────────────────
function calcLabTarget(option) {
  clearErrors();
  const cur = computeLabCurrent();
  if (!cur) return showError('Enter Theory Midterm marks first, then calculate.');
  const { theoryMidMarks, theoryEarned, lPool, labEarned } = cur;

  const target         = numVal('lab-target');
  const tFinalTotal    = numVal('lab-tgt-tFinalTotal');
  const labFinalTotal  = numVal('lab-tgt-labFinalTotal');
  if (target === null)        return showError('Enter your target overall score.');
  if (target < 0 || target > 100) return showError('Target must be 0–100.');
  if (labFinalTotal === null || labFinalTotal <= 0) return showError('Enter Lab Final Exam total marks.');

  const labPool_current = lPool;

  if (option === 'theory') {
    if (tFinalTotal === null || tFinalTotal <= 0) return showError('Enter Theory Final Exam total marks.');
    const expLabPct = numVal('lab-expLabPct');
    if (expLabPct === null) return showError('Enter expected Lab Final performance (%).');
    if (expLabPct < 0 || expLabPct > 100) return showError('Lab Final % must be 0–100.');

    // Expected lab pool including the final
    const curLabSumObt   = labPool_current ? labPool_current.sumObt   : 0;
    const curLabSumTotal = labPool_current ? labPool_current.sumTotal  : 0;
    const expLabFinalObt = expLabPct / 100 * labFinalTotal;
    const expLabAllObt   = curLabSumObt   + expLabFinalObt;
    const expLabAllTotal = curLabSumTotal + labFinalTotal;
    const expLabPoolPct  = expLabAllObt / expLabAllTotal * 100;
    const expLabContrib  = expLabPoolPct / 100 * 33;

    // Required theory contribution toward subject
    const reqTheoryContrib = target - expLabContrib; // out of 67
    // Convert to theory-internal scale (0–100)
    const reqTheoryInternal = reqTheoryContrib * 100 / 67;
    // Required from final exam (0–50 theory internal scale)
    const reqFromFinal = reqTheoryInternal - theoryMidMarks;
    // Convert to raw marks on the actual final exam
    const reqFinalRaw  = reqFromFinal / 50 * tFinalTotal;
    const reqFinalPct  = reqFinalRaw / tFinalTotal * 100;
    const achievable   = reqFinalRaw >= 0 && reqFinalRaw <= tFinalTotal;
    const maxWith      = theoryMidMarks + 50; // perfect theory final
    const maxTheoryContrib = maxWith / 100 * 67;
    const maxTotal     = maxTheoryContrib + expLabContrib;

    const html = buildLabTargetResult('theory', {
      target, expLabPct, expLabContrib, reqTheoryContrib,
      reqFinalRaw, reqFinalPct, tFinalTotal, achievable, maxTotal,
      reqFromFinal, theoryMidMarks,
    });
    showResult('lab-tgt-result', html);

  } else {
    // Option B: enter expected theory final, get required lab final
    const expTFinalObt   = numVal('lab-expTFinalObt');
    const expTFinalTotal = numVal('lab-expTFinalTotal');
    if (expTFinalObt === null || expTFinalTotal === null || expTFinalTotal <= 0)
      return showError('Enter expected Theory Final marks (obtained and total).');
    if (expTFinalObt > expTFinalTotal) return showError('Theory Final obtained exceeds total.');

    const tFinalContrib     = expTFinalObt / expTFinalTotal * 50;
    const theoryFinalMarks  = theoryMidMarks + tFinalContrib; // 0–100
    const expTheoryContrib  = theoryFinalMarks / 100 * 67;

    // Required lab pool %
    const reqLabPoolPct = (target - expTheoryContrib) / 33 * 100;
    // Required total lab marks (combined pool)
    const curLabSumObt   = labPool_current ? labPool_current.sumObt   : 0;
    const curLabSumTotal = labPool_current ? labPool_current.sumTotal  : 0;
    const reqTotalLabObt  = reqLabPoolPct / 100 * (curLabSumTotal + labFinalTotal);
    const reqLabFinalObt  = reqTotalLabObt - curLabSumObt;
    const reqLabFinalPct  = reqLabFinalObt / labFinalTotal * 100;
    const achievable      = reqLabFinalPct >= 0 && reqLabFinalPct <= 100;
    const maxLabContrib   = 33; // 100% lab pool
    const maxTotal        = expTheoryContrib + maxLabContrib;

    const html = buildLabTargetResult('lab', {
      target, expTFinalObt, expTFinalTotal, expTheoryContrib,
      reqLabPoolPct, reqLabFinalObt, reqLabFinalPct, labFinalTotal,
      achievable, maxTotal,
    });
    showResult('lab-tgt-result', html);
  }
}

// ── Result Builders ──────────────────────────────────────
function subjectName() {
  return document.getElementById('subjectName').value.trim() || 'Your Subject';
}

function bkRow(label, val, outOf, pct) {
  const w = Math.min(100, Math.max(0, pct));
  return `
    <div class="bk-row">
      <span class="bk-label">${label}</span>
      <div class="bk-bar-wrap"><div class="bk-bar" style="width:${w}%"></div></div>
      <span class="bk-val">${fmt(val)} / ${outOf}</span>
    </div>`;
}

function resHeader(g) {
  const subj = subjectName();
  return `
    <div class="res-header ${g.cls}">
      <div class="res-subject">${subj}</div>
      <div class="res-grade-badge">
        <span class="res-grade-letter">${g.letter}</span>
        <span class="res-gpa">GPA ${g.gpa}</span>
      </div>
    </div>`;
}

function resStats2(val1, lbl1, val2, lbl2) {
  return `
    <div class="res-stats">
      <div class="res-stat">
        <div class="res-val">${val1}</div>
        <div class="res-lbl">${lbl1}</div>
      </div>
      <div class="res-divider"></div>
      <div class="res-stat">
        <div class="res-val">${val2}</div>
        <div class="res-lbl">${lbl2}</div>
      </div>
    </div>`;
}

function buildNLMidResult(th, pct, g) {
  const qMax = th.qPool ? 15 : 0, aMax = th.aPool ? 10 : 0;
  return `
    ${resHeader(g)}
    ${resStats2(fmt(th.total) + ' / 50', 'Marks out of 50', fmt(pct) + '%', 'Percentage')}
    <div class="res-breakdown">
      ${bkRow('Quizzes',     th.quizContrib,   15, th.quizContrib   / 15  * 100)}
      ${bkRow('Assignments', th.assignContrib, 10, th.assignContrib / 10  * 100)}
      ${bkRow('Midterm',     th.midContrib,    25, th.midContrib    / 25  * 100)}
    </div>`;
}

function buildNLFinalResult(th, pct, g) {
  return `
    ${resHeader(g)}
    ${resStats2(fmt(th.total) + ' / 100', 'Marks out of 100', fmt(pct) + '%', 'Percentage')}
    <div class="res-breakdown">
      ${bkRow('Quizzes',     th.quizContrib,   15, th.quizContrib   / 15  * 100)}
      ${bkRow('Assignments', th.assignContrib, 10, th.assignContrib / 10  * 100)}
      ${bkRow('Midterm',     th.midContrib,    25, th.midContrib    / 25  * 100)}
      ${bkRow('Final Exam',  th.finalContrib,  50, th.finalContrib  / 50  * 100)}
    </div>`;
}

function buildNLTargetResult(th, target, finalTotal, currentMarks, reqFinalContrib, reqFinalRaw, maxAchievable) {
  const reqPct      = reqFinalRaw / finalTotal * 100;
  const achievable  = reqFinalRaw >= 0 && reqFinalRaw <= finalTotal;
  const alreadyMet  = reqFinalContrib <= 0;
  const statusCls   = achievable ? 'status-ok' : 'status-fail';
  const statusTxt   = alreadyMet
    ? '✓ Target already met with current marks alone!'
    : achievable
      ? `✓ Achievable — score ${fmt(reqPct)}% on the final exam`
      : `✗ Not achievable — maximum you can reach is ${fmt(maxAchievable)} / 100`;

  return `
    <div class="res-target">
      <div class="res-target-title">Required Final Exam Marks</div>
      <div class="res-target-grid">
        <div class="tgt-block">
          <div class="tgt-val">${fmt(currentMarks)} / 50</div>
          <div class="tgt-lbl">Current Marks (without Final)</div>
        </div>
        <div class="tgt-arrow">→</div>
        <div class="tgt-block tgt-block-main">
          <div class="tgt-val tgt-val-big">${alreadyMet ? '—' : fmt(reqFinalRaw)} / ${fmt(finalTotal)}</div>
          <div class="tgt-lbl">Required Final Exam Marks</div>
        </div>
      </div>
      <div class="tgt-detail-row">
        <span>Required final contribution</span>
        <span>${fmt(reqFinalContrib)} / 50</span>
      </div>
      <div class="tgt-detail-row">
        <span>Required final %</span>
        <span>${alreadyMet ? '—' : fmt(reqPct) + '%'}</span>
      </div>
      <div class="tgt-detail-row">
        <span>Target</span>
        <span>${fmt(target)} / 100</span>
      </div>
      <div class="tgt-detail-row">
        <span>Max achievable</span>
        <span>${fmt(maxAchievable)} / 100</span>
      </div>
      <div class="tgt-status ${statusCls}">${statusTxt}</div>
    </div>`;
}

function buildLabMidResult(th, lPool, theoryMidMarks, theoryEarned, labEarned, actual, available, normalized, g) {
  const labSumObt   = lPool ? lPool.sumObt   : 0;
  const labSumTotal = lPool ? lPool.sumTotal  : 0;
  const labPct      = lPool ? lPool.pct       : 0;
  const normPct     = normalized / 50 * 100;
  return `
    ${resHeader(g)}
    <div class="res-stats">
      <div class="res-stat">
        <div class="res-val">${fmt(actual)} / ${fmt(available)}</div>
        <div class="res-lbl">Actual Earned Contribution</div>
      </div>
      <div class="res-divider"></div>
      <div class="res-stat">
        <div class="res-val">${fmt(normalized)} / 50</div>
        <div class="res-lbl">Normalized out of 50</div>
      </div>
    </div>
    <div class="res-note">Actual = real weight toward final subject grade. Normalized = your progress scaled to 50.</div>
    <div class="res-breakdown">
      <div class="bk-section-title">Theory (67% of subject)</div>
      ${bkRow('Quizzes',     th.quizContrib,   15, th.quizContrib  / 15 * 100)}
      ${bkRow('Assignments', th.assignContrib, 10, th.assignContrib / 10 * 100)}
      ${bkRow('Midterm',     th.midContrib,    25, th.midContrib   / 25 * 100)}
      ${bkRow('Theory Marks', theoryMidMarks,  50, theoryMidMarks  / 50 * 100)}
      ${bkRow('Theory Earned →', theoryEarned, 33.5, theoryEarned / 33.5 * 100)}
      <div class="bk-section-title">Lab (33% of subject)</div>
      ${bkRow('Lab Pool: ' + fmt(labSumObt) + '/' + fmt(labSumTotal), labEarned, 33, labEarned / 33 * 100)}
    </div>`;
}

function buildLabFinalResult(th, lPool, theoryContrib, labContrib, total, g) {
  const labSumObt   = lPool ? lPool.sumObt   : 0;
  const labSumTotal = lPool ? lPool.sumTotal  : 0;
  return `
    ${resHeader(g)}
    ${resStats2(fmt(total) + ' / 100', 'Marks out of 100', fmt(total) + '%', 'Percentage')}
    <div class="res-breakdown">
      <div class="bk-section-title">Theory Component (67%)</div>
      ${bkRow('Quizzes',     th.quizContrib,   15, th.quizContrib   / 15 * 100)}
      ${bkRow('Assignments', th.assignContrib, 10, th.assignContrib / 10 * 100)}
      ${bkRow('Midterm',     th.midContrib,    25, th.midContrib    / 25 * 100)}
      ${bkRow('Final Exam',  th.finalContrib,  50, th.finalContrib  / 50 * 100)}
      ${bkRow('Theory → Subject', theoryContrib, 67, theoryContrib / 67 * 100)}
      <div class="bk-section-title">Lab Component (33%)</div>
      ${bkRow('Lab Pool: ' + fmt(labSumObt) + '/' + fmt(labSumTotal), labContrib, 33, labContrib / 33 * 100)}
    </div>`;
}

function buildLabCurrentResult(th, lPool, theoryMidMarks, theoryEarned, labEarned, actual, available, normalized) {
  return `
    <div class="res-target">
      <div class="res-target-title">Current Standing (without Finals)</div>
      <div class="res-target-grid">
        <div class="tgt-block">
          <div class="tgt-val">${fmt(theoryEarned)} / 33.5</div>
          <div class="tgt-lbl">Theory Earned</div>
        </div>
        <div class="tgt-arrow">+</div>
        <div class="tgt-block">
          <div class="tgt-val">${fmt(labEarned)} / 33</div>
          <div class="tgt-lbl">Lab Earned</div>
        </div>
      </div>
      <div class="tgt-detail-row"><span>Total earned so far</span><span>${fmt(actual)} / ${fmt(available)}</span></div>
      <div class="tgt-detail-row"><span>Normalized progress</span><span>${fmt(normalized)} / 50</span></div>
      <div class="res-note" style="margin-top:12px">Use the options below to calculate required final exam marks.</div>
    </div>`;
}

function buildLabTargetResult(option, d) {
  if (option === 'theory') {
    const achievable = d.reqFromFinal >= 0 && d.reqFinalRaw >= 0 && d.reqFinalRaw <= d.tFinalTotal;
    const statusCls  = achievable ? 'status-ok' : 'status-fail';
    const statusTxt  = d.reqFromFinal <= 0
      ? '✓ Theory midterm marks alone are sufficient!'
      : achievable
        ? `✓ Achievable — score ${fmt(d.reqFinalPct)}% on the Theory Final`
        : `✗ Not achievable — max overall with perfect Theory Final is ${fmt(d.maxTotal)}`;
    return `
      <div class="res-target">
        <div class="res-target-title">Required Theory Final Marks (Option A)</div>
        <div class="tgt-detail-row"><span>Expected Lab Final performance</span><span>${fmt(d.expLabPct)}%</span></div>
        <div class="tgt-detail-row"><span>Expected Lab contribution</span><span>${fmt(d.expLabContrib)} / 33</span></div>
        <div class="tgt-detail-row"><span>Required Theory contribution to subject</span><span>${fmt(d.reqTheoryContrib)} / 67</span></div>
        <div class="tgt-block-main tgt-block" style="margin:12px 0">
          <div class="tgt-val tgt-val-big">${d.reqFromFinal <= 0 ? '—' : fmt(d.reqFinalRaw)} / ${fmt(d.tFinalTotal)}</div>
          <div class="tgt-lbl">Required Theory Final Marks</div>
        </div>
        <div class="tgt-detail-row"><span>Required Theory Final %</span><span>${d.reqFromFinal <= 0 ? '—' : fmt(d.reqFinalPct) + '%'}</span></div>
        <div class="tgt-status ${statusCls}">${statusTxt}</div>
      </div>`;
  } else {
    const achievable = d.reqLabPoolPct >= 0 && d.reqLabFinalPct >= 0 && d.reqLabFinalPct <= 100;
    const statusCls  = achievable ? 'status-ok' : 'status-fail';
    const statusTxt  = d.reqLabFinalPct <= 0
      ? '✓ Lab already above target — theory alone exceeds target!'
      : achievable
        ? `✓ Achievable — score ${fmt(d.reqLabFinalPct)}% on the Lab Final`
        : `✗ Not achievable — max overall is ${fmt(d.maxTotal)}`;
    return `
      <div class="res-target">
        <div class="res-target-title">Required Lab Final Marks (Option B)</div>
        <div class="tgt-detail-row"><span>Expected Theory contribution to subject</span><span>${fmt(d.expTheoryContrib)} / 67</span></div>
        <div class="tgt-detail-row"><span>Required Lab pool %</span><span>${fmt(d.reqLabPoolPct)}%</span></div>
        <div class="tgt-block-main tgt-block" style="margin:12px 0">
          <div class="tgt-val tgt-val-big">${d.reqLabFinalPct <= 0 ? '—' : fmt(d.reqLabFinalObt)} / ${fmt(d.labFinalTotal)}</div>
          <div class="tgt-lbl">Required Lab Final Marks</div>
        </div>
        <div class="tgt-detail-row"><span>Required Lab Final %</span><span>${d.reqLabFinalPct <= 0 ? '—' : fmt(d.reqLabFinalPct) + '%'}</span></div>
        <div class="tgt-status ${statusCls}">${statusTxt}</div>
      </div>`;
  }
}

// ── Init ─────────────────────────────────────────────────
(function init() {
  renderRows('nlQuiz',    state.counts.nlQuiz,    null);
  renderRows('nlAssign',  state.counts.nlAssign,  null);
  renderRows('tQuiz',     state.counts.tQuiz,     null);
  renderRows('tAssign',   state.counts.tAssign,   null);
  renderRows('labAssign', state.counts.labAssign, null);
  renderRows('labQuiz',   state.counts.labQuiz,   null); // 0 → empty
})();

// ── Self-tests ────────────────────────────────────────────
// Run in browser console: runTests()
function runTests() {
  const pass = (name, got, exp, tol=0.01) => {
    const ok = Math.abs(got - exp) <= tol;
    console.log(`${ok ? '✓' : '✗'} ${name}: got ${got.toFixed(4)}, expected ${exp.toFixed(4)}`);
    return ok;
  };

  // Test 1: Non-Lab Midterm
  const t1 = computeTheory([{obt:'5',total:'5'}],[{obt:'5',total:'5'}],17,25,null,null);
  pass('T1 quiz',   t1.quizContrib,   15);
  pass('T1 assign', t1.assignContrib, 10);
  pass('T1 mid',    t1.midContrib,    17);
  pass('T1 total',  t1.total,         42);
  pass('T1 pct',    t1.total/50*100,  84);

  // Test 2: Non-Lab Final
  const t2 = computeTheory([{obt:'5',total:'5'}],[{obt:'5',total:'5'}],17,25,43,50);
  pass('T2 total',  t2.total,         85);

  // Test 3: Decimal
  const t3 = computeTheory([{obt:'4.5',total:'5'}],[{obt:'8.5',total:'10'}],17.5,25,null,null);
  pass('T3 quiz',   t3.quizContrib,   13.5);
  pass('T3 assign', t3.assignContrib, 8.5);
  pass('T3 mid',    t3.midContrib,    17.5);
  pass('T3 total',  t3.total,         39.5);
  pass('T3 pct',    t3.total/50*100,  79);

  // Test 4: Lab Midterm
  const t4th = computeTheory(
    [{obt:'13.4',total:'15'},{obt:'0',total:'33'}],
    [{obt:'45',total:'50'},{obt:'114',total:'120'}],
    13, 24, null, null
  );
  pass('T4 tQuiz',   t4th.quizContrib,   4.1875,   0.001);
  pass('T4 tAssign', t4th.assignContrib, 9.35294,  0.001);
  pass('T4 tMid',    t4th.midContrib,    13.54167, 0.001);
  pass('T4 tTotal',  t4th.total,         27.08208, 0.001);

  const t4lab = poolRows([
    {obt:'18',total:'20'},{obt:'17',total:'20'},{obt:'20',total:'25'}
  ]);
  pass('T4 labPct',  t4lab.pct,            84.6154, 0.001);
  const labEarned = t4lab.pct / 100 * 33;
  pass('T4 labEarned', labEarned,          27.9231, 0.001);

  const theoryEarned = t4th.total / 100 * 67;
  const actual = theoryEarned + labEarned;
  const normalized = actual / 66.5 * 50;
  pass('T4 normalized', normalized, 34.62, 0.05);

  console.log('Tests complete.');
}

// ── View Navigation ──────────────────────────────────────
function navigateTo(viewId, extraFn) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById(viewId).style.display = 'block';
  // Nav links: match exact view or the target-marks alias
  document.querySelectorAll('.nav-link').forEach(l => {
    const dv = l.dataset.view;
    l.classList.toggle('active', dv === viewId || (dv === 'view-nonlab-target' && viewId === 'view-nonlab' && state.nlMode === 'target'));
  });
  const titles = {
    'view-overview': 'Overview',
    'view-nonlab':   'Non-Lab Calculator',
    'view-lab':      'Lab Calculator',
    'view-history':  'History',
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[viewId] || 'GradePilot';
  if (extraFn) extraFn();
  if (viewId === 'view-history') renderHistory();
  closeSidebar();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('sidebar-open');
  ov.classList.toggle('show', sb.classList.contains('sidebar-open'));
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('sidebar-open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ── History ──────────────────────────────────────────────
function saveToHistory(entry) {
  const list = JSON.parse(localStorage.getItem('gp-history') || '[]');
  list.unshift({
    id: Date.now(),
    subject: (document.getElementById('subjectName')?.value.trim()) || 'Unnamed Subject',
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (list.length > 50) list.length = 50;
  localStorage.setItem('gp-history', JSON.stringify(list));
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;
  const list = JSON.parse(localStorage.getItem('gp-history') || '[]');
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎓</div>
        <div class="empty-state-title">No calculations yet</div>
        <div class="empty-state-desc">Complete a calculation to see it here.</div>
      </div>`;
    return;
  }
  container.innerHTML = list.map(e => `
    <div class="history-entry">
      <div class="history-entry-left">
        <div class="history-grade ${e.grade.cls}">${e.grade.letter}</div>
        <div>
          <div class="history-subject">${escHtml(e.subject)}</div>
          <div class="history-meta">${e.type === 'lab' ? 'Lab Subject' : 'Non-Lab'} &middot; ${histMode(e.mode)} &middot; ${e.marks}</div>
        </div>
      </div>
      <div class="history-entry-right">
        <div class="history-pct ${e.grade.cls}">${fmt(e.pct)}%</div>
        <div class="history-time">${histTime(e.timestamp)}</div>
      </div>
    </div>`).join('');
}

function clearHistory() {
  if (!confirm('Clear all calculation history?')) return;
  localStorage.removeItem('gp-history');
  renderHistory();
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function histMode(m) {
  return m === 'mid' ? 'Midterm' : m === 'final' ? 'Final' : 'Target';
}

function histTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
