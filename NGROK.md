# Expose your local backend with ngrok (quick guide)

This project includes a helper to start an ngrok tunnel so you can share your local backend (and Socket.IO) with friends.

Prerequisites
- Install pyngrok in the backend venv:

```bash
source .venv/bin/activate
pip install pyngrok
```

- (Optional but recommended) Create an ngrok account and get an authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

How to start backend with ngrok

1. Set the ngrok auth token (optional):

```bash
export NGROK_AUTH_TOKEN=your_token_here
```

2. Enable ngrok and run the backend. By default backend port is 5000, you can change it with `BACKEND_PORT`.

```bash
export ENABLE_NGROK=true
export BACKEND_PORT=5002   # optional, if you run on other port
source .venv/bin/activate
python server/app.py
```

When successful you'll see a line like:

```
[NGROK] Public URL: https://abcd-1234.ngrok.io
```

What to do with the public URL

- For REST API calls and Socket.IO, use the public URL as the base (no port needed). For example:
  - API base: `https://abcd-1234.ngrok.io`
  - Socket.IO URL: `https://abcd-1234.ngrok.io`

- To allow your friends to use the full app in their browser you need to serve your frontend somewhere reachable (e.g. deploy build somewhere) or also expose the frontend via ngrok by running the frontend server on your machine and creating a second tunnel (see ngrok docs). Sharing the backend alone is enough if they use a deployed frontend that points to your ngrok backend.

Notes and troubleshooting
- If you get permission errors when setting the auth token, make sure `pyngrok` is installed in the same Python environment used to run the server.
- If you see `ngrok` fail to start, check firewall and network policies.
- The helper function used by the app is `services/network_setup.start_ngrok(app, port=<port>)` and stores the public URL in `app.config['BASE_URL']`.

If you want, I can also update the frontend `.env` automatically to point `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to the ngrok URL when the server starts — tell me if you want that automation.