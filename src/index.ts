import { UserManager } from './UserManager';

export interface Env {
  // Add any Worker-specific bindings here
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected Websocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Handle the server-side of the WebSocket
    server.accept();
    UserManager.getInstance().addUser(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};