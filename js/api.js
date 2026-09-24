const API = (() => {
  async function call(action, payload = {}, token = null) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT);

    try {
      const request = Object.assign({}, payload || {}, { action, token: token || null });
      const response = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      // Read text first so an empty or non-JSON Apps Script response does not
      // produce the unhelpful "Unexpected end of JSON input" error.
      const responseText = await response.text();
      let data;

      if (!responseText.trim()) {
        throw new Error(`The Apps Script returned an empty response for action: ${action}. Check the Apps Script execution log and deployment.`);
      }

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`The Apps Script returned a non-JSON response for ${action}: ${responseText.slice(0, 180)}`);
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || `The server could not complete action: ${action}.`);
      }

      const result = data && data.data !== undefined ? data.data : data;
      if (result && result.success === false) {
        throw new Error(result.message || result.error || `The server rejected action: ${action}.`);
      }

      return result;
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new Error('The request timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    findParticipant: (id) => {
      const muminId = String(id || '').trim();
      return call('lookupParticipant', { Mumin_ID: muminId, muminId });
    },
    getQuiz: (id, group, day) => {
      const muminId = String(id || '').trim();
      return call('getQuiz', { Mumin_ID: muminId, muminId, Group_Name: group || '', groupName: group || '', group: group || '', day: day || '' });
    },
    submitQuiz: (payload) => {
      const value = payload || {};
      return call('submitQuiz', { Mumin_ID: value.Mumin_ID || value.muminId || '', muminId: value.muminId || value.Mumin_ID || '', Group_Name: value.Group_Name || value.group || '', groupName: value.groupName || value.group || value.Group_Name || '', group: value.group || value.Group_Name || '', day: value.day || '', startedAt: value.startedAt || '', submittedAt: value.submittedAt || '', answers: Array.isArray(value.answers) ? value.answers : [] });
    },
    uploadImage: (payload) => call('uploadImage', payload),
    submitAudienceQuestion: (payload) => {
      const value = payload || {};
      return call('submitAudienceQuestion', { Mumin_ID: value.Mumin_ID || value.muminId || '', muminId: value.muminId || value.Mumin_ID || '', Name: value.Name || value.name || '', name: value.name || value.Name || '', Group_Name: value.Group_Name || value.group || '', groupName: value.groupName || value.group || value.Group_Name || '', group: value.group || value.Group_Name || '', QuestionType: value.QuestionType || value.questionType || 'text', questionType: value.questionType || value.QuestionType || 'text', Question: value.Question || value.question || '', question: value.question || value.Question || '', File_ID: value.File_ID || value.fileId || '', fileId: value.fileId || value.File_ID || '', image: value.image || null, day: value.day || '' });
    },
    login: (email, code) => call('presenterLogin', { email, code }, null),
    dashboard: (filters, token) => {
      const value = filters || {};
      return call('getDashboard', { day: value.day || value.Day || '', group: value.group || value.groupName || value.Group_Name || 'ALL', groupName: value.groupName || value.group || value.Group_Name || 'ALL', Group_Name: value.Group_Name || value.group || value.groupName || 'ALL' }, token);
    },
    saveQuestion: (question, token) => call('saveQuestion', question, token),
    deleteQuestion: (rowNumber, token) => call('deleteQuestion', { rowNumber }, token),
    setQuestionActive: (rowNumber, active, token) => call('saveQuestion', { rowNumber, Active: active }, token),
    updateAudienceQuestion: (payload, token) => call('updateAudienceQuestion', payload, token),
    saveSettings: (settings, token) => call('updateSettings', { settings }, token),
    audience: (filters) => {
      const value = filters || {};
      return call('getAudienceView', { day: value.day || value.Day || '', group: value.group || value.groupName || value.Group_Name || 'ALL', groupName: value.groupName || value.group || value.Group_Name || 'ALL', Group_Name: value.Group_Name || value.group || value.groupName || 'ALL' });
    }
  };
})();
