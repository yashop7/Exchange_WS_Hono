import Redis from "ioredis";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: Redis;

  private constructor() {
    this.redisClient = new Redis({
      host: "redis", // Docker service name or Redis host
      port: 6379,
      lazyConnect: true, // Avoid immediate connection attempts
      retryStrategy: (times) => {
        // Exponential backoff with max delay of 3000ms
        return Math.min(times * 100, 3000);
      },
    });

    this.redisClient.on("error", (err) => {
      console.log("Redis Client Error", err);
    });

    this.redisClient.on("connect", () => {
      console.log("Successfully connected to Redis");
    });

    // Bind the broadcast method to maintain correct 'this' context
    this.broadcast = this.broadcast.bind(this);

    // Connect to Redis
    this.redisClient.connect().catch(console.error);
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
    if (this.reverseSubscriptions.get(subscription)?.length === 1) {
      console.log("subscribing to ", subscription);
      this.redisClient.subscribe(subscription, (err, count) => {
        if (err) {
          console.error("Failed to subscribe:", err);
        } else {
          console.log(`Subscribed to ${count} channels`);
        }
      });
    }
  }

  public broadcast(message: string, channel: string) {
    console.log("HELLO I AM CALLED");
    const parsedMessage = JSON.parse(message);
    console.log("parsedMessage: ", parsedMessage);
    this.reverseSubscriptions
      .get(channel)
      ?.forEach((s) =>
        UserManager.getInstance().getUser(s)?.emit(parsedMessage)
      );
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
        this.redisClient.unsubscribe(subscription);
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