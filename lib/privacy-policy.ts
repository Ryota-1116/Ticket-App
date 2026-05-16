export function generatePrivacyPolicy(_hostName: string, eventTitle: string): string {
  return `Privacy Policy

This privacy policy explains how we collect, use, and protect your personal information when you purchase tickets for ${eventTitle}.

1. Information We Collect
We collect personal information that you provide when purchasing tickets, including your name and email address. Payment information is processed securely by Stripe and is not stored by us.

2. How We Use Your Information
We use your information to:
- Process your ticket purchase and send your tickets via email
- Send event-related communications (e.g. event reminders or changes)
- Verify your identity at the event entrance via QR code

3. Data Sharing
We do not sell or rent your personal information to third parties. Your data may be shared with:
- Stripe (payment processing)
- Resend (email delivery)

4. Data Retention
We retain your personal information for up to 1 year after the event date, after which it will be securely deleted.

5. Your Rights
You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact the event organizer directly.

6. Contact
For any privacy-related questions, please contact the event organizer directly.

Last updated: ${new Date().toLocaleDateString("en-CA")}`;
}
