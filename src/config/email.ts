import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Email Configuration
 * Supports Gmail and custom SMTP configurations
 */
export const getEmailConfig = (): EmailConfig => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
  }

  if (emailService === 'gmail') {
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword, // Use app-specific password for Gmail
      },
    };
  } else {
    // Custom SMTP configuration
    const host = process.env.EMAIL_HOST || 'localhost';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = process.env.EMAIL_SECURE === 'true';

    return {
      host,
      port,
      secure,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    };
  }
};

/**
 * Create and configure nodemailer transporter
 */
export const createEmailTransporter = () => {
  try {
    const config = getEmailConfig();
    // Force IPv4 to avoid IPv6 connectivity issues
    const transporterConfig = {
      ...config,
      family: 4, // Force IPv4
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 5000, // 5 seconds greeting timeout
    };
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection configuration
    transporter.verify((error: Error | null, success?: boolean) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('Email transporter is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    logger.error('Failed to create email transporter:', error);
    throw error;
  }
};

/**
 * Email sender configuration
 */
export const getEmailSender = (): string => {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@k2arental.com';
};

/**
 * Admin notification email addresses
 */
export const getAdminEmails = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  return adminEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
};
