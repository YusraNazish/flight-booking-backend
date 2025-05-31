const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION });

const sns = new AWS.SNS();

// 1. Route to publish message to SNS
app.post('/FlightBookingSystem', async (req, res) => {
  const { name, email, password, from, to, date } = req.body;

  const params = {
    Message: `New flight booking:\nName: ${name}\nEmail: ${email}\nFrom: ${from}\nTo: ${to}\nDate: ${date}`,
    Subject: 'New Flight Booking',
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:YourSNSTopicName' // Replace with actual ARN
  };

  try {
    const data = await sns.publish(params).promise();
    console.log('✅ SNS publish success:', data);
    res.status(200).json({ message: 'Booking successful, notification sent.' });
  } catch (err) {
    console.error('❌ SNS publish error:', err);
    res.status(500).json({ message: 'Booking successful but failed to send notification.' });
  }
});

// 2. Route to receive SNS notifications
app.post('/sns/notify', (req, res) => {
  console.log('📨 SNS Notification Received:', req.body);

  // Handle SNS subscription confirmation
  if (req.body.Type === 'SubscriptionConfirmation' && req.body.SubscribeURL) {
    console.log('🔗 Confirming subscription...');
    https.get(req.body.SubscribeURL, (response) => {
      console.log('✅ Subscription confirmed');
    });
  }

  // You can handle notifications here
  if (req.body.Type === 'Notification') {
    console.log('📢 SNS Message:', req.body.Message);
  }

  res.sendStatus(200);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
