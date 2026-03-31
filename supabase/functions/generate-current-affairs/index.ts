// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Exam-focused current affairs topics for UPSC/SSC/Competitive exams
const NEWS_TOPICS = [
  "Latest government schemes and welfare programs in India",
  "Important Constitutional amendments or Supreme Court judgments",
  "Union Cabinet decisions and major policy announcements",
  "Indian Defence developments - new equipment, military exercises",
  "Important appointments to constitutional and statutory bodies",
  "Major awards and honors (Padma, Nobel, Booker, etc.)",
  "International summits India participated in (G20, BRICS, etc.)",
  "Bilateral agreements with important countries",
  "Space missions and ISRO achievements",
  "Major sports achievements and tournaments",
  "Important economic indicators and RBI decisions",
  "Environmental conferences and climate change commitments",
  "Banking sector news and financial reforms",
  "Health initiatives and medical breakthroughs in India",
  "Education policy updates and exam reforms",
];

const CATEGORIES = ["schemes", "polity", "national", "defence", "appointments", "awards", "international", "bilateral", "science", "sports", "economy", "environment", "banking", "health", "education"];

interface CurrentAffair {
  title: string;
  summary: string;
  category: string;
  date: string;
  source_url?: string;
}

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear all existing current affairs (only keep today's news)
    console.log("Clearing old current affairs...");
    const { error: deleteError } = await supabase
      .from("current_affairs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

    if (deleteError) {
      console.error("Error clearing old data:", deleteError);
      throw deleteError;
    }
    console.log("Old data cleared successfully");

    // Generate current affairs using Groq
    const currentAffairs = await generateCurrentAffairs();

    // Store in database (all new data)
    const { data, error } = await supabase
      .from("current_affairs")
      .insert(currentAffairs);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated and stored ${currentAffairs.length} current affairs`,
        data: currentAffairs,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-current-affairs:", error);
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

async function generateCurrentAffairs(): Promise<CurrentAffair[]> {
  const key = Deno.env.get("GROQ_API_KEY");
  console.log("GROQ_API_KEY present:", !!key);
  console.log("GROQ_API_KEY length:", key?.length);
  
  if (!key) {
    throw new Error("GROQ_API_KEY environment variable not set");
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const affairs: CurrentAffair[] = [];

  for (let i = 0; i < NEWS_TOPICS.length; i++) {
    const topic = NEWS_TOPICS[i];
    const category = CATEGORIES[i % CATEGORIES.length];

    const prompt = `Generate a realistic current affairs news item about "${topic}" as of ${currentDate}.
    
    This is for UPSC/SSC/Competitive exam preparation. Focus on:
    - Names of schemes, policies, or key people involved
    - Specific dates, numbers, or statistics
    - Why this news is important for exams
    - Any related previous year questions or exam relevance
    
    Format your response as a JSON object with these exact fields:
    {
      "title": "A compelling news headline with specific keywords (max 80 characters)",
      "summary": "3-4 sentence summary including key facts, figures, and exam importance (max 250 characters)",
      "source_url": "https://pib.gov.in or relevant government website"
    }
    
    Make it factually accurate and exam-relevant. Only return the JSON, no other text.`;

    try {
      console.log(`Calling Groq API for topic: ${topic}`);
      
      const requestBody = {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are an expert in UPSC/SSC/Competitive exam current affairs. Generate factual, exam-relevant news with specific names, dates, numbers, and policy details in valid JSON format."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      };
      
      console.log("Request body:", JSON.stringify(requestBody));
      
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`Groq API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error ${response.status}: ${errorText}`);
        continue;
      }

      const result = await response.json();
      console.log(`Groq API result for ${topic}:`, JSON.stringify(result).slice(0, 200));
      
      const content = result.choices[0]?.message?.content;

      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            affairs.push({
              title: parsed.title,
              summary: parsed.summary,
              category: category,
              date: currentDate,
              source_url: parsed.source_url || "https://www.google.com/search",
            });
            console.log(`Successfully added affair: ${parsed.title}`);
          }
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError);
          console.error("Raw content:", content);
        }
      }
    } catch (error) {
      console.error(`Error generating affair for ${topic}:`, error);
    }
  }

  console.log(`Total affairs generated: ${affairs.length}`);
  return affairs;
}
