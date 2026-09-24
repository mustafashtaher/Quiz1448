/* All backend communication is centralized here. The Apps Script endpoint expects the Gas method names and the payload shape used by the deployed backend. */
const API = (() => {
  async function call(action, payload = {}, token = sessionStorage.getItem(APP_CONFIG.SESSION_KEY)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload, token }),
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || 'The server could not complete this request.');
      }

      // Support both wrapped responses and unwrapped responses.
      if (data && data.data !== undefined) {
        return data.data;
      }

      return data;
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
      return call('lookupParticipant', {
        Mumin_ID: muminId,
        muminId: muminId
      });
    },

    getQuiz: (id, group, day) => {
      const muminId = String(id || '').trim();
      return call('getQuiz', {
        Mumin_ID: muminId,
        muminId: muminId,
        Group_Name: group,
        groupName: group,
        group: group,
        day: day
      });
    },

    submitQuiz: (payload) => {
      const normalized = payload || {};
      return call('submitQuiz', {
        Mumin_ID: normalized.muminId || normalized.Mumin_ID,
        muminId: normalized.muminId || normalized.Mumin_ID,
        Group_Name: normalized.group || normalized.Group_Name,
        groupName: normalized.group || normalized.Group_Name,
        group: normalized.group || normalized.Group_Name,
        day: normalized.day,
        startedAt: normalized.startedAt,
        submittedAt: normalized.submittedAt,
        answers: normalized.answers || []
      });
    },

    uploadImage: (payload) => call('uploadImage', payload),

    submitAudienceQuestion: (payload) => {
      const normalized = payload || {};
      return call('submitAudienceQuestion', {
        Mumin_ID: normalized.muminId || normalized.Mumin_ID,
        muminId: normalized.muminId || normalized.Mumin_ID,
        Name: normalized.name || normalized.Name,
        name: normalized.name || normalized.Name,
        Group_Name: normalized.group || normalized.Group_Name,
        groupName: normalized.group || normalized.Group_Name,
        group: normalized.group || normalized.Group_Name,
        QuestionType: normalized.questionType || normalized.QuestionType,
        questionType: normalized.questionType || normalized.QuestionType,
        Question: normalized.question || normalized.Question,
        question: normalized.question || normalized.Question,
        File_ID: normalized.fileId || normalized.File_ID,
        fileId: normalized.fileId || normalized.File_ID,
        image: normalized.image || null,
        day: normalized.day,
        type: normalized.type || normalized.questionType || normalized.QuestionType
      });
    },

    login: (email, code) => call('presenterLogin', { email, code }, null),

    dashboard: (filters, token) => call('getDashboard', {
      day: filters && (filters.day || filters.Day),
      group: filters && (filters.group || filters.groupName || filters.Group_Name),
      Group_Name: filters && (filters.Group_Name || filters.group || filters.groupName),
      groupName: filters && (filters.groupName || filters.group || filters.Group_Name),
      Mumin_ID: filters && filters.Mumin_ID,
      muminId: filters && filters.muminId
    }, token),

    saveQuestion: (question, token) => call('saveQuestion', question, token),

    deleteQuestion: (questionId, token) => call('deleteQuestion', { rowNumber: questionId }, token),

    setQuestionActive: (id, active, token) => call('updateQuestionActive', {
      rowNumber: id,
      active: active
    }, token),

    updateAudienceQuestion: (payload, token) => call('updateAudienceQuestion', payload, token),

    saveSettings: (settings, token) => call('updateSettings', { settings }, token),

    audience: (filters) => call('getAudienceView', {
      day: filters && (filters.day || filters.Day),
      group: filters && (filters.group || filters.groupName || filters.Group_Name),
      Group_Name: filters && (filters.Group_Name || filters.group || filters.groupName),
      groupName: filters && (filters.groupName || filters.group || filters.Group_Name)
    }, null)
  };
})();
