/* RateCalcPH — freelancer rate calculator. Vanilla JS, no deps, no server. */
'use strict';
const PRO_CODES = ['RCP-PRO-99-EEE8-B24F', 'RCP-PRO-99-DEMO-20DE-AC3F'];
const FREE_SVC = 2;
const LS = { pro: 'rcp_pro', draft: 'rcp_draft', svc: 'rcp_svc' };

let pro = localStorage.getItem(LS.pro) === '1';
let services = []; // {name, hours}

const $ = (id) => document.getElementById(id);
const peso = (n) => '₱' + Math.round(n).toLocaleString('en-PH');
const peso2 = (n) => '₱' + (Math.round(n * 100) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (id) => Number($(id).value) || 0;

/* ============ engine ============ */
function calc() {
  const net = num('netIncome'), exp = num('expenses');
  const taxPct = Number($('taxPct').value) || 0;
  const hoursWeek = Math.max(1, num('hoursWeek'));
  const billablePct = Number($('billablePct').value) || 60;
  const bufferPct = Number($('bufferPct').value) || 0;

  const workingMonths = 12 * (1 - bufferPct / 100);     // effective working months/year
  const netAnnual = net * 12;
  const expAnnual = exp * 12;
  // buffer → gross must be earned in fewer months
  const grossAnnual = (netAnnual + expAnnual) / (1 - taxPct / 100) / Math.max(0.01, workingMonths / 12);
  const grossMonthly = grossAnnual / 12;

  const hoursMonth = hoursWeek * 4.33;
  const billableHours = hoursMonth * (billablePct / 100);
  const hourly = billableHours > 0 ? grossMonthly / billableHours : NaN;
  return {
    net, exp, taxPct, hoursWeek, billablePct, bufferPct, workingMonths,
    grossMonthly, hoursMonth, billableHours, hourly,
    day: hourly * 8, week: hourly * hoursWeek, month: grossMonthly, project: hourly * 8 * 5
  };
}

function render() {
  const c = calc();
  $('oHourly').textContent = Number.isFinite(c.hourly) ? peso2(c.hourly) + '/hr' : '—';
  $('oDay').textContent = Number.isFinite(c.day) ? peso(c.day) : '—';
  $('oWeek').textContent = Number.isFinite(c.week) ? peso(c.week) : '—';
  $('oMonth').textContent = Number.isFinite(c.month) ? peso(c.month) : '—';
  $('oProject').textContent = Number.isFinite(c.project) ? peso(c.project) : '—';
  $('hoursEcho').textContent = `${c.hoursWeek}h/linggo × 4.33 = ${Math.round(c.hoursMonth)}h/buwan · billable ${c.billablePct}% = ${Math.round(c.billableHours)}h/buwan` +
    (c.workingMonths < 12 ? ` · ${c.workingMonths.toFixed(1)} working buwan/taon` : '');
  $('oHourlyNote').textContent = `${peso(Math.round(c.grossMonthly))} gross/buwan ÷ ${Math.round(c.billableHours)} billable hours`;
  $('oExplain').innerHTML =
    `Para may <b>${peso(c.net)}</b> kang dala sa bulsan kada buwan: kailangan mong kitain ang <b>${peso(Math.round(c.grossMonthly))}/buwan gross</b> ` +
    `(kasama ang ${peso(c.exp)} expenses${c.taxPct ? ` at ${c.taxPct}% tax` : ''}${c.workingMonths < 12 ? `, sakop ang ${(12 - c.workingMonths).toFixed(1)} dead buwan` : ''}). ` +
    `Sa ${Math.round(c.billableHours)} billable hours kada buwan, ang minimum mong <b>hourly rate = ${Number.isFinite(c.hourly) ? peso2(c.hourly) : '—'}</b>.`;

  renderSvc();
  saveDraft();
}

/* ============ service menu (PRO) ============ */
function renderSvc() {
  const wrap = $('svcRows');
  wrap.innerHTML = '';
  const c = calc();
  services.forEach((s, i) => {
    const price = Number.isFinite(c.hourly) ? s.hours * c.hourly : 0;
    const row = document.createElement('div');
    row.className = 'svc-row';
    row.innerHTML =
      `<input value="${String(s.name ?? '').replace(/"/g,'&quot;')}" data-i="${i}" data-f="name" placeholder="e.g. Landing page (WordPress)">` +
      `<input type="number" min="0" step="any" value="${s.hours ?? ''}" data-i="${i}" data-f="hours" placeholder="oras">` +
      `<div class="svc-price" id="svcPrice-${i}">${peso(price)}</div>` +
      `<button class="row-x" data-i="${i}">✕</button>`;
    wrap.appendChild(row);
  });
  $('svcCap').textContent = pro
    ? `${services.length} services · prices update with your rate`
    : `Free tier: ${services.length}/${FREE_SVC} services — PRO unlocks unlimited + CSV.`;
}
function svcCsv() {
  const c = calc();
  const rows = [['Service', 'Estimated hours', 'Suggested price (₱)']]
    .concat(services.map(s => [s.name, s.hours ?? '', Number.isFinite(c.hourly) ? (s.hours * c.hourly).toFixed(2) : '']));
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'ratecalcph-price-list.csv'; a.click();
}

/* ============ persistence ============ */
function saveDraft() {
  try {
    localStorage.setItem(LS.draft, JSON.stringify({
      f: ['netIncome','expenses','hoursWeek'].map(id => $(id).value),
      t: $('taxPct').value, b: $('billablePct').value, d: $('bufferPct').value
    }));
    localStorage.setItem(LS.svc, JSON.stringify(services));
  } catch (e) {}
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(LS.draft) || 'null');
    if (d) {
      ['netIncome','expenses','hoursWeek'].forEach((id, i) => $(id).value = d.f[i] ?? $(id).value);
      $('taxPct').value = d.t ?? '8'; $('billablePct').value = d.b ?? '60'; $('bufferPct').value = d.d ?? '10';
    }
    const s = JSON.parse(localStorage.getItem(LS.svc) || 'null');
    if (Array.isArray(s)) services = s;
  } catch (e) {}
}

