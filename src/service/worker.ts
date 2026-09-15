import { parentPort } from 'node:worker_threads';
import { getAvailability } from './operations';

parentPort?.on('message', () => {
  try {
    parentPort?.postMessage(getAvailability());
  } catch {
    parentPort?.postMessage({
      status: 'unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Yerel hizmet başlatılamadı. Uygulamayı yeniden açın.',
    });
  }
});
