declare module 'smtp-server' {
  import { EventEmitter } from 'events';
  import { TLSSocket } from 'tls';
  import { Socket } from 'net';

  export interface SMTPServerAddress {
    address: string;
    args?: { [key: string]: string | boolean };
  }

  export interface SMTPServerSession {
    id: string;
    remoteAddress: string;
    clientHostname: string;
    envelope: {
      mailFrom: SMTPServerAddress;
      rcptTo: SMTPServerAddress[];
    };
    user?: any;
    secure: boolean;
  }

  export interface SMTPServerOptions {
    banner?: string;
    logger?: boolean | any;
    authOptional?: boolean;
    size?: number;
    onConnect?: (session: SMTPServerSession, callback: (error?: Error) => void) => void;
    onAuth?: (auth: any, session: SMTPServerSession, callback: (error?: Error | null, response?: any) => void) => void;
    onMailFrom?: (address: SMTPServerAddress, session: SMTPServerSession, callback: (error?: Error) => void) => void;
    onRcptTo?: (address: SMTPServerAddress, session: SMTPServerSession, callback: (error?: Error) => void) => void;
    onData?: (stream: any, session: SMTPServerSession, callback: (error?: Error | null, message?: string) => void) => void;
    onClose?: (session: SMTPServerSession) => void;
  }

  export class SMTPServer extends EventEmitter {
    constructor(options?: SMTPServerOptions);
    listen(port: number, hostname?: string, callback?: (error?: Error) => void): void;
    close(callback?: () => void): void;
  }
}

declare module 'mailparser' {
  export interface ParsedMail {
    messageId?: string;
    subject?: string;
    from?: {
      value: Array<{ address: string; name?: string }>;
      text: string;
    };
    to?: {
      value: Array<{ address: string; name?: string }>;
      text: string;
    };
    text?: string;
    html?: string;
    headers?: Map<string, string | string[]>;
    attachments?: Array<{
      filename?: string;
      contentType?: string;
      size: number;
      cid?: string;
    }>;
  }

  export function simpleParser(source: Buffer | string): Promise<ParsedMail>;
}
