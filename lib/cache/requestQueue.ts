/**
 * Request queue with exponential backoff for handling rate limiting.
 * Serializes requests to avoid overwhelming APIs and handles 429 responses gracefully.
 */

type QueuedRequest<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  attempt: number;
  maxRetries: number;
  backoffMs: number;
};

type QueueConfig = {
  concurrency?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  maxRetries?: number;
};

export class RequestQueue {
  private static instance: RequestQueue;

  private queue: QueuedRequest<unknown>[] = [];

  private running = 0;

  private concurrency: number;

  private baseBackoffMs: number;

  private maxBackoffMs: number;

  private maxRetries: number;

  private constructor(config: QueueConfig = {}) {
    this.concurrency = config.concurrency ?? 2; // Serialize requests by default
    this.baseBackoffMs = config.baseBackoffMs ?? 1000; // 1 second
    this.maxBackoffMs = config.maxBackoffMs ?? 32000; // 32 seconds max
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

      this.queue.push(request);
      this.process();
    });
  }

  private process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        this.running++;
        this.executeRequest(request);
      }
    }
  }

  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
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

        console.warn(`[RequestQueue] Rate limited, retrying in ${backoff}ms (attempt ${request.attempt}/${request.maxRetries})`);

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
    };
  }

  /**
   * Reset queue (useful for testing)
   */
  reset() {
    this.queue = [];
    this.running = 0;
  }
}

export function getRequestQueue(config?: QueueConfig): RequestQueue {
  return RequestQueue.getInstance(config);
}
