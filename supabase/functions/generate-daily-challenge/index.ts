// Daily Challenge: Generate 20 hard UPSC/SSC questions per day
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// High-impact topics for competitive exams
const CHALLENGE_TOPICS = [
  "Indian Constitution - Advanced concepts",
  "International Relations & Diplomacy",
  "Indian Economy - Advanced macroeconomics",
  "Science & Technology - Latest developments",
  "Environment & Ecology - Complex issues",
  "Ancient Indian History - Deep concepts",
  "Medieval Indian History - Strategic events",
  "Modern Indian History - Revolutionary movements",
  "Geography - Physical & Human concepts",
  "Current Affairs - Policy analysis",
  "Ethics & Integrity - Case studies",
  "Governance & Social Justice",
  "Security Issues - Internal & External",
  "Science - Physics breakthroughs",
  "Science - Chemistry applications",
  "Science - Biology & Medicine",
  "Art & Culture - UNESCO heritage",
  "World History - Major revolutions",
  "Geography - Climatology concepts",
  "Agriculture & Rural Development"
];

interface ChallengeQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  date: string;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const currentDate = new Date().toISOString().split("T")[0];

    // Clear old challenge questions
    console.log("Clearing old daily challenge questions...");
    const deleteResult = await supabase
      .from("daily_challenge_questions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteResult.error) {
      console.error("Error clearing old data:", deleteResult.error);
      throw deleteResult.error;
    }
    console.log("Old data cleared successfully");

    // Generate 20 hard questions
    console.log("Generating 20 daily challenge questions...");
    const questions = await generateDailyChallengeQuestions();

    // Store in database
    const insertResult = await supabase
      .from("daily_challenge_questions")
      .insert(questions);

    if (insertResult.error) {
      console.error("Error inserting questions:", insertResult.error);
      throw insertResult.error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated and stored ${questions.length} daily challenge questions`,
        data: questions,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-daily-challenge:", error);
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

async function generateDailyChallengeQuestions(): Promise<ChallengeQuestion[]> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) {
    throw new Error("GROQ_API_KEY not set");
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const questions: ChallengeQuestion[] = [];

  for (let i = 0; i < 20; i++) {
    const topic = CHALLENGE_TOPICS[i];
    
    const prompt = `Generate ONE extremely difficult multiple-choice question for UPSC/SSC/Competitive exam preparation.

Topic: ${topic}

Requirements:
- Question must be HIGH DIFFICULTY level (analytical, application-based, not factual recall)
- Must test deep conceptual understanding
- Include plausible distractors (wrong options that seem correct)
- Question should require critical thinking

Format your response as JSON with these exact fields:
{
  "question": "The challenging question text (include scenario/case study if applicable)",
  "option_a": "Plausible but incorrect option",
  "option_b": "Plausible but incorrect option", 
  "option_c": "Plausible but incorrect option",
  "option_d": "Correct answer option",
  "correct_answer": "D",
  "explanation": "Detailed explanation of why D is correct and why others are wrong (3-4 sentences)"
}

IMPORTANT:
- Randomize which option (A, B, C, or D) is correct - don't always make D correct
- Options must be well-crafted distractors
- Include specific facts, data, or examples in the question
- Make it exam-relevant and current

Only return the JSON, no other text.`;

    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        console.log(`Generating question ${i + 1}/20: ${topic} (attempt ${4 - retries}/3)`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
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
                content: "You are an expert UPSC/SSC exam question setter. Create extremely difficult, analytical questions that test deep conceptual understanding. Use current affairs, data, and real scenarios."
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 800,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          console.error(`Groq API error ${response.status}: ${errorText}`);
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0]?.message?.content;

        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            questions.push({
              question: parsed.question,
              option_a: parsed.option_a,
              option_b: parsed.option_b,
              option_c: parsed.option_c,
              option_d: parsed.option_d,
              correct_answer: parsed.correct_answer,
              explanation: parsed.explanation,
              topic: topic,
              difficulty: "hard",
              date: currentDate,
            });
            console.log(`✓ Question ${i + 1} generated: ${parsed.question.substring(0, 50)}...`);
            success = true;
          }
        }
      } catch (error) {
        retries--;
        console.error(`Error for question ${i + 1}: ${error.message}. Retries left: ${retries}`);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    if (!success) {
      console.error(`Failed to generate question ${i + 1} after 3 attempts`);
    }
  }

  console.log(`Total questions generated: ${questions.length}/20`);
  return questions;
}
