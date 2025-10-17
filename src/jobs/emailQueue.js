const Queue = require('bull');

// نعمل Queue جديدة اسمها emailQueue
const emailQueue = new Queue('emailQueue', {
  redis: { host: '127.0.0.1', port: 6379 }
});

// Job Processor - الوظيفة اللي هتتنفذ في الخلفية
emailQueue.process(async (job) => {
  console.log(`📨 Sending email to: ${job.data.email}`);
  await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate delay
  console.log('✅ Email sent successfully!');
});

//  لما تضيف Job
emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

module.exports = emailQueue;
