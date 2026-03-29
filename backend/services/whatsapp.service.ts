// typescript
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs'; // 🚨 NEW: Import the File System module

export let whatsappStatus = 'DISCONNECTED'; 
export let currentQR = '';

// 🚨 NEW: This function scans the computer to find where Chrome or Edge is installed
function getBrowserExecutablePath() {
  const browserPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const path of browserPaths) {
    if (fs.existsSync(path)) {
      console.log(`✅ Browser found at: ${path}`);
      return path;
    }
  }
  
  console.log('❌ No standard browser found!');
  return undefined; 
}

export const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    headless: true, 
    executablePath: getBrowserExecutablePath(), // 🚨 Uses the radar function!
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', 
      '--disable-gpu',           
      '--no-zygote'
    ] 
  }
});

whatsappClient.on('qr', (qr) => {
  console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP 📱');
  qrcode.generate(qr, { small: true }); 
  currentQR = qr;
  whatsappStatus = 'QR_READY';
});

whatsappClient.on('authenticated', () => {
  console.log('🔐 WhatsApp Authenticated! Loading chats...');
  whatsappStatus = 'AUTHENTICATING';
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp Client is connected and ready!');
  currentQR = '';
  whatsappStatus = 'CONNECTED';
});

whatsappClient.on('disconnected', (reason) => {
  console.log('❌ WhatsApp disconnected:', reason);
  whatsappStatus = 'DISCONNECTED';
});

export const initWhatsApp = () => {
  // 🚨 NEW: Added .catch() to log any hidden crashes
  whatsappClient.initialize().catch(err => {
    console.error('🚨 WhatsApp Initialization Failed:', err);
  });
};

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  try {
    let cleanPhone = phone.replace(/[\+\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.substring(2);
    } 
    const formattedPhone = cleanPhone + '@c.us';
    
    await whatsappClient.sendMessage(formattedPhone, message);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send message to ${phone}:`, error);
    return false;
  }
};