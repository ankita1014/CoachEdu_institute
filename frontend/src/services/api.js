import axios from 'axios';

const isLocal = import.meta.env.DEV;
const baseURL = isLocal ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
};

export const leaderboardAPI = {
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard');
    return response.data;
  },
};

export const quizAPI = {
  submit: async (resultData) => {
    const response = await api.post('/quiz/submit', resultData);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/quiz/history');
    return response.data;
  },
};

export const questionsAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/questions', { params: filters });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/questions/stats');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/questions', data);
    return response.data;
  },
  bulkUpload: async (payload) => {
    const data = typeof payload === 'string' ? { fileData: payload } : payload;
    const response = await api.post('/questions/bulk-upload', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },
};

export const coursesAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/courses', { params: filters });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/courses/stats/count');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/courses', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};

export const enrollmentsAPI = {
  create: async (data) => {
    const response = await api.post('/enrollments', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/enrollments');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/enrollments/stats/count');
    return response.data;
  },
  getUserEnrollments: async (userId) => {
    const response = await api.get(`/enrollments/user/${userId}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/enrollments/${id}`, data);
    return response.data;
  },
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/enrollments/${id}/status`, statusData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },
};

export const demoBookingsAPI = {
  create: async (data) => {
    const response = await api.post('/demo-bookings', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/demo-bookings');
    return response.data;
  },
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/demo-bookings/${id}/status`, statusData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/demo-bookings/${id}`);
    return response.data;
  },
};

export const contestsAPI = {
  getAll: async () => {
    const response = await api.get('/contests');
    return response.data;
  },
  getActive: async () => {
    const response = await api.get('/contests/active');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/contests/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/contests', data);
    return response.data;
  },
  bulkUpload: async (payload, contestDetails = {}) => {
    const data = typeof payload === 'string' ? { fileData: payload, ...contestDetails } : { ...payload, ...contestDetails };
    const response = await api.post('/contests/bulk-upload', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/contests/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/contests/${id}`);
    return response.data;
  },
  submit: async (id, answers) => {
    const response = await api.post(`/contests/${id}/submit`, { answers });
    return response.data;
  },
  getLeaderboard: async (id) => {
    const response = await api.get(`/contests/${id}/leaderboard`);
    return response.data;
  },
  getMyResult: async (id) => {
    const response = await api.get(`/contests/${id}/my-result`);
    return response.data;
  },
};

const BASE = `${import.meta.env.VITE_API_URL}/subjects`;

export const getSubject = async (name) => {
  const res = await fetch(`${BASE}/${name}`);
  return res.json();
};

export const addSkillAPI = async (name, skill, description = "") => {
  const res = await fetch(`${BASE}/${name}/skill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: skill, description }),
  });
  return res.json();
};

export const addChapterAPI = async (name, index, chapter) => {
  const res = await fetch(`${BASE}/${name}/skill/${index}/chapter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter }),
  });
  return res.json();
};

export const deleteSkillAPI = async (name, index) => {
  const res = await fetch(`${BASE}/${name}/skill/${index}`, {
    method: "DELETE",
  });
  return res.json();
};

export const updateSkillAPI = async (name, index, updatedSkill) => {
  const res = await fetch(`${BASE}/${name}/skill/${index}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updatedSkill }),
  });
  return res.json();
};

export const toggleChapterAPI = async (name, skillIndex, chapterIndex) => {
  const res = await fetch(`${BASE}/${name}/skill/${skillIndex}/chapter/${chapterIndex}/toggle`, {
    method: "PATCH",
  });
  return res.json();
};
export default api;
