/**
 * Service for making requests to the OpenAI API through our backend endpoint
 */

export class OpenAIService {
  constructor(apiKey = null) {
    // API key is handled by the backend now
    this.defaultModel = 'gpt-4o-mini';
  }

  /**
   * Generate a response using our backend endpoint
   * @param {Array} messages - Array of message objects with role and content
   * @param {boolean} jsonMode - Whether to request JSON formatted responses
   * @returns {Promise<Object>} - The parsed JSON response from OpenAI
   */
  async generateResponse(messages, jsonMode = true) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, jsonMode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Extract and return the content directly
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Parse the content from OpenAI's response
   * @param {Object} response - The full response from OpenAI
   * @param {boolean} isJson - Whether to parse the content as JSON
   * @returns {Object|string} - The parsed content or raw string
   */
  parseResponse(response, isJson = true) {
    try {
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content;
        return isJson ? JSON.parse(content) : content;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      if (isJson) {
        console.error('Error parsing JSON response:', error);
        throw error;
      } else {
        // If not expecting JSON, just return the content as is
        return response.choices[0].message.content;
      }
    }
  }

  /**
   * Make a chat completion request using our backend API
   * @param {Object} options - Configuration options for the request
   * @param {string} options.systemPrompt - The system prompt to use
   * @param {string} options.userPrompt - The user prompt to use
   * @param {boolean} options.jsonMode - Whether to request JSON formatted responses
   * @returns {Promise<Object>} - The API response
   */
  async chat({
    systemPrompt,
    userPrompt,
    jsonMode = true
  }) {
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ];

    return this.generateResponse(messages, jsonMode);
  }

  /**
   * Extract the content from the first choice in the API response
   * @param {Object} response - The API response
   * @returns {string} - The extracted content
   */
  extractContent(response) {
    if (response && response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    }
    return '';
  }

  /**
   * Convenience method to get just the content from a chat completion
   * @param {Object} options - Same options as the chat method
   * @returns {Promise<string>} - Just the content string
   */
  async getChatContent(options) {
    // Set jsonMode to false for plain text responses
    const chatOptions = { ...options, jsonMode: false };
    const response = await this.chat(chatOptions);
    return this.extractContent(response);
  }

  /**
   * Get JSON response from OpenAI
   * @param {Object} options - Same options as the chat method
   * @returns {Promise<Object>} - Parsed JSON object
   */
  async getJsonResponse(options) {
    // Force JSON mode
    const jsonOptions = { ...options, jsonMode: true };
    const response = await this.chat(jsonOptions);
    const content = this.extractContent(response);
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse JSON response from OpenAI');
    }
  }
}

// Create and export a singleton instance
const openaiService = new OpenAIService();
export default openaiService; 