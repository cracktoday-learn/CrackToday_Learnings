import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "notifications@cracktoday.com";

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get notification data from request
    const { notification } = await req.json();
    
    if (!notification) {
      return new Response(
        JSON.stringify({ error: "No notification data provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Only send emails for active notifications
    if (!notification.is_active) {
      return new Response(
        JSON.stringify({ message: "Notification is inactive, skipping email" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch all user emails from profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("email, name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user emails" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const users = profiles || [];
    
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found to email" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare email content based on notification type
    const getTypeStyles = (type: string) => {
      switch (type) {
        case "urgent": return { color: "#dc2626", icon: "🔴" };
        case "warning": return { color: "#d97706", icon: "⚠️" };
        case "success": return { color: "#059669", icon: "✅" };
        default: return { color: "#4f46e5", icon: "ℹ️" };
      }
    };

    const typeStyle = getTypeStyles(notification.type);

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    const results = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (user: any) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `CrackToday <${FROM_EMAIL}>`,
              to: user.email,
              subject: `${typeStyle.icon} ${notification.title}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${notification.title}</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
                    <tr>
                      <td align="center" style="padding: 40px 20px;">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                          <!-- Header -->
                          <tr>
                            <td style="background-color: ${typeStyle.color}; padding: 30px; text-align: center;">
                              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                                ${typeStyle.icon} CrackToday Notification
                              </h1>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 30px;">
                              <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px; font-weight: bold;">
                                ${notification.title}
                              </h2>
                              <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                ${notification.message}
                              </p>
                              
                              <div style="margin-top: 25px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid ${typeStyle.color};">
                                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Type: ${notification.type.toUpperCase()}
                                </p>
                              </div>
                            </td>
                          </tr>
                          
                          <!-- CTA -->
                          <tr>
                            <td style="padding: 0 30px 30px 30px; text-align: center;">
                              <a href="https://cracktoday.vercel.app/dashboard" 
                                 style="display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Go to Dashboard
                              </a>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="padding: 20px 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                You're receiving this because you're enrolled at CrackToday.<br>
                                © 2024 CrackToday. All rights reserved.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
              `,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error(`Failed to send email to ${user.email}:`, error);
            return { email: user.email, success: false, error };
          }

          return { email: user.email, success: true };
        } catch (err) {
          console.error(`Error sending email to ${user.email}:`, err);
          return { email: user.email, success: false, error: err.message };
        }
      });

      const batchResults = await Promise.all(emailPromises);
      results.push(...batchResults);
      
      // Add small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Email sending complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails sent: ${successful} successful, ${failed} failed`,
        totalUsers: users.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
