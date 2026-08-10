import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface ThresholdAlertEmailParams {
  to: string;
  thresholdLabel: string;
  parameter: string;
  operator: string;
  thresholdValue: number;
  currentValue: number;
  timestamp: Date;
}

export async function sendThresholdAlertEmail({
  to,
  thresholdLabel,
  parameter,
  operator,
  thresholdValue,
  currentValue,
  timestamp,
}: ThresholdAlertEmailParams) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Space Weather Alerts <onboarding@resend.dev>",
      to: [to],
      subject: `⚠️ Space Weather Alert: ${thresholdLabel || `${parameter} ${operator} ${thresholdValue}`} Breached`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Space Weather Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #00ff88; margin: 0 0 20px 0; font-size: 24px;">⚠️ Space Weather Alert</h1>
            <p style="color: #a0a0a0; margin: 0; font-size: 16px;">Your threshold has been breached</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px;">${thresholdLabel || "Threshold Alert"}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666; font-weight: bold;">Parameter</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${parameter}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666; font-weight: bold;">Threshold</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd;">${operator} ${thresholdValue}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #666; font-weight: bold;">Current Value</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #ddd; color: #ff6b6b; font-weight: bold;">${currentValue}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: bold;">Time</td>
                <td style="padding: 10px 0;">${timestamp.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alerts" 
               style="display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Full Alert Details
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
            You're receiving this email because you enabled email alerts for your space weather thresholds.
            <br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alerts" style="color: #00ff88;">Manage your alert settings</a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
