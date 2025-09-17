import nodemailer from 'nodemailer';
import { createEmailTransporter, getEmailSender, getAdminEmails } from '@/config/email';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface RentRequestEmailData {
  requestId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  startDate: string;
  endDate: string;
  pricePerDay: number;
  currency: string;
  message?: string;
  adminNotes?: string;
  status?: string;
}

/**
 * Email Service for sending rent request notifications
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private emailFrom: string;
  private adminEmails: string[];

  constructor() {
    this.emailFrom = getEmailSender();
    this.adminEmails = getAdminEmails();
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = createEmailTransporter();
    }
    return this.transporter;
  }

  /**
   * Load email template from file
   */
  private loadTemplate(templateName: string): string {
    try {
      const templatePath = path.join(__dirname, '../../email-templates', `${templateName}.html`);
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, error);
      return this.getFallbackTemplate(templateName);
    }
  }

  /**
   * Get fallback template if file template is not available
   */
  private getFallbackTemplate(templateName: string): string {
    const templates: Record<string, string> = {
      'client-confirmation': `
        <h1>Demande de location reçue</h1>
        <p>Bonjour {{clientName}},</p>
        <p>Nous avons bien reçu votre demande de location avec les détails suivants :</p>
        <ul>
          <li><strong>Véhicule :</strong> {{vehicleMake}} {{vehicleModel}} ({{vehicleYear}})</li>
          <li><strong>Dates :</strong> Du {{startDate}} au {{endDate}}</li>
          <li><strong>Prix par jour :</strong> {{pricePerDay}} {{currency}}</li>
          <li><strong>Numéro de demande :</strong> {{requestId}}</li>
        </ul>
        <p>Nous examinerons votre demande et vous contacterons sous 24 heures.</p>
        <p>Cordialement,<br>L'équipe K2A Rental</p>
      `,
      'admin-notification': `
        <h1>Nouvelle demande de location</h1>
        <p>Une nouvelle demande de location a été soumise :</p>
        <ul>
          <li><strong>Client :</strong> {{clientName}} ({{clientEmail}})</li>
          <li><strong>Téléphone :</strong> {{clientPhone}}</li>
          <li><strong>Véhicule :</strong> {{vehicleMake}} {{vehicleModel}} ({{vehicleYear}})</li>
          <li><strong>Dates :</strong> Du {{startDate}} au {{endDate}}</li>
          <li><strong>Prix par jour :</strong> {{pricePerDay}} {{currency}}</li>
          <li><strong>Numéro de demande :</strong> {{requestId}}</li>
        </ul>
        {{#message}}<p><strong>Message du client :</strong><br>{{message}}</p>{{/message}}
      `,
      'status-approved': `
        <h1>Demande de location approuvée</h1>
        <p>Bonjour {{clientName}},</p>
        <p>Bonne nouvelle ! Votre demande de location a été <strong>approuvée</strong>.</p>
        <ul>
          <li><strong>Véhicule :</strong> {{vehicleMake}} {{vehicleModel}} ({{vehicleYear}})</li>
          <li><strong>Dates :</strong> Du {{startDate}} au {{endDate}}</li>
          <li><strong>Numéro de demande :</strong> {{requestId}}</li>
        </ul>
        {{#adminNotes}}<p><strong>Notes :</strong><br>{{adminNotes}}</p>{{/adminNotes}}
        <p>Nous vous contactons bientôt pour finaliser les détails.</p>
        <p>Cordialement,<br>L'équipe K2A Rental</p>
      `,
      'status-rejected': `
        <h1>Demande de location - Mise à jour</h1>
        <p>Bonjour {{clientName}},</p>
        <p>Nous vous remercions pour votre demande de location. Malheureusement, nous ne pouvons pas donner suite à votre demande pour les raisons suivantes :</p>
        {{#adminNotes}}<p><strong>Raison :</strong><br>{{adminNotes}}</p>{{/adminNotes}}
        <ul>
          <li><strong>Véhicule :</strong> {{vehicleMake}} {{vehicleModel}} ({{vehicleYear}})</li>
          <li><strong>Dates :</strong> Du {{startDate}} au {{endDate}}</li>
          <li><strong>Numéro de demande :</strong> {{requestId}}</li>
        </ul>
        <p>N'hésitez pas à nous contacter pour d'autres disponibilités.</p>
        <p>Cordialement,<br>L'équipe K2A Rental</p>
      `,
      'status-contacted': `
        <h1>Demande de location - Contact en cours</h1>
        <p>Bonjour {{clientName}},</p>
        <p>Votre demande de location est en cours de traitement et nous vous contactons prochainement.</p>
        <ul>
          <li><strong>Véhicule :</strong> {{vehicleMake}} {{vehicleModel}} ({{vehicleYear}})</li>
          <li><strong>Dates :</strong> Du {{startDate}} au {{endDate}}</li>
          <li><strong>Numéro de demande :</strong> {{requestId}}</li>
        </ul>
        {{#adminNotes}}<p><strong>Notes :</strong><br>{{adminNotes}}</p>{{/adminNotes}}
        <p>Cordialement,<br>L'équipe K2A Rental</p>
      `
    };

    return templates[templateName] || '<p>Modèle d\'email non trouvé</p>';
  }

  /**
   * Replace template variables with actual data
   */
  private populateTemplate(template: string, data: RentRequestEmailData): string {
    let populatedTemplate = template;

    // Replace all template variables
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      populatedTemplate = populatedTemplate.replace(regex, String(value || ''));
    });

    // Handle conditional blocks (simple implementation)
    // Remove empty conditional blocks
    populatedTemplate = populatedTemplate.replace(/{{#\w+}}[\s\S]*?{{\/\w+}}/g, (match) => {
      const conditionMatch = match.match(/{{#(\w+)}}/);
      if (conditionMatch) {
        const field = conditionMatch[1];
        return data[field as keyof RentRequestEmailData] ? match.replace(/{{#\w+}}|{{\/\w+}}/g, '') : '';
      }
      return '';
    });

    return populatedTemplate;
  }

  /**
   * Send client confirmation email
   */
  async sendClientConfirmation(data: RentRequestEmailData): Promise<void> {
    try {
      const template = this.loadTemplate('client-confirmation');
      const html = this.populateTemplate(template, data);

      const mailOptions = {
        from: this.emailFrom,
        to: data.clientEmail,
        subject: `Confirmation de demande de location - ${data.requestId}`,
        html,
        text: `Votre demande de location ${data.requestId} pour ${data.vehicleMake} ${data.vehicleModel} a été reçue.`
      };

      const result = await this.getTransporter().sendMail(mailOptions);
      logger.info('Client confirmation email sent', {
        requestId: data.requestId,
        clientEmail: data.clientEmail,
        messageId: result.messageId
      });
    } catch (error) {
      logger.error('Failed to send client confirmation email', {
        requestId: data.requestId,
        clientEmail: data.clientEmail,
        error
      });
      throw error;
    }
  }

  /**
   * Send admin notification email
   */
  async sendAdminNotification(data: RentRequestEmailData): Promise<void> {
    try {
      if (this.adminEmails.length === 0) {
        logger.warn('No admin emails configured, skipping admin notification');
        return;
      }

      const template = this.loadTemplate('admin-notification');
      const html = this.populateTemplate(template, data);

      const mailOptions = {
        from: this.emailFrom,
        to: this.adminEmails,
        subject: `Nouvelle demande de location - ${data.requestId}`,
        html,
        text: `Nouvelle demande de ${data.clientName} pour ${data.vehicleMake} ${data.vehicleModel}`
      };

      const result = await this.getTransporter().sendMail(mailOptions);
      logger.info('Admin notification email sent', {
        requestId: data.requestId,
        adminEmails: this.adminEmails,
        messageId: result.messageId
      });
    } catch (error) {
      logger.error('Failed to send admin notification email', {
        requestId: data.requestId,
        error
      });
      throw error;
    }
  }

  /**
   * Send status update email to client
   */
  async sendStatusUpdate(data: RentRequestEmailData): Promise<void> {
    try {
      const status = data.status?.toLowerCase();
      if (!status || !['approved', 'rejected', 'contacted'].includes(status)) {
        logger.warn('Invalid status for email notification', { status, requestId: data.requestId });
        return;
      }

      const template = this.loadTemplate(`status-${status}`);
      const html = this.populateTemplate(template, data);

      const subjects = {
        approved: 'Demande de location approuvée',
        rejected: 'Mise à jour de votre demande de location',
        contacted: 'Votre demande de location est en cours de traitement'
      };

      const mailOptions = {
        from: this.emailFrom,
        to: data.clientEmail,
        subject: `${subjects[status as keyof typeof subjects]} - ${data.requestId}`,
        html,
        text: `Mise à jour pour votre demande ${data.requestId}: ${status}`
      };

      const result = await this.getTransporter().sendMail(mailOptions);
      logger.info('Status update email sent', {
        requestId: data.requestId,
        clientEmail: data.clientEmail,
        status,
        messageId: result.messageId
      });
    } catch (error) {
      logger.error('Failed to send status update email', {
        requestId: data.requestId,
        status: data.status,
        error
      });
      throw error;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
