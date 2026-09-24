/* All backend communication is centralized here. The Apps Script endpoint accepts {action,payload,token}. */
const API = (() => {
  async function call(action, payload = {}, token = sessionStorage.getItem(APP_CONFIG.SESSION_KEY)) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT);
    try {
      const response = await fetch(APP_CONFIG.API_URL, { method: 'POST', headers: {'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action, payload, token}), signal: controller.signal });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || 'The server could not complete this request.');
      return data.data !== undefined ? data.data : data;
    } catch (error) { if (error.name === 'AbortError') throw new Error('The request timed out. Please try again.'); throw error; } finally { clearTimeout(timer); }
  }
  return {
    findParticipant: id => call('findParticipant', {muminId:id}),
    getQuiz: (id, group, day) => call('getQuiz', {muminId:id, group, day}),
    submitQuiz: payload => call('submitQuiz', payload),
    uploadImage: payload => call('uploadImage', payload),
    submitAudienceQuestion: payload => call('submitAudienceQuestion', payload),
    login: (email, code) => call('presenterLogin', {email, code}, null),
    dashboard: (filters, token) => call('getDashboard', filters, token),
    saveQuestion: (question, token) => call('saveQuestion', question, token),
    deleteQuestion: (id, token) => call('deleteQuestion', {questionId:id}, token),
    setQuestionActive: (id, active, token) => call('setQuestionActive', {questionId:id, active}, token),
    updateAudienceQuestion: (payload, token) => call('updateAudienceQuestion', payload, token),
    saveSettings: (settings, token) => call('saveSettings', {settings}, token),
    audience: filters => call('getAudienceView', filters, null)
  };
})();
