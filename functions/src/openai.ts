import axios from 'axios';
import {OpenAiConfig} from './config';

const COMPLETION_API_URL = 'https://api.openai.com/v1/completions';

export const getColorFromLyrics = async (
    config: OpenAiConfig,
    lyrics: string
) => {
  if (!config.apiKey) {
    throw new Error('OpenAI API Key is required for this operation');
  }
  const response = await axios.post<{
    choices: {
      text: string
    }[]
  }>(
      COMPLETION_API_URL,
      {
        model: 'text-davinci-003',
        // eslint-disable-next-line max-len
        prompt: `Answer me with only a color hex string, what color would you associate with the lyrics: "${lyrics}"?`,
        max_tokens: 256,
        temperature: 0.5,
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

  return response.data.choices[0]?.text.match(/#([0-9A-F]{3}){1,2}$/gi)?.[0];
};
