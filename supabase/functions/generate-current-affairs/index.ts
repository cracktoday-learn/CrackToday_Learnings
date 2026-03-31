// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// News sources to monitor (simplified for demo - in production, use RSS feeds or news APIs)
const NEWS_TOPICS = [
  "Indian politics and government decisions",
  "Indian economy and financial markets",
  "Science and technology developments in India",
  "International relations involving India",
  "Environmental issues and climate change in India",
  "Indian culture and heritage",
];

const CATEGORIES = ["national", "polity", "economy", "science", "international", "environment", "culture"];

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

    // Generate current affairs using Groq
    const currentAffairs = await generateCurrentAffairs();

    // Store in database
    const { data, error } = await supabase
      .from("current_affairs")
      .upsert(currentAffairs, { onConflict: "title" });

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
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable not set");
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const affairs: CurrentAffair[] = [];

  // Generate content for each category
  for (let i = 0; i < NEWS_TOPICS.length; i++) {
    const topic = NEWS_TOPICS[i];
    const category = CATEGORIES[i % CATEGORIES.length];

    const prompt = `Generate a realistic current affairs news item about "${topic}" as of ${currentDate}.
    
    Format your response as a JSON object with these exact fields:
    {
      "title": "A compelling news headline (max 80 characters)",
      "summary": "A 2-3 sentence summary of the news (max 200 characters)",
      "source_url": "A plausible URL for this news source"
    }
    
    Make it realistic and timely. Only return the JSON, no other text.`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Fast and cost-effective
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates realistic current affairs news items in valid JSON format."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error(`Groq API error: ${response.status}`);
        continue;
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (content) {
        try {
          // Extract JSON from response (in case there's extra text)
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
          }
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError);
        }
      }
    } catch (error) {
      console.error(`Error generating affair for ${topic}:`, error);
    }
  }

  return affairs;
}
