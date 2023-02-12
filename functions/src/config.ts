import {readEnv} from 'read-env';
import * as yup from 'yup';
import dotenv from 'dotenv';

dotenv.config();

export const configSchema = yup.object({
  secretKey: yup.string().required(),
  openai: yup.object({
    apiKey: yup.string(),
  }),
  genius: yup.object({
    accessToken: yup.string(),
  }),
  spotify: yup.object({
    clientId: yup.string().required(),
    clientSecret: yup.string().required(),
    refreshToken: yup.string().required(),
  }),
}).camelCase();

export type Config = yup.InferType<typeof configSchema>;
export type OpenAiConfig = Config['openai'];
export type GeniusConfig = Config['genius'];
export type SpotifyConfig = Config['spotify'];

const rawConfig = readEnv('APP');
export const config = configSchema.validateSync(rawConfig);