/* ============ PRO ============ */
function applyPro() {
  $('proBadge').classList.toggle('hidden', !pro);
  $('svcCsv').classList.toggle('hidden', !pro);
}

document.addEventListener('DOMContentLoaded', () => {
  loadDraft(); applyPro(); render();

  ['netIncome','expenses','hoursWeek','taxPct','billablePct','bufferPct'].forEach(id => $(id).addEventListener('input', render));

  $('svcRows').addEventListener('input', e => {
    const t = e.target, i = +t.dataset.i, f = t.dataset.f;
    if (f === undefined || Number.isNaN(i)) return;
    if (f === 'hours') services[i].hours = Number(t.value) || 0; else services[i].name = t.value;
    const c = calc();
    if (Number.isFinite(c.hourly)) $('svcPrice-' + i).textContent = peso(services[i].hours * c.hourly);
    saveDraft();
  });
  $('svcRows').addEventListener('click', e => {
    if (e.target.classList.contains('row-x')) { services.splice(+e.target.dataset.i, 1); renderSvc(); saveDraft(); }
  });
  $('addSvc').addEventListener('click', () => {
    if (!pro && services.length >= FREE_SVC) { openPay(); return; }
    services.push({ name: '', hours: 8 });
    renderSvc(); saveDraft();
  });
  $('svcCsv').addEventListener('click', svcCsv);

  const openPay = () => { $('payModal').classList.remove('hidden'); $('codeMsg').textContent = ''; };
  $('proBtn').addEventListener('click', openPay);
  $('proBtn2').addEventListener('click', openPay);
  $('payClose').addEventListener('click', () => $('payModal').classList.add('hidden'));
  $('codeBtn').addEventListener('click', () => {
    const code = $('codeInput').value.trim().toUpperCase();
    if (PRO_CODES.map(c => c.toUpperCase()).includes(code)) {
      pro = true; localStorage.setItem(LS.pro, '1'); applyPro(); renderSvc();
      $('codeMsg').textContent = '✓ PRO unlocked — unlimited services + CSV export.';
      $('codeMsg').className = 'code-msg ok';
      setTimeout(() => $('payModal').classList.add('hidden'), 1500);
    } else {
      $('codeMsg').textContent = 'Mali ang code — check ang GCash confirmation.';
      $('codeMsg').className = 'code-msg bad';
    }
  });
  $('codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeBtn').click(); });
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));
});
