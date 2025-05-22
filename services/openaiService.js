/**
 * Re-export the OpenAI service from the correct location
 * This file is needed to fix module resolution issues in production
 */
export { openaiService } from '../api/services/openaiService.js';
