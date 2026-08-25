const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ai-student-assistant.onrender.com",
                    "X-Title": "AI Student Assistant"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        {
                            role: "user",
                            content: userMessage
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("OpenRouter response:", data);

        if (!response.ok) {
            return res.status(response.status).json({
                answer: "AI error: " + (
                    data.error?.message || "Unknown error"
                )
            });
        }

        const answer =
            data.choices?.[0]?.message?.content ||
            "Sorry, I could not generate an answer.";

        res.json({
            answer: answer
        });

    } catch (error) {

        console.error("Server error:", error);

        res.status(500).json({
            answer: "Server error. Please try again."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
