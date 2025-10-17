import { supabase } from "@/integrations/supabase/client";
import { NotificationPayload } from "./notificationService";

export class EmailNotificationService {
  /**
   * Send email notification using Supabase Auth
   */
  static async sendEmailNotification(
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get recipient email addresses
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .in("id", payload.recipients);

      if (profileError || !profiles) {
        throw new Error("Failed to fetch recipient emails");
      }

      const emails = profiles.map((p) => p.email).filter(Boolean);

      if (emails.length === 0) {
        return { success: false, error: "No valid email addresses found" };
      }

      // Format email content
      const emailContent = this.formatEmailContent(payload);

      // Send emails using Supabase Edge Function or external email service
      // For now, log the email that would be sent
      console.log("Email notification to:", emails);
      console.log("Email content:", emailContent);

      // TODO: Implement actual email sending via:
      // 1. Supabase Edge Function with SendGrid/Mailgun/Resend
      // 2. Direct API call to email provider
      // 3. Supabase Auth email templates (for specific cases)

      return { success: true };
    } catch (error: any) {
      console.error("Error sending email notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format email HTML content with branding
   */
  static formatEmailContent(payload: NotificationPayload): string {
    const {
      title,
      message,
      actions = [],
      metadata = {},
      educationalContext,
    } = payload;

    const baseUrl = window.location.origin;
    const ticketUrl = metadata.ticketId
      ? `${baseUrl}/tickets/${metadata.ticketId}`
      : `${baseUrl}/dashboard`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .notification-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 15px;
    }
    .notification-message {
      font-size: 16px;
      color: #555;
      margin-bottom: 20px;
    }
    .educational-context {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .educational-context p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
    .actions {
      margin: 25px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 5px 5px 5px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 EduTicket AI</h1>
    </div>
    
    <div class="content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
      
      ${
        educationalContext?.academicLevel || metadata.courseCode
          ? `
      <div class="educational-context">
        <strong>📚 Educational Context:</strong>
        ${metadata.courseCode ? `<p><strong>Course:</strong> ${metadata.courseCode}</p>` : ""}
        ${educationalContext?.academicLevel ? `<p><strong>Level:</strong> ${educationalContext.academicLevel}</p>` : ""}
        ${educationalContext?.deadline ? `<p><strong>Deadline:</strong> ${new Date(educationalContext.deadline).toLocaleDateString()}</p>` : ""}
      </div>
      `
          : ""
      }
      
      <div class="actions">
        ${
          actions.length > 0
            ? actions
                .map(
                  (action) =>
                    `<a href="${baseUrl}${action.url}" class="button">${action.label}</a>`
                )
                .join("")
            : `<a href="${ticketUrl}" class="button">View Ticket</a>`
        }
      </div>
    </div>
    
    <div class="footer">
      <p>
        You received this notification from EduTicket AI - FPT University<br>
        <a href="${baseUrl}/notifications">Manage notification preferences</a>
      </p>
      <p style="margin-top: 10px; font-size: 12px; color: #999;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get email template for specific notification type
   */
  static getEmailTemplate(
    type: string,
    context: Record<string, any>
  ): { subject: string; html: string } {
    // Reusable templates for different notification types
    const templates: Record<string, (ctx: any) => { subject: string; html: string }> = {
      ticket_assigned: (ctx) => ({
        subject: `[EduTicket] New Ticket Assigned: ${ctx.ticketTitle}`,
        html: this.formatEmailContent({
          type: "ticket_assigned",
          title: "New Ticket Assigned",
          message: `You have been assigned to ticket "${ctx.ticketTitle}" for ${ctx.courseCode || "your course"}.`,
          recipients: [],
          metadata: ctx,
          actions: [
            { label: "View Ticket", url: `/tickets/${ctx.ticketId}` },
            { label: "View Dashboard", url: "/dashboard" },
          ],
        }),
      }),
      comment_added: (ctx) => ({
        subject: `[EduTicket] New Comment on: ${ctx.ticketTitle}`,
        html: this.formatEmailContent({
          type: "comment_added",
          title: "New Comment Added",
          message: `${ctx.userName} commented on your ticket "${ctx.ticketTitle}".`,
          recipients: [],
          metadata: ctx,
          actions: [{ label: "View Comment", url: `/tickets/${ctx.ticketId}` }],
        }),
      }),
      ticket_resolved: (ctx) => ({
        subject: `[EduTicket] Ticket Resolved: ${ctx.ticketTitle}`,
        html: this.formatEmailContent({
          type: "ticket_resolved",
          title: "Ticket Resolved",
          message: `Your ticket "${ctx.ticketTitle}" has been marked as resolved. Please provide feedback if the solution was helpful.`,
          recipients: [],
          metadata: ctx,
          actions: [
            { label: "View Resolution", url: `/tickets/${ctx.ticketId}` },
            { label: "Provide Feedback", url: `/tickets/${ctx.ticketId}#feedback` },
          ],
        }),
      }),
    };

    const template = templates[type];
    return template
      ? template(context)
      : {
          subject: "[EduTicket] Notification",
          html: this.formatEmailContent({
            type: type as any,
            title: "Notification",
            message: "You have a new notification from EduTicket AI.",
            recipients: [],
            metadata: context,
          }),
        };
  }
}

