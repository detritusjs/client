import { ClusterClient } from '../clusterclient';
import { ClusterIPCOpCodes } from '../constants';
import { ClusterIPCError } from '../errors';
import { Snowflake } from '../utils';

import { ClusterIPCTypes } from './ipctypes';


export class ClusterProcessChild {
  cluster: ClusterClient;

  constructor(cluster: ClusterClient) {
    this.cluster = cluster;

    process.on('message', this.onMessage.bind(this));
    this.cluster.on('ready', () => this.sendIPC(ClusterIPCOpCodes.READY));
  }

  async onMessage(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    if (!message || typeof(message) !== 'object') {
      return;
    }
    try {
      switch (message.op) {
        case ClusterIPCOpCodes.EVAL: {
          if (message.request) {
            const data: ClusterIPCTypes.Eval = message.data;
            try {
              const result = await Promise.resolve(this.cluster._eval(data.code));
              await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                ...data,
                results: result,
              });
            } catch(error) {
              await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                ...data,
                error: {
                  message: error.message,
                  name: error.name,
                  stack: error.stack,
                },
              });
            }
          }
        }; return;
      }
    } catch(error) {
      this.cluster.emit('warn', error);
    }
  }

  async send(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    const parent = <any> process;
    return new Promise((resolve, reject) => {
      parent.send(message, (error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async sendIPC(op: number, data: any = null, request: boolean = false): Promise<void> {
    return this.send({op, data, request});
  }

  async broadcastEval(code: Function | string): Promise<any> {
    const parent = <any> process;
    const nonce = Snowflake.generate().id;
    return new Promise(async (resolve, reject) => {
      const listener = (
        message: ClusterIPCTypes.IPCMessage | any,
      ) => {
        if (message && typeof(message) === 'object') {
          if (message.request) {
            return;
          }
          switch (message.op) {
            case ClusterIPCOpCodes.EVAL: {
              const data: ClusterIPCTypes.Eval = message.data;
              if (data.nonce === nonce) {
                parent.removeListener('message', listener);
                if (data.error) {
                  reject(new ClusterIPCError(data.error));
                } else {
                  resolve(data.results);
                }
              }
            }; break;
          }
        }
      };
      parent.addListener('message', listener);

      if (typeof(code) === 'function') {
        code = `(${String(code)})(this)`;
      }
      try {
        await this.sendIPC(ClusterIPCOpCodes.EVAL, {code, nonce}, true);
      } catch(error) {
        parent.removeListener('message', listener);
        reject(error);
      }
    });
  }
}
