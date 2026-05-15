/**
 * Request queue with exponential backoff for handling rate limiting.
 * Respects API rate limits by serializing requests with minimum delay between them.
 * Designed to work with 1 RPS (requests per second) APIs.
 */

type QueuedRequest<T = unknown> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  attempt: number;
  maxRetries: number;
  backoffMs: number;
};

type QueueConfig = {
  /**
   * Maximum concurrent requests. Default: 1 (serialized)
   * For 1 RPS APIs, keep this at 1.
   */
  concurrency?: number;
  /**
   * Minimum milliseconds between requests to enforce rate limit.
   * Default: 1000ms (1 second for 1 RPS APIs)
   */
  minRequestIntervalMs?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  maxRetries?: number;
};

export class RequestQueue {
  private static instance: RequestQueue;

  private queue: QueuedRequest[] = [];

  private running = 0;

  private concurrency: number;

  private minRequestIntervalMs: number;

  private baseBackoffMs: number;

  private maxBackoffMs: number;

  private maxRetries: number;

  private lastRequestTime = 0;

  private constructor(config: QueueConfig = {}) {
    this.concurrency = config.concurrency ?? 1; // Serialize for rate limiting
    this.minRequestIntervalMs = config.minRequestIntervalMs ?? 1000; // 1 second for 1 RPS
    this.baseBackoffMs = config.baseBackoffMs ?? 1000;
    this.maxBackoffMs = config.maxBackoffMs ?? 32000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  static getInstance(config?: QueueConfig): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue(config);
    }
    return RequestQueue.instance;
  }

  /**
   * Enqueue a request with automatic retry on 429 responses.
   * @param execute - Async function that makes the request
   * @param maxRetries - Max retry attempts (default: 3)
   */
  async enqueue<T>(execute: () => Promise<T>, maxRetries?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        execute,
        resolve,
        reject,
        attempt: 0,
        maxRetries: maxRetries ?? this.maxRetries,
        backoffMs: this.baseBackoffMs,
      };

      this.queue.push(request as QueuedRequest);
      this.process();
    });
  }

  private process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const delayNeeded = Math.max(0, this.minRequestIntervalMs - timeSinceLastRequest);

      if (delayNeeded > 0) {
        // Wait for rate limit to allow next request
        setTimeout(() => this.process(), delayNeeded);
        break;
      }

      const request = this.queue.shift();
      if (request) {
        this.running++;
        this.lastRequestTime = Date.now();
        this.executeRequest(request);
      }
    }
  }

  private async executeRequest(request: QueuedRequest): Promise<void> {
    try {
      const result = await request.execute();
      request.resolve(result);
      this.running--;
      this.process();
    } catch (error: unknown) {
      const isRateLimited = this.isRateLimitError(error);

      if (isRateLimited && request.attempt < request.maxRetries) {
        request.attempt++;
        // Calculate exponential backoff: baseBackoff * 2^attempt
        const backoff = Math.min(
          this.baseBackoffMs * Math.pow(2, request.attempt - 1),
          this.maxBackoffMs
        );

        console.warn(
          `[RequestQueue] Rate limited (429), retrying in ${backoff}ms (attempt ${request.attempt}/${request.maxRetries})`
        );

        // Put back in queue with delay
        setTimeout(() => {
          this.queue.unshift(request);
          this.process();
        }, backoff);

        this.running--;
      } else {
        request.reject(error);
        this.running--;
        this.process();
      }
    }
  }

  private isRateLimitError(error: unknown): boolean {
    // Check for HTTP 429 status
    if (error instanceof Error) {
      if (error.message.includes("429")) return true;
      if (error.message.includes("rate limit")) return true;
      if (error.message.includes("RATE_LIMITED")) return true;
    }

    // Check for custom error object with status property
    if (typeof error === "object" && error !== null) {
      const obj = error as Record<string, unknown>;
      if (obj.status === 429) return true;
      if (obj.code === "RATE_LIMITED") return true;
    }

    return false;
  }

  /**
   * Get queue stats for monitoring
   */
  getStats() {
    return {
      queuedRequests: this.queue.length,
      runningRequests: this.running,
      maxConcurrency: this.concurrency,
      minRequestIntervalMs: this.minRequestIntervalMs,
    };
  }

  /**
   * Reset queue (useful for testing)
   */
  reset() {
    this.queue = [];
    this.running = 0;
    this.lastRequestTime = 0;
  }
}

export function getRequestQueue(config?: QueueConfig): RequestQueue {
  return RequestQueue.getInstance(config);
}
