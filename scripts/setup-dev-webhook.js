#!/usr/bin/env node

/**
 * Script to set up a development webhook URL for Every.org testing
 * This script will:
 * 1. Check if ngrok is installed
 * 2. Start ngrok if available
 * 3. Generate an email template to send to Every.org
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Function to check if ngrok is installed
function checkNgrok() {
  if (commandExists('ngrok')) {
    console.log('✅ ngrok is installed');
    return true;
  } else {
    console.log('❌ ngrok is not installed');
    console.log('Please install ngrok with: npm install -g ngrok');
    return false;
  }
}

// Function to start ngrok
function startNgrok(port = 3000) {
  console.log(`Starting ngrok tunnel to localhost:${port}...`);
  
  const ngrok = spawn('ngrok', ['http', port.toString()]);
  
  ngrok.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Extract the ngrok URL when it becomes available
    const urlMatch = output.match(/(https:\/\/[a-z0-9]+\.ngrok\.io)/);
    if (urlMatch && urlMatch[1]) {
      const ngrokUrl = urlMatch[1];
      console.log('\n====================================');
      console.log(`🚀 ngrok tunnel established: ${ngrokUrl}`);
      console.log('====================================\n');
      
      // Generate email template for Every.org
      generateEmailTemplate(ngrokUrl);
    }
  });
  
  ngrok.stderr.on('data', (data) => {
    console.error(`ngrok error: ${data}`);
  });
  
  ngrok.on('close', (code) => {
    console.log(`ngrok process exited with code ${code}`);
  });
  
  console.log('Press Ctrl+C to stop ngrok');
}

// Function to generate an email template
function generateEmailTemplate(ngrokUrl) {
  const webhookUrl = `${ngrokUrl}/api/webhooks/every-org`;
  
  console.log('\n==== EMAIL TEMPLATE FOR EVERY.ORG SUPPORT ====\n');
  console.log('Subject: Request to register development webhook URL for staging environment');
  console.log('\nHello Every.org Partners team,');
  console.log('\nAs discussed, I would like to test the webhook integration with your staging environment.');
  console.log('Please register the following development webhook URL with your staging environment:');
  console.log(`\n${webhookUrl}\n`);
  console.log('This will allow me to test the complete donation flow, including webhook callbacks, in the staging environment without spending real money.');
  console.log('\nMy webhook implementation is ready to receive callbacks at this URL.');
  console.log('\nThank you for your assistance,');
  console.log('[Your Name]');
  console.log('\n====================================\n');
  
  console.log('Copy the above email template and send it to Every.org support.');
  console.log('Once they confirm your webhook is registered, you can test the full donation flow.');
}

// Main function
async function main() {
  console.log('==== Every.org Development Webhook Setup ====');
  
  // Check if ngrok is installed
  if (!checkNgrok()) {
    return;
  }
  
  // Ask which port to use
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Which port is your Next.js server running on? (default: 3000) ', (answer) => {
    const port = parseInt(answer, 10) || 3000;
    rl.close();
    
    // Start ngrok with the specified port
    startNgrok(port);
  });
}

// Run the main function
main().catch(console.error);
