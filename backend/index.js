import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/plan", async (req, res) => {
  const { experience, race, raceDate, availability, intensity } = req.body;

  if (!experience || !race || !raceDate || !availability || !intensity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const prompt = `
Create a detailed ${race} training plan for a runner with ${experience} experience.
The race is on ${raceDate}.
They can train ${availability} days per week at ${intensity} intensity.
Provide a week-by-week plan with daily workouts.
Return as JSON with weeks, days, and workouts.
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const planText = completion.data.choices[0].message.content;

    // Try parsing JSON returned from GPT
    let planJson;
    try {
      planJson = JSON.parse(planText);
    } catch {
      // If GPT did not return JSON, wrap it as text
      planJson = { plan: planText };
    }

    res.json({ plan: planJson });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "OpenAI API request failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
