const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


/* =========================================
   CHAT
   ========================================= */

app.post("/chat", async (req, res) => {

    try {

        console.log("CHAT REQUEST RECEIVED");


        /* Get messages */

        let messages = req.body?.messages;


        if (!Array.isArray(messages)) {

            return res.status(400).json({
                answer: "Please enter a message."
            });

        }


        /* Remove empty messages */

        messages = messages.filter((message) => {

            return (
                message &&
                typeof message.content === "string" &&
                message.content.trim() !== "" &&
                (
                    message.role === "user" ||
                    message.role === "assistant"
                )
            );

        });


        if (messages.length === 0) {

            return res.status(400).json({
                answer: "Please enter a message."
            });

        }


        /* Keep recent conversation */

        messages = messages.slice(-20);


        /* =========================================
           SYSTEM MESSAGE
           ========================================= */

        const systemMessage = {

            role: "system",

            content: `
You are 32J3_ChatBot, a helpful AI Student Assistant.

Answer the user's questions clearly and accurately.

You can help with:
- Academics
- Programming
- Computer science
- Web development
- Mathematics
- Artificial intelligence
- Machine learning
- Software engineering
- Operating systems
- Projects
- Assignments
- General questions

Use simple explanations when possible.

For programming questions, provide useful examples.

Remember the previous messages in the conversation when answering follow-up questions.

Do not invent information when you are unsure.
`

        };


        /* =========================================
           OPENROUTER
           ========================================= */

        const apiResponse = await fetch(
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


        console.log(
            "OpenRouter status:",
            apiResponse.status
        );


        /* =========================================
           READ AS TEXT
           ========================================= */

        const text = await apiResponse.text();


        console.log(
            "OpenRouter response length:",
            text.length
        );


        /* Empty response */

        if (!text || text.trim() === "") {

            console.error(
                "OpenRouter returned an empty response."
            );

            return res.status(502).json({

                answer:
                    "The AI service returned an empty response. Please try again."

            });

        }


        /* =========================================
           PARSE SAFELY
           ========================================= */

        let data;

        try {

            data = JSON.parse(text);

        } catch (parseError) {

            console.error(
                "Could not parse OpenRouter response:",
                parseError.message
            );

            console.error(
                "Raw response:",
                text.substring(0, 500)
            );

            return res.status(502).json({

                answer:
                    "The AI service returned an invalid response. Please try again."

            });

        }


        /* =========================================
           API ERROR
           ========================================= */

        if (!apiResponse.ok) {

            console.error(
                "OpenRouter API error:",
                data
            );

            return res.status(
                apiResponse.status
            ).json({

                answer:
                    data?.error?.message ||
                    "The AI service returned an error."

            });

        }


        /* =========================================
           GET ANSWER
           ========================================= */

        const answer =
            data?.choices?.[0]?.message?.content;


        if (
            typeof answer !== "string" ||
            answer.trim() === ""
        ) {

            console.error(
                "No AI answer found:",
                data
            );

            return res.status(502).json({

                answer:
                    "The AI did not return an answer. Please try again."

            });

        }


        /* =========================================
           SEND TO FRONTEND
           ========================================= */

        return res.json({

            answer:
                answer.trim()

        });


    } catch (error) {

        console.error(
            "CHAT ERROR:",
            error
        );

        return res.status(500).json({

            answer:
                "Something went wrong while connecting to the AI."

        });

    }

});


/* =========================================
   SERVER
   ========================================= */

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `32J3_ChatBot running on port ${PORT}`
        );

    }
);
