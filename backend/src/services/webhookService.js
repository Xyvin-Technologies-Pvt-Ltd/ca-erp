const axios = require('axios');
const { logger } = require('../utils/logger');

class WebhookService {
    constructor() {
        this.webhookUrl = process.env.REMINDER_WEBHOOK_URL;
        this.timeout = parseInt(process.env.REMINDER_WEBHOOK_TIMEOUT) || 30000;
        
        if (!this.webhookUrl) {
            logger.error('REMINDER_WEBHOOK_URL not configured in environment variables');
        }
    }

    /**
     * Send client reminder through webhook
     * @param {Object} reminderData - Data for the reminder
     * @returns {Promise<Object>} Webhook response
     */
    async sendClientReminder(reminderData) {
        try {
            if (!this.webhookUrl) {
                throw new Error('Webhook URL not configured');
            }

            const payload = {
                clientName: reminderData.clientName,
                phoneNumber: reminderData.phoneNumber,
                documentName: reminderData.documentName,
                tag: reminderData.tag,
                documentType: reminderData.documentType,
                reminderSentBy: reminderData.reminderSentBy,
                reminderSentAt: new Date().toISOString()
            };

            logger.info('Sending client reminder webhook', {
                clientName: payload.clientName,
                phoneNumber: payload.phoneNumber,
                documentName: payload.documentName,
                sentBy: payload.reminderSentBy
            });

            const response = await axios.post(this.webhookUrl, payload, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            logger.info('Client reminder webhook sent successfully', {
                status: response.status,
                clientName: payload.clientName
            });

            return {
                success: true,
                status: response.status,
                data: response.data
            };

        } catch (error) {
            logger.error('Failed to send client reminder webhook', {
                error: error.message,
                clientName: reminderData?.clientName,
                phoneNumber: reminderData?.phoneNumber,
                stack: error.stack
            });

            if (error.code === 'ECONNABORTED') {
                throw new Error('Webhook request timed out');
            } else if (error.response) {
                throw new Error(`Webhook responded with status ${error.response.status}: ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('No response received from webhook');
            } else {
                throw new Error(`Webhook request failed: ${error.message}`);
            }
        }
    }
}

module.exports = new WebhookService(); 