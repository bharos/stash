// This endpoint is used for testing webhook functionality in the staging environment

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Log environment information for debugging
    console.log(`========== Staging Webhook Test ==========`);
    console.log(`Environment: ${process.env.NODE_ENV || 'unknown'}`);
    console.log(`Vercel Environment: ${process.env.VERCEL_ENV || 'not on Vercel'}`);
    console.log(`Deployment URL: ${process.env.VERCEL_URL || 'unknown'}`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Log the full request for debugging
    console.log('Webhook request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Webhook request body:', JSON.stringify(req.body, null, 2));
    
    // Verify webhook token from Every.org
    const webhookToken = process.env.EVERY_ORG_WEBHOOK_TOKEN;
    const authHeader = req.headers.authorization;
    
    if (!webhookToken) {
      console.error('Missing EVERY_ORG_WEBHOOK_TOKEN environment variable');
      return res.status(500).json({ error: 'Server configuration error: Missing webhook token' });
    }
    
    if (!authHeader || authHeader !== `Bearer ${webhookToken}`) {
      console.error('Invalid token in Authorization header');
      return res.status(401).json({ error: 'Invalid webhook token' });
    }
    
    console.log('Webhook token validated successfully');
    
    // Process the webhook payload if needed for testing
    return res.status(200).json({ 
      success: true, 
      message: 'Staging webhook test received successfully',
      receivedData: {
        event: req.body.event,
        reference: req.body.data?.reference,
        status: req.body.data?.status
      }
    });
    
  } catch (error) {
    console.error('Error processing test webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
