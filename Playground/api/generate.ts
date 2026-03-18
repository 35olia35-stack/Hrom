export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { systemPrompt, userPrompt } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content || "{}";

    // ожидаем JSON от модели
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    res.status(200).json(parsed);

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
