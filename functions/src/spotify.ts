import axios from 'axios';
import Vibrant from 'node-vibrant';

import {Config, SpotifyConfig} from './config';
import {db} from './firestore';
import {getColorFromLyrics} from './openai';
import {getTrackLyrics} from './genius';

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
  item: {
    album: {
      images: SpotifyImage[];
    };
    artists: {
      name: string;
    }[];
    name: string;
  };
  currently_playing_type: 'track' | 'album' | 'artist' | 'playlist';
  is_playing: boolean;
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

const getColorFromTrackAlbum = async (track: PlaybackStatePayload['item']) => {
  const imageUrl = track.album.images[0]?.url;
  return (await Vibrant.from(imageUrl).getPalette()).DarkVibrant?.hex ?? null;
};

const getColorFromTrackLyrics = async (
    config: Config,
    track: PlaybackStatePayload['item']
) => {
  const lyrics = await getTrackLyrics(
      config.genius,
      track.name,
      track.artists[0]?.name
  );
  let color: string | undefined;
  if (lyrics) {
    color = await getColorFromLyrics(config.openai, lyrics);
  }
  return color ?? null;
};

export const getColorFromTrack = async (
    config: Config,
    from: 'album' | 'lyrics'
) => {
  const {item, is_playing: isPlaying} = await getPlaybackState(config.spotify);
  if (!isPlaying) {
    return null;
  }
  let color: string | null;
  switch (from) {
    case 'album':
      color = await getColorFromTrackAlbum(item);
      break;
    case 'lyrics': {
      color = await getColorFromTrackLyrics(config, item);
      // If unable to get color from track lyrics, fallback to album
      if (!color) {
        color = await getColorFromTrackAlbum(item);
      }
      break;
    }
    default:
      throw new Error('option not yet support');
  }
  return color ?? null;
};
