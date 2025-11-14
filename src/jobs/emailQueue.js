const Queue = require('bull');

// Create email queue with Redis connection
let emailQueue = null;
let queueReady = false;

try {
  emailQueue = new Queue('emailQueue', {
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false
    }
  });

  /**
   * Job processor - handles sending emails in background
   * @param {Object} job - Bull job object
   */
  emailQueue.process(async (job) => {
    const { userId, message, type, meta, notificationId } = job.data;

    try {
      console.log(`[EmailQueue] Processing job ${job.id}: userId=${userId}, type=${type}`);

      // TODO: Replace with actual email sending logic (Nodemailer, SendGrid, etc.)
      // For now, we simulate the email sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`[EmailQueue] ✅ Email sent for notification ${notificationId}`);
      return { success: true, notificationId, message: 'Email sent successfully' };
    } catch (error) {
      console.error(`[EmailQueue] ❌ Error processing job ${job.id}:`, error.message);
      throw error;
    }
  });

  // Event listeners
  emailQueue.on('completed', (job) => {
    console.log(`[EmailQueue] Job ${job.id} completed successfully`);
  });

  emailQueue.on('failed', (job, err) => {
    console.error(`[EmailQueue] Job ${job.id} failed:`, err.message);
  });

  emailQueue.on('error', (err) => {
    console.warn('[EmailQueue] ⚠️ Queue error:', err.message);
  });

  emailQueue.on('ready', () => {
    queueReady = true;
    console.log('[EmailQueue] ✅ Queue is ready (Redis connected)');
  });

  emailQueue.on('closed', () => {
    queueReady = false;
    console.log('[EmailQueue] Queue closed');
  });
} catch (err) {
  console.warn('[EmailQueue] ⚠️ Failed to initialize queue:', err.message);
  console.log('[EmailQueue] 📝 Notifications will still be created, but email queue will not process jobs');
  emailQueue = null;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[EmailQueue] Closing queue on SIGTERM');
  if (emailQueue) {
    await emailQueue.close();
  }
  process.exit(0);
});

module.exports = { emailQueue, queueReady };
