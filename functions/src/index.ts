import * as functions from 'firebase-functions';
import * as yup from 'yup';

import {config} from './config';
import {getColorFrom} from './spotify';
import {closestColor} from './utils';

const requestHeadersSchema = yup.object({
  secret_key: yup
      .string()
      .test((value) => value === config.secretKey)
      .required(),
});

const requestBodySchema = yup.object({
  from: yup
      .string()
      .oneOf(['album', 'artist', 'playlist'])
      .default('album'),
  colors: yup
      .array()
      .of(yup.string().matches(/^#([0-9A-F]{3}){1,2}$/i).required())
      .optional(),
});

type RequestBody = yup.InferType<typeof requestBodySchema>;

export const getSpotifyTrackColor = functions.https.onRequest(
    async (request, response) => {
      let body: RequestBody;

      // Validate request headers
      try {
        requestHeadersSchema.validateSync(request.headers);
      } catch (err) {
        response.sendStatus(401);
        return;
      }

      // Validate request body
      try {
        body = requestBodySchema.validateSync(request.body);
      } catch (err) {
        response.sendStatus(400);
        return;
      }

      try {
        // Get color from track
        const color = await getColorFrom(config.spotify, body.from);

        // Get available option that is closest to the color from the track
        const responseColor = body.colors?.length ?
          closestColor(color, body.colors) :
          color;

        response.send({color: responseColor});
      } catch (err) {
        response.sendStatus(500);
      }
    });
