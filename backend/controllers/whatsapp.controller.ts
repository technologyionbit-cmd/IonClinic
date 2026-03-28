import type { Request, Response } from 'express';
import { whatsappStatus, currentQR, sendWhatsAppMessage } from '../services/whatsapp.service.js';

// 1. Get Status
export const getWhatsAppStatus = (req: Request, res: Response) => {
  res.json({
    status: whatsappStatus,
    qr: currentQR
  });
};

// 2. Add this new function to send a message
export const sendMessage = async (req: Request, res: Response) => {
  const { phone, message } = req.body;

  // Basic validation
  if (!phone || !message) {
    return res.status(400).json({ message: 'Phone number and message are required' });
  }

  // Ensure WhatsApp is actually connected before trying to send
  if (whatsappStatus !== 'CONNECTED') {
    return res.status(400).json({ message: 'WhatsApp is not connected' });
  }

  try {
    const success = await sendWhatsAppMessage(phone, message);

    if (success) {
      res.json({ message: 'Message sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send message via WhatsApp' });
    }
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ message: 'Internal server error while sending message' });
  }
};