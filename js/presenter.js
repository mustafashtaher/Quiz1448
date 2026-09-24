let presenterToken = null;
let dashboardData = {};

function token() { return presenterToken || sessionStorage.getItem(APP_CONFIG.SESSION_KEY); }
function table(rows, cols) { if (!rows || !rows.length) return '<p class="empty">No records found.</p>'; return `<table><thead><tr>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${Utils.escape(r[c[0]] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }

async function loadDashboard() {
  Utils.setMessage(Utils.$('#dashboard-message'), 'Loading dashboard…', 'info');
  try {
    const d = await API.dashboard({ day: Utils.$('#day-select').value, group: Utils.$('#group-select').value }, token());
    dashboardData = d || {};
    renderDashboard(dashboardData);
    Utils.setMessage(Utils.$('#dashboard-message'), '', 'info');
  } catch (error) {
    if (/session|auth|login|token/i.test(error.message || '')) logout();
    else Utils.setMessage(Utils.$('#dashboard-message'), error.message || 'Dashboard failed to load.', 'error');
  }
}

function renderDashboard(d) {
  const stats = d.stats || {};
  Utils.$('#stats').innerHTML = [['participants','Participants'],['started','Quiz Started'],['completed','Completed'],['averageScore','Average Score'],['questionsSubmitted','Questions Submitted']].map(([k,l]) => `<div class="stat"><small>${l}</small><strong>${Utils.escape(stats[k] ?? stats.registeredParticipants ?? 0)}</strong></div>`).join('');
  Utils.$('#daily-stats').innerHTML = table(d.dailyStats || [], [['Day','Day'],['Group_Name','Group'],['Participants','Participants'],['Quiz Started','Started'],['Completed','Completed'],['Average Score','Average Score']]);
  Utils.$('#questions-table').innerHTML = table(d.questions || [], [['QuestionID','ID'],['Day','Day'],['Group_Name','Group'],['Question','Question'],['Type','Type'],['Active','Active']]);
  Utils.$('#participants-table').innerHTML = table(d.participants || [], [['Group_Name','Group'],['Mumin_ID','Mumin ID'],['FullName','Name'],['Gender','Gender'],['Age','Age'],['Jamaat','Jamaat'],['Jamiaat','Jamiaat'],['Category','Category'],['Idara','Idara'],['Hifz_Sanad','Hifz/Sanad'],['Occupation','Occupation']]);
  Utils.$('#results-table').innerHTML = table(d.results || [], [['Timestamp','Time'],['Day','Day'],['Group_Name','Group'],['Mumin_ID','Mumin ID'],['Name','Name'],['Score','Score'],['TotalPoints','Total'],['Percentage','%'],['Completed','Completed'],['TimeTaken','Time'],['AttemptID','Attempt']]);
  Utils.$('#answers-table').innerHTML = table(d.answers || [], [['Timestamp','Time'],['Day','Day'],['Group_Name','Group'],['Mumin_ID','Mumin ID'],['QuestionID','Question'],['Answer','Answer'],['Correct','Correct'],['Points','Points'],['AttemptID','Attempt']]);
  Utils.$('#audience-table').innerHTML = table(d.audienceQuestions || [], [['Name','Name'],['Mumin_ID','Mumin ID'],['Group_Name','Group'],['QuestionType','Type'],['Question','Question'],['Status','Status'],['Timestamp','Submitted']]);
  const settings = d.settings || {};
  Utils.$('#settings-form').innerHTML = Object.entries(settings).filter(([k]) => !['PresenterLoginEmail','PresenterLoginCode'].includes(k)).map(([k,v]) => `<label>${Utils.escape(k)}<input data-setting="${Utils.escape(k)}" value="${Utils.escape(v)}"></label>`).join('');
}

async function login(event) {
  event.preventDefault();
  const button = event.submitter || Utils.$('#login-form button[type="submit"]');
  const email = String(Utils.$('#login-email').value || '').trim();
  const code = String(Utils.$('#login-code').value || '').trim();
  if (!email || !code) { Utils.setMessage(Utils.$('#login-message'), 'Email and login code are required.', 'error'); return; }
  Utils.busy(button, true, 'Signing in…');
  try {
    const result = await API.login(email, code);
    presenterToken = result.token || result.sessionToken;
    if (!presenterToken) throw new Error('Login response did not include a session token.');
    sessionStorage.setItem(APP_CONFIG.SESSION_KEY, presenterToken);
    Utils.hide(Utils.$('#login-view')); Utils.show(Utils.$('#dashboard-view'));
    await loadDashboard();
  } catch (error) {
    Utils.setMessage(Utils.$('#login-message'), error.message || 'Presenter login failed.', 'error');
  } finally { Utils.busy(button, false); }
}

function logout() { sessionStorage.removeItem(APP_CONFIG.SESSION_KEY); presenterToken = null; Utils.hide(Utils.$('#dashboard-view')); Utils.show(Utils.$('#login-view')); }

function init() {
  Utils.$('#login-form')?.addEventListener('submit', login);
  Utils.$('#logout')?.addEventListener('click', logout);
  Utils.$('#day-select')?.addEventListener('change', loadDashboard);
  Utils.$('#group-select')?.addEventListener('change', loadDashboard);
  Utils.$('#audience-open')?.addEventListener('click', () => window.open(`audience.html?day=${encodeURIComponent(Utils.$('#day-select').value)}&group=${encodeURIComponent(Utils.$('#group-select').value)}`, '_blank'));
  Utils.$$('[data-tab]').forEach(button => button.addEventListener('click', () => { Utils.$$('[data-tab]').forEach(x => x.classList.toggle('active', x === button)); Utils.$$('.tab-panel').forEach(x => x.classList.toggle('active', x.id === `tab-${button.dataset.tab}`)); }));
  const saved = sessionStorage.getItem(APP_CONFIG.SESSION_KEY);
  if (saved) { presenterToken = saved; Utils.hide(Utils.$('#login-view')); Utils.show(Utils.$('#dashboard-view')); loadDashboard(); }
}

document.addEventListener('DOMContentLoaded', init);
