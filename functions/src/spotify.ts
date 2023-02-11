import axios from 'axios';
import Vibrant from 'node-vibrant';

import {SpotifyConfig} from './config';
import {db} from './firestore';

export type SpotifyPlayingType = 'track' | 'album' | 'artist' | 'playlist';

type SpotifyImage = {
  url: string;
  width: number;
  height: number;
};

type RefreshTokenPayload = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

type PlaybackStatePayload = {
  context: {
    type: string;
    uri: string;
  } | null;
  item: {
    album: {
      images: SpotifyImage[];
    };
    artists: {
      id: string;
    };
  };
  currently_playing_type: SpotifyPlayingType;
}

const AUTH_URL = 'https://accounts.spotify.com/api/token';
const PLAYBACK_STATE_URL = 'https://api.spotify.com/v1/me/player';

const auth = async (config: SpotifyConfig) => {
  const snapshot = await db.collection('spotify_auth').get();
  const validToken = snapshot.docs.find(
      (doc) => doc.data().expires_at > new Date().toISOString()
  );
  if (validToken) {
    return validToken.data().access_token as string;
  } else {
    // Delete expired tokens
    const batch = db.batch();
    snapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    // Refresh token
    return refreshToken(config);
  }
};

const refreshToken = async (config: SpotifyConfig) => {
  const {clientId, clientSecret, refreshToken} = config;
  const authorizationBase64 = Buffer
      .from(`${clientId}:${clientSecret}`)
      .toString('base64');
  const response = await axios.post<RefreshTokenPayload>(
      AUTH_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Authorization': `Basic ${authorizationBase64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
  );
  const {access_token: accessToken, expires_in: expiresIn} = response.data;
  const expiresAt = new Date(new Date().getTime() + expiresIn * 1000);
  await db.collection('spotify_auth').add({
    access_token: accessToken,
    expires_at: expiresAt.toISOString(),
  });
  return accessToken;
};

const getPlaybackState = async (config: SpotifyConfig) => {
  const accessToken = await auth(config);
  const url = PLAYBACK_STATE_URL;
  const headers = {Authorization: `Bearer ${accessToken}`};
  const response = await axios.get<PlaybackStatePayload>(url, {headers});
  return response.data;
};

export const getColorFrom = async (
    config: SpotifyConfig,
    from: 'auto' | SpotifyPlayingType
) => {
  const {item} = await getPlaybackState(config);
  let imageUrl: string | undefined;
  switch (from) {
    case 'album':
      imageUrl = item.album.images[0]?.url;
      break;
    default:
      throw new Error('option not yet support');
  }
  const color = (await Vibrant.from(imageUrl).getPalette()).DarkVibrant?.hex;
  if (!color) {
    throw new Error(`Unable to get color from ${from}`);
  }
  return color;
};
