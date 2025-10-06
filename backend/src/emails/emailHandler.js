import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    console.log('Attempting to send welcome email to:', email);
    console.log('Using sender:', sender);
    
    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to YapYap!",
      html: createWelcomeEmailTemplate(name, clientURL),
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(`Failed to send welcome email: ${error.message || error}`);
    }

    console.log("Welcome Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};