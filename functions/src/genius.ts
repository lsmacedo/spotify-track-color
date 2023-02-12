import {getLyrics} from 'genius-lyrics-api';

import {GeniusConfig} from './config';

export const getTrackLyrics = async (
    config: GeniusConfig,
    title: string,
    artist: string
) => {
  const {accessToken} = config;

  if (!accessToken) {
    throw new Error('Genius Access Token is required for this operation');
  }

  return getLyrics({
    apiKey: accessToken,
    title,
    artist,
    optimizeQuery: true,
  });
};
