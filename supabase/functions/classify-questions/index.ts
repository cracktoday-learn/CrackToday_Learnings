// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const UPSC_SUBJECTS = [
  "Polity",
  "Economy", 
  "History",
  "Geography",
  "Science & Technology",
  "Environment",
  "Current Affairs",
  "International Relations",
  "Art & Culture",
  "Governance",
  "Social Issues",
  "Ethics",
  "General"
];

interface Question {
  id: string;
  question: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch questions without subject
    console.log("Fetching questions without subject classification...");
    const { data: questions, error } = await supabase
      .from("questions")
      .select("id, question")
      .is("subject", null)
      .limit(50);

    if (error) {
      throw error;
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No unclassified questions found",
          classified: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Found ${questions.length} questions to classify`);

    // Classify each question using AI
    const classifiedQuestions: { id: string; subject: string }[] = [];

    for (const q of questions) {
      const subject = await classifyQuestion(q.question);
      if (subject) {
        classifiedQuestions.push({ id: q.id, subject });
      }
      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update database with classified subjects
    if (classifiedQuestions.length > 0) {
      console.log(`Updating ${classifiedQuestions.length} questions with subjects...`);
      
      for (const item of classifiedQuestions) {
        const { error: updateError } = await supabase
          .from("questions")
          .update({ subject: item.subject })
          .eq("id", item.id);
        
        if (updateError) {
          console.error(`Failed to update question ${item.id}:`, updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Classified ${classifiedQuestions.length} questions`,
        data: classifiedQuestions.slice(0, 5), // Return first 5 for preview
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in classify-questions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function classifyQuestion(questionText: string): Promise<string | null> {
  const key = GROQ_API_KEY;
  if (!key) {
    console.error("GROQ_API_KEY not set");
    return null;
  }

  const prompt = `Classify this UPSC/SSC/Competitive exam question into ONE specific subject category.

Available subjects:
- Polity (Constitution, Parliament, Governance, Rights)
- Economy (GDP, Banking, Fiscal policy, Budget, Inflation)
- History (Ancient, Medieval, Modern India, World History)
- Geography (Physical, Indian, World, Maps, Climate)
- Science & Technology (Physics, Chemistry, Biology, Space, Tech)
- Environment (Ecology, Biodiversity, Climate Change, Conservation)
- Current Affairs (Recent events, Policies, Schemes)
- International Relations (Foreign policy, Diplomacy, UN, Organizations)
- Art & Culture (Heritage, Literature, Festivals, Architecture)
- Governance (Administration, Public Policy, Schemes)
- Social Issues (Poverty, Education, Health, Women, Caste)
- Ethics (Philosophy, Integrity, Moral values)

Question: "${questionText.slice(0, 500)}"

Respond with ONLY the subject name (exactly as listed above), nothing else.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are an expert UPSC exam subject classifier. Classify questions accurately into one subject category. Respond with only the subject name."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content?.trim();

    if (content) {
      // Validate and match to known subjects
      const normalized = content.replace(/[.,]/g, "").trim();
      const matched = UPSC_SUBJECTS.find(s => 
        normalized.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(normalized.toLowerCase())
      );
      return matched || "General";
    }
  } catch (error) {
    console.error(`Classification error: ${error.message}`);
  }

  return "General";
}
