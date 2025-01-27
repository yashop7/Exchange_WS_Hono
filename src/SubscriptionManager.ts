import { createClient, RedisClientType } from "redis";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: RedisClientType;

  private constructor() {
    this.redisClient = createClient(); //This RedisClient is Our PubSub
    this.redisClient.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) {
      return;
    }
    
    this.subscriptions.set(
      userId,
      (this.subscriptions.get(userId) || []).concat(subscription)
    );
    
    this.reverseSubscriptions.set(
      subscription,
      (this.reverseSubscriptions.get(subscription) || []).concat(userId)
    );

    // Note: In a production environment, you'd want to use Durable Objects
    // or an external pub/sub system since Workers are stateless
  }

  public broadcast(channel: string, message: any) {
    const subscribers = this.reverseSubscriptions.get(channel) || [];
    subscribers.forEach(userId => {
      const user = UserManager.getInstance().getUser(userId);
      if (user) {
        user.emit(message);
      }
    });
  }

  public unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(userId);
    if (subscriptions) {
      this.subscriptions.set(
        userId,
        subscriptions.filter((s) => s !== subscription)
      );
    }

    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(
        subscription,
        reverseSubscriptions.filter((s) => s !== userId)
      );
      if (this.reverseSubscriptions.get(subscription)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
      }
    }
  }

  public userLeft(userId: string) {
    console.log("user left " + userId);
    this.subscriptions.get(userId)?.forEach((s) => this.unsubscribe(userId, s));
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}