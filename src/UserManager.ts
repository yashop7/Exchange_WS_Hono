import { User } from "./User";
import { SubscriptionManager } from "./SubscriptionManager";

export class UserManager {
    private static instance: UserManager;
    private users: Map<string, User> = new Map();

    private constructor() {
        console.log("UserManager initialized");
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public addUser(ws: WebSocket) {
        if (!ws) {
            console.error("WebSocket is invalid. Cannot add user.");
            return;
        }
        const id = this.getRandomId();
        const user = new User(id, ws);
        this.users.set(id, user);
        console.log(`User added with ID: ${id}`);
        this.registerOnClose(ws, id);
        return user;
    }

    private registerOnClose(ws: WebSocket, id: string) {
        ws.addEventListener("close", () => {
            this.users.delete(id);
            console.log(`User removed with ID: ${id}`);
            SubscriptionManager.getInstance().userLeft(id);
        });
    }

    public getUser(id: string) {
        if (!this.users.has(id)) {
            console.warn(`No user found with ID: ${id}`);
            return undefined;
        }
        return this.users.get(id);
    }

    private getRandomId() {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }
}