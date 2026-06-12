import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = (window as any).Buffer || Buffer;
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
}
