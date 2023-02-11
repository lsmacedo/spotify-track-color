import {readEnv} from 'read-env';
import * as yup from 'yup';
import dotenv from 'dotenv';

dotenv.config();

export const configSchema = yup.object({
  secretKey: yup.string().required(),
  spotify: yup.object({
    clientId: yup.string().required(),
    clientSecret: yup.string().required(),
    refreshToken: yup.string().required(),
  }),
}).camelCase();

type Config = yup.InferType<typeof configSchema>;
export type SpotifyConfig = Config['spotify'];

const rawConfig = readEnv('APP');
export const config = configSchema.validateSync(rawConfig);
