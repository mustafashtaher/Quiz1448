async function loadAudience() {
  const day = Utils.query.get('day') || '';
  const group = Utils.query.get('group') || 'ALL';
  try {
    const raw = await API.audience({ day, group });
    const data = raw && raw.data ? raw.data : raw;
    Utils.$('#audience-title').textContent = data.workshopName || APP_CONFIG.WORKSHOP_NAME;
    Utils.$('#audience-day').textContent = `Day ${data.currentDay || data.day || day || '—'}`;
    Utils.$('#audience-group').textContent = data.groupName || data.group || group || 'All Groups';
    Utils.$('#audience-status').textContent = data.enabled === false ? 'Audience view is disabled' : (data.quizOpen ? 'Quiz is open' : 'Welcome');
    Utils.$('#audience-announcement').textContent = data.announcement || 'May your learning be beneficial.';
    const questions = data.questions || data.selectedQuestions || [];
    Utils.$('#audience-questions').innerHTML = questions.map(q => `<article class="audience-question"><span class="badge">${Utils.escape(q.Status || 'SELECTED')}</span><h2>${Utils.escape(q.Question || '')}</h2>${q.PresenterAnswer ? `<p class="answer"><strong>Answer:</strong> ${Utils.escape(q.PresenterAnswer)}</p>` : ''}</article>`).join('');
    if (data.leaderboardEnabled && Array.isArray(data.leaderboard)) {
      Utils.show(Utils.$('#leaderboard'));
      Utils.$('#leaderboard-list').innerHTML = data.leaderboard.map((x, i) => `<div class="leaderboard-row"><b>#${i + 1}</b><span>${Utils.escape(x.name || x.Name || '')}</span><strong>${Utils.escape(x.score || x.Score || 0)}</strong></div>`).join('');
    }
  } catch (error) {
    Utils.$('#audience-status').textContent = 'Connection issue';
    Utils.$('#audience-announcement').textContent = error.message || 'Unable to load the audience view right now.';
  }
}

function updateAudienceClock() { const clock = Utils.$('#audience-clock'); if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
setInterval(updateAudienceClock, 1000);
document.addEventListener('DOMContentLoaded', () => { updateAudienceClock(); loadAudience(); });
