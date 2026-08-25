const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


/* =========================================
   CHAT API
   ========================================= */

app.post("/chat", async (req, res) => {

    try {

        let messages = req.body.messages;


        /* Check messages */

        if (!Array.isArray(messages)) {

            return res.status(400).json({
                answer: "Invalid message format."
            });

        }


        /* Remove empty messages */

        messages = messages.filter(message => {

            return (
                message &&
                typeof message.content === "string" &&
                message.content.trim().length > 0 &&
                (
                    message.role === "user" ||
                    message.role === "assistant"
                )
            );

        });


        /* Check for empty conversation */

        if (messages.length === 0) {

            return res.status(400).json({
                answer: "Please enter a message."
            });

        }


        /* Keep last 20 messages */

        messages = messages.slice(-20);


        /* =========================================
           SYSTEM INSTRUCTION
           ========================================= */

        const systemMessage = {

            role: "system",

            content: `
You are 32J3_ChatBot, an AI Student Assistant.

Help students with academic questions, programming,
computer science, mathematics, projects, assignments,
exam preparation, technology and general questions.

Give clear, simple and useful answers.

When appropriate:
- Explain step by step
- Give simple examples
- Give exam-friendly answers
- Provide code when requested
- Remember previous messages in the conversation

Do not make up information when you are unsure.
`

        };


        /* =========================================
           OPENROUTER REQUEST
           ========================================= */

        const response = await fetch(

            "https://openrouter.ai/api/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    "Content-Type":
                        "application/json",

                    "HTTP-Referer":
                        "https://ai-chatbot-jnzk.onrender.com",

                    "X-Title":
                        "32J3_ChatBot"

                },

                body: JSON.stringify({

                    model: "openrouter/free",

                    messages: [

                        systemMessage,

                        ...messages

                    ]

                })

            }

        );


        /* =========================================
           SAFELY READ RESPONSE
           ========================================= */

        const responseText =
            await response.text();


        console.log(
            "OpenRouter status:",
            response.status
        );


        console.log(
            "OpenRouter raw response:",
            responseText
        );


        /* Empty response */

        if (!responseText ||
            responseText.trim() === "") {

            return res.status(502).json({

                answer:
                    "The AI service returned an empty response. Please try again."

            });

        }


        /* Safely parse JSON */

        let data;

        try {

            data =
                JSON.parse(responseText);

        } catch (jsonError) {

            console.error(
                "OpenRouter JSON parse error:",
                jsonError
            );


            return res.status(502).json({

                answer:
                    "The AI service returned an invalid response. Please try again."

            });

        }


        console.log(
            "OpenRouter response:",
            data
        );


        /* =========================================
           OPENROUTER ERROR
           ========================================= */

        if (!response.ok) {

            return res.status(
                response.status
            ).json({

                answer:
                    data?.error?.message ||
                    "The AI service returned an error."

            });

        }


        /* =========================================
           GET AI ANSWER
           ========================================= */

        const answer =
            data?.choices?.[0]?.message?.content;


        if (
            !answer ||
            typeof answer !== "string" ||
            answer.trim() === ""
        ) {

            return res.status(502).json({

                answer:
                    "The AI returned an empty answer. Please try again."

            });

        }


        /* =========================================
           SEND ANSWER
           ========================================= */

        return res.json({

            answer:
                answer.trim()

        });


    } catch (error) {

        console.error(
            "Server error:",
            error
        );


        return res.status(500).json({

            answer:
                "Something went wrong while connecting to the AI. Please try again."

        });

    }

});


/* =========================================
   START SERVER
   ========================================= */

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `32J3_ChatBot server running on port ${PORT}`
        );

    }
);
