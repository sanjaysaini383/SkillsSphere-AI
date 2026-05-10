import { apiRequest } from "../../../services/apiClient";

/**
 * Get AI-powered job recommendations based on the student's latest resume
 * @param {string} token - Auth token
 * @returns {Promise<Object>} - { success, message, jobs, hasResume }
 */
export const getRecommendations = async (token) => {
  return apiRequest("/api/jobs/recommendations", { token });
};