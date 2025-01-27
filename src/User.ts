import { SubscriptionManager } from "./SubscriptionManager";
import { OutgoingMessage } from "./types/out";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";

export class User {
    private id: string;
    private ws: WebSocket;
    private subscriptions: string[] = [];

    constructor(id: string, ws: WebSocket) {
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }

    public subscribe(subscription: string) {
        this.subscriptions.push(subscription);
    }

    public unsubscribe(subscription: string) {
        this.subscriptions = this.subscriptions.filter(s => s !== subscription);
    }

    emit(message: OutgoingMessage) {
        console.log("message: ", message);
        this.ws.send(JSON.stringify(message));
    }

    private addListeners() {
        this.ws.addEventListener("message", (event) => {
                    const parsedMessage: IncomingMessage = JSON.parse(event.data as string);
                    if (parsedMessage.method === SUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().subscribe(this.id, s));
            }

            if (parsedMessage.method === UNSUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().unsubscribe(this.id, s));
            }
        });
    }
}