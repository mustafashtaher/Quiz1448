let currentParticipant = null;
const participantState = { quiz: null, answers: {}, index: 0 };

function renderProfile(p) {
  const fields = [['Gender','Gender'],['Age','Age'],['Jamaat','Jamaat'],['Jamiaat','Jamiaat'],['Category','Category'],['Idara','Idara'],['Hifz_Sanad','Hifz / Sanad'],['Occupation','Occupation']].filter(([key]) => String(p[key] ?? '').trim() !== '');
  Utils.$('#profile').innerHTML = `<div class="profile-grid">${fields.map(([key,label]) => `<div><small>${label}</small><strong>${Utils.escape(p[key])}</strong></div>`).join('')}</div>`;
  if (!fields.length) Utils.$('#profile').innerHTML = '<p class="empty">No additional profile details available.</p>';
  Utils.show(Utils.$('#profile')); Utils.show(Utils.$('#actions'));
}

async function searchParticipant(event) {
  event.preventDefault();
  const button = event.submitter || Utils.$('#participant-form button[type="submit"]');
  const message = Utils.$('#participant-message');
  const id = String(Utils.$('#mumin-id').value || '').trim();
  if (!id) { Utils.setMessage(message, 'Please enter your Mumin ID / ITS.', 'error'); return; }
  Utils.busy(button, true, 'Searching…'); Utils.setMessage(message, 'Searching…', 'info');
  try {
    const result = await API.findParticipant(id);
    const participant = result && result.participant ? result.participant : result;
    if (!participant || result.found === false) throw new Error('Participant not found. Please check your Mumin ID.');
    currentParticipant = participant;
    participantState.answers = {};
    renderProfile(participant);
    const footerName = Utils.$('#participant-footer-name');
    if (footerName) footerName.textContent = participant.FullName || 'Participant';
    const nameInput = Utils.$('#search-name');
    if (nameInput && participant.FullName) nameInput.value = participant.FullName;
    Utils.setMessage(message, '', 'info');
  } catch (error) { Utils.setMessage(message, error.message || 'Participant lookup failed.', 'error'); Utils.hide(Utils.$('#profile')); Utils.hide(Utils.$('#actions')); }
  finally { Utils.busy(button, false); }
}

async function openQuiz() {
  const root = Utils.$('#quiz-root'); Utils.show(Utils.$('#quiz-section')); Utils.hide(Utils.$('#question-section')); root.innerHTML = '<div class="message info">Loading quiz…</div>';
  try {
    const data = await API.getQuiz(currentParticipant.Mumin_ID, currentParticipant.Group_Name, null); participantState.quiz = data && data.data ? data.data : data;
    if (participantState.quiz.alreadyAttempted) throw new Error('You have already completed today\'s quiz.');
    if (participantState.quiz.quizOpen === false) throw new Error(participantState.quiz.message || 'Quiz is currently closed.');
    if (!participantState.quiz.questions || !participantState.quiz.questions.length) throw new Error('There are no active questions for you today.');
    participantState.answers = {}; participantState.index = 0; renderQuiz(root);
  } catch (error) { root.innerHTML = `<div class="message error">${Utils.escape(error.message)}</div>`; }
}

function renderQuiz(root) {
  const q = participantState.quiz.questions[participantState.index]; const n = participantState.quiz.questions.length; const saved = participantState.answers[q.QuestionID] || ''; const type = String(q.Type || '').toLowerCase();
  let answer = '';
  if (type === 'choice' || type === 'picture_choice') answer = `<div class="options">${['OptionA','OptionB','OptionC','OptionD'].map(k => q[k] ? `<label class="option"><input type="radio" name="answer" value="${Utils.escape(q[k])}" ${saved === q[k] ? 'checked' : ''}><span>${Utils.escape(q[k])}</span></label>` : '').join('')}</div>`;
  else if (type === 'word') answer = `<input id="answer" value="${Utils.escape(saved)}" placeholder="Type your answer…">`;
  else answer = `<textarea id="answer" rows="6" placeholder="Write your answer…">${Utils.escape(saved)}</textarea>`;
  const image = q.ImageURL || (q.File_ID ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(q.File_ID)}&sz=w1600` : '');
  root.innerHTML = `<div class="quiz-head"><div><p class="eyebrow">Question ${participantState.index + 1} of ${n}</p><h2>Today’s quiz</h2></div><div class="progress"><span style="width:${((participantState.index + 1) / n) * 100}%"></span></div></div><div class="question"><h3>${Utils.escape(q.Question || '')}</h3>${image ? `<img class="question-image" src="${Utils.escape(image)}" alt="Question image">` : ''}${answer}</div><div class="quiz-nav">${participantState.index ? '<button class="btn ghost" id="prev" type="button">Previous</button>' : '<span></span>'}${participantState.index === n - 1 ? '<button class="btn primary" id="submit-quiz" type="button">Submit quiz</button>' : '<button class="btn primary" id="next" type="button">Next</button>'}</div>`;
  Utils.$('#answer')?.addEventListener('input', e => participantState.answers[q.QuestionID] = e.target.value); Utils.$$('[name="answer"]').forEach(r => r.addEventListener('change', e => participantState.answers[q.QuestionID] = e.target.value)); Utils.$('#prev')?.addEventListener('click', () => { participantState.index--; renderQuiz(root); }); Utils.$('#next')?.addEventListener('click', () => { participantState.index++; renderQuiz(root); }); Utils.$('#submit-quiz')?.addEventListener('click', submitQuiz);
}

async function submitQuiz(event) { const button = event.currentTarget; Utils.busy(button, true, 'Submitting…'); try { const answers = Object.keys(participantState.answers).map(id => ({QuestionID:id, Answer:participantState.answers[id]})); const result = await API.submitQuiz({muminId:currentParticipant.Mumin_ID, group:currentParticipant.Group_Name, day:participantState.quiz.day, answers}); const r = result.result || result; Utils.$('#quiz-root').innerHTML = `<div class="result"><div class="success-icon">✓</div><h2>Quiz Completed</h2><div class="result-grid"><div><small>Score</small><strong>${Utils.escape(r.Score ?? r.score ?? 0)}</strong></div><div><small>Total points</small><strong>${Utils.escape(r.TotalPoints ?? r.totalPoints ?? 0)}</strong></div><div><small>Percentage</small><strong>${Utils.escape(r.Percentage ?? r.percentage ?? 0)}%</strong></div><div><small>Status</small><strong>Completed</strong></div></div></div>`; } catch (error) { Utils.setMessage(Utils.$('#participant-message'), error.message, 'error'); } finally { Utils.busy(button, false); } }

async function submitQuestion(event) { event.preventDefault(); const button = event.submitter; const message = Utils.$('#question-message'); Utils.busy(button, true, 'Submitting…'); try { const file = Utils.$('#question-image')?.files?.[0] || null; let image = null; if (file) { const dataUrl = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); image = {name:file.name, mimeType:file.type, base64:String(dataUrl).split(',')[1] || dataUrl}; } await API.submitAudienceQuestion({muminId:currentParticipant.Mumin_ID, name:currentParticipant.FullName || '', group:currentParticipant.Group_Name, questionType:Utils.$('#question-type').value.toLowerCase(), question:Utils.$('#question-text').value.trim(), image}); Utils.setMessage(message, 'Your question has been submitted successfully.', 'success'); event.target.reset(); Utils.hide(Utils.$('#question-image-wrap')); } catch (error) { Utils.setMessage(message, error.message, 'error'); } finally { Utils.busy(button, false); } }

document.addEventListener('DOMContentLoaded', () => { Utils.$('#participant-form')?.addEventListener('submit', searchParticipant); Utils.$('#start-quiz')?.addEventListener('click', openQuiz); Utils.$('#ask-question')?.addEventListener('click', () => { Utils.show(Utils.$('#question-section')); Utils.$('#question-section').scrollIntoView({behavior:'smooth'}); }); Utils.$('#cancel-question')?.addEventListener('click', () => Utils.hide(Utils.$('#question-section'))); Utils.$('#audience-form')?.addEventListener('submit', submitQuestion); Utils.$('#question-type')?.addEventListener('change', e => e.target.value === 'Picture' ? Utils.show(Utils.$('#question-image-wrap')) : Utils.hide(Utils.$('#question-image-wrap'))); });
