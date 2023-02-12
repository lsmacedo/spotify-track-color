# spotify-track-color

This is a [Firebase Cloud Function](https://firebase.google.com/docs/functions)
that extracts the main color from the track currently being played on Spotify.

# Setup

- Create a new project on https://developer.spotify.com/
- Create a new project on http://console.firebase.google.com/
- Clone this repository
- Run `firebase init` to associate the directory into your Firebase project
- Copy the `.env.example` file into a new `.env` file and replace the
  placeholder values with information from your Spotify project

# Usage

To use the function, simply make a POST request to the endpoint with the desired
parameters. Be sure to set the `secret_key` in the request headers (the same
secret key from your `.env` file).

## Parameters

The function accepts two optional parameters in the request body: `from` and
`colors`.

### from

The from parameter allows you to specify the source of the image to extract the
color from. You can specify one of the following options:

- album (default)
- lyrics

### colors

The colors parameter allows you to restrict the response to a set of colors. The
response will be the color from the array which is closest to the track color.
It must be specified as an array of hexadecimal color codes (e.g. `#ff0000`).

### Example request body

```json
{
  "from": "album",
  "colors": ["#ff0000", "#00ff00", "#0000ff"]
}
```

## Response

The function will return a JSON object with the color property, as in the
example below:

```json
{
  "color": "#0000ff"
}
```
