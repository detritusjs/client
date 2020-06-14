import { Timers } from 'detritus-utils';


export class Bucket {
  readonly queue: Array<Function> = [];
  readonly timeout = new Timers.Timeout();

  delay: number;
  executing: boolean = false;
  limit: number;
  locked: boolean = false;
  sent = {
    amount: 0,
    last: 0,
  };
  wait: boolean;

  constructor(
    limit: number = 0,
    delay: number = 0,
    wait: boolean = false,
  ) {
    this.delay = delay;
    this.limit = limit;
    this.wait = wait;

    Object.defineProperties(this, {
      timeout: {enumerable: false},
    });
  }

  add(
    throttled: Function,
    unshift: boolean = false,
  ): void {
    if (unshift) {
      this.queue.unshift(throttled);
    } else {
      this.queue.push(throttled);
    }
    this.shift();
  }

  clear(): void {
    this.queue.length = 0;
  }

  lock(unlockIn: number = 0): void {
    this.timeout.stop();

    this.locked = true;
    if (unlockIn) {
      this.timeout.start(unlockIn, () => {
        this.unlock();
      });
    }
  }

  shift(): void {
    if (this.executing || this.locked) {return;}
    if (!this.queue.length) {return;}

    const throttled = this.queue.shift();
    if (throttled) {
      if (this.wait) {
        this.executing = true;
        Promise.resolve(throttled())
          .catch(() => {})
          .then(() => {
            this.executing = false;
            this.tryLock();
            this.shift();
          });
      } else {
        this.tryLock();
        throttled();
        this.shift();
      }
    }
  }

  tryLock(): void {
    if (this.limit) {
      const now = Date.now();
      if (this.sent.last + this.delay <= now) {
        this.sent.amount = 0;
        this.sent.last = now;
      }
      if (this.limit <= ++this.sent.amount) {
        const diff = Math.max(this.delay - (now - this.sent.last), 0);
        if (diff) {
          this.lock(diff);
        }
      }
    }
  }

  unlock(): void {
    this.locked = false;
    this.shift();
  }
}
