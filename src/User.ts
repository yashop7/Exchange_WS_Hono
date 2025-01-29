import { SubscriptionManager } from "./SubscriptionManager";
import { OutgoingMessage } from "./types/out";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";

export class User {
    private id: string;
    private ws: WebSocket;
    private subscriptions: string[] = [];

    constructor(id: string, ws: WebSocket) {
        console.log(`Creating new User with ID: ${id}`);
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }

    public subscribe(subscription: string) {
        console.log(`User ${this.id} subscribing to: ${subscription}`);
        this.subscriptions.push(subscription);
    }

    public unsubscribe(subscription: string) {
        console.log(`User ${this.id} unsubscribing from: ${subscription}`);
        this.subscriptions = this.subscriptions.filter(s => s !== subscription);
    }

    emit(message: OutgoingMessage) {
        console.log(`Emitting message to User ${this.id}:`, message);
        this.ws.send(JSON.stringify(message));
    }

    private addListeners() {
        console.log(`Adding WebSocket listeners for User ${this.id}`);
        this.ws.addEventListener("message", (event) => {
            console.log(`Received WebSocket message from User ${this.id}:`, event.data);
            const parsedMessage: IncomingMessage = JSON.parse(event.data as string);
            
            if (parsedMessage.method === SUBSCRIBE) {
                console.log(`Processing SUBSCRIBE request from User ${this.id}:`, parsedMessage.params);
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().subscribe(this.id, s));
            }

            if (parsedMessage.method === UNSUBSCRIBE) {
                console.log(`Processing UNSUBSCRIBE request from User ${this.id}:`, parsedMessage.params);
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().unsubscribe(this.id, s));
            }
        });
    }
}