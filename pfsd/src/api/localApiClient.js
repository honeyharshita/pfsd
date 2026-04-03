// @ts-nocheck
/**
 * Local Backend API Client v2
 * Enhanced with retry logic, error handling, and improved chat features
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
const API_BASE_URL = `${BASE_URL}/api`;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms

// Helper function for API calls with retry logic
async function apiCall(endpoint, method = 'GET', data = null, retryCount = 0) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      if (response.status === 503 && retryCount < MAX_RETRIES) {
        // Service unavailable, retry after delay
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return apiCall(endpoint, method, data, retryCount + 1);
      }
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    const json = await response.json();
    return json;
  } catch (error) {
    console.error('API call failed:', error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return apiCall(endpoint, method, data, retryCount + 1);
    }
    
    throw error;
  }
}

export const localApi = {
  auth: {
    me: async () => ({
      id: 'local-user',
      email: 'anonymous@local.dev',
      full_name: 'Local User',
    }),
    logout: async () => true,
    redirectToLogin: async (fromUrl) => {
      if (fromUrl && typeof window !== 'undefined') {
        window.location.href = fromUrl;
      }
      return true;
    },
  },

  entities: {
    list: async (entity, sort = '', limit = 1000) => {
      return apiCall(`/entities/${encodeURIComponent(entity)}?sort=${encodeURIComponent(sort)}&limit=${encodeURIComponent(limit)}`);
    },
    create: async (entity, data = {}) => {
      return apiCall(`/entities/${encodeURIComponent(entity)}`, 'POST', data);
    },
    update: async (entity, id, data = {}) => {
      const cleanId = String(id || '').includes(':') ? String(id).split(':')[1] : id;
      return apiCall(`/entities/${encodeURIComponent(entity)}/${encodeURIComponent(cleanId)}`, 'PUT', data);
    },
  },

  // Chat operations with improved error handling and context memory
  chat: {
    send: async (message, conversationHistory = [], language = 'en', options = {}) => {
      try {
        const { userEmail = 'anonymous', userName = null } = options || {};
        const response = await apiCall('/chat/send', 'POST', {
          message,
          conversationHistory,
          userEmail,
          userName,
          language
        });
        
        // Validate response
        if (!response?.success || !response?.response) {
          throw new Error('Invalid response format from server');
        }
        
        return {
          response: response.response,
          detected_sentiment: response.detected_sentiment || 'neutral',
          sentiment_score: response.sentiment_score ?? 0.5,
          emotion: response.emotion || 'neutral',
          emotion_states: response.emotion_states || [],
          suggested_actions: response.suggested_actions || [],
          context: response.context || {},
          memory_messages_used: response.memory_messages_used || 0,
          crisis: response.crisis || false,
          context_themes: response.context_themes || [],
          response_source: response.response_source || 'unknown'
        };
      } catch (error) {
        console.error('Chat send error:', error);
        throw error;
      }
    },

    analyzePhoto: async (imageUrl) => {
      try {
        const response = await apiCall('/chat/analyze-photo', 'POST', {
          imageUrl,
          userEmail: 'anonymous'
        });

        if (!response?.success) {
          throw new Error('Photo analysis failed');
        }

        return {
          detected_mood: response.detected_mood || 'neutral',
          brief_observation: response.brief_observation || 'Analysis complete.'
        };
      } catch (error) {
        console.error('Photo analysis error:', error);
        throw error;
      }
    },

    getHistory: async (limit = 50) => {
      try {
        const response = await apiCall(`/chat/history/anonymous?limit=${limit}`);
        return {
          messages: response.messages || [],
          total_messages: response.total_messages || 0,
          average_sentiment: response.average_sentiment || 0.5,
          detected_themes: response.detected_themes || [],
          last_updated: response.last_updated || null
        };
      } catch (error) {
        console.error('Get history error:', error);
        return { messages: [], total_messages: 0, average_sentiment: 0.5, detected_themes: [], last_updated: null };
      }
    },

    getAnalytics: async () => {
      try {
        const response = await apiCall('/chat/analytics/anonymous');
        return response.analytics || {
          total_messages: 0,
          user_messages: 0,
          assistant_messages: 0,
          average_sentiment: 0.5,
          crisis_alerts: 0,
          detected_themes: [],
          top_emotions: []
        };
      } catch (error) {
        console.error('Get analytics error:', error);
        return {
          total_messages: 0,
          user_messages: 0,
          assistant_messages: 0,
          average_sentiment: 0.5,
          crisis_alerts: 0,
          detected_themes: [],
          top_emotions: []
        };
      }
    },

    clearConversation: async () => {
      try {
        const response = await apiCall('/chat/clear/anonymous', 'DELETE');
        return response.success || false;
      } catch (error) {
        console.error('Clear conversation error:', error);
        return false;
      }
    }
  },

  // Mood operations
  mood: {
    create: async (mood, intensity = 5, note = '') => {
      return apiCall('/mood/create', 'POST', {
        mood,
        intensity,
        note,
        userEmail: 'anonymous'
      });
    },
    getHistory: async (limit = 50) => {
      return apiCall(`/mood/history?limit=${limit}`);
    },
    getStats: async (days = 30) => {
      return apiCall(`/mood/stats?days=${days}`);
    }
  },

  // Analysis operations
  analysis: {
    triggers: async (entries = []) => {
      return apiCall('/analysis/triggers', 'POST', {
        entries,
        userEmail: 'anonymous'
      });
    },
    emotionStory: async (trigger) => {
      return apiCall('/analysis/emotion-story', 'POST', {
        trigger,
        userEmail: 'anonymous'
      });
    }
  },

  // Reports
  reports: {
    generateWeekly: async ({ weekDescription = '', userEmail = 'anonymous', weekStart = '', weekEnd = '' } = {}) => {
      return apiCall('/reports/weekly', 'POST', {
        userEmail,
        weekDescription,
        weekStart,
        weekEnd
      });
    },
    getCharts: async (days = 7) => {
      return apiCall(`/reports/charts?days=${days}`);
    }
  },

  // Forecaster
  forecaster: {
    predict: async (days = 7) => {
      return apiCall(`/predict-mood?days=${days}`);
    }
  },

  // Decision Helper
  decision: {
    help: async (situation, options = []) => {
      return apiCall('/decision/help', 'POST', {
        situation,
        options,
        userEmail: 'anonymous'
      });
    }
  },

  // Admin
  admin: {
    getStats: async () => {
      return apiCall('/admin/stats');
    },
    getMoodDistribution: async () => {
      return apiCall('/admin/mood-distribution');
    },
    getCrisisAlerts: async () => {
      return apiCall('/admin/crisis-alerts');
    }
  }
};

// Fallback helper - if local API is down, provides fallback responses
export function getFallbackResponse(type) {
  const fallbacks = {
    chat: {
      response: "I'm having trouble connecting to the backend. Please try again later.",
      detected_sentiment: 'neutral',
      sentiment_score: 0.5
    },
    mood: {
      message: 'Unable to save mood right now'
    },
    report: {
      report: 'Unable to generate report right now'
    }
  };
  return fallbacks[type];
}
