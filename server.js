const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


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


        /* Make sure at least one message exists */

        if (messages.length === 0) {

            return res.status(400).json({
                answer: "Please enter a message."
            });

        }


        /* Keep conversation manageable */

        messages = messages.slice(-20);


        /* Student Assistant instructions */

        const systemMessage = {

            role: "system",

            content: `
You are 32J3_ChatBot, an AI Student Assistant.

Your job is to help students with:

- Programming
- Python
- Java
- Web development
- Machine learning
- Artificial intelligence
- Software engineering
- Operating systems
- Computer science
- Mathematics
- Quantum computing
- Exam preparation
- Projects and assignments

Explain concepts clearly and simply.

When appropriate:
- Give examples
- Give step-by-step explanations
- Give exam-friendly answers
- Use simple language
- Provide code examples when requested

Remember the previous messages in the conversation and use them to understand follow-up questions.

If you are unsure about something, say so instead of making up information.
`

        };


        /* Send to OpenRouter */

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

                    model:
                        "openrouter/free",

                    messages: [

                        systemMessage,

                        ...messages

                    ]

                })

            }

        );


        const data =
            await response.json();


        console.log(
            "OpenRouter response:",
            data
        );


        /* Handle OpenRouter error */

        if (!response.ok) {

            return res.status(
                response.status
            ).json({

                answer:
                    data.error?.message ||
                    "AI service error."

            });

        }


        /* Get answer */

        const answer =
            data.choices?.[0]?.message?.content;


        if (
            !answer ||
            answer.trim().length === 0
        ) {

            return res.status(500).json({

                answer:
                    "The AI returned an empty answer. Please try again."

            });

        }


        /* Send answer to website */

        res.json({

            answer:
                answer.trim()

        });


    } catch (error) {

        console.error(
            "Server error:",
            error
        );


        res.status(500).json({

            answer:
                "Something went wrong. Please try again."

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
