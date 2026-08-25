async function sendMessage() {

    const input = document.getElementById("userInput");
    const messages = document.getElementById("messages");

    const message = input.value.trim();

    if (message === "") {
        return;
    }

    // Show user's message
    messages.innerHTML += `
        <div class="user-message">
            ${message}
        </div>
    `;

    // Clear input
    input.value = "";

    // Show thinking message
    const thinkingMessage = document.createElement("div");

    thinkingMessage.className = "bot-message";

    thinkingMessage.textContent = "🤔 Thinking...";

    messages.appendChild(thinkingMessage);

    messages.scrollTop = messages.scrollHeight;

    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();

        // Replace thinking message
        thinkingMessage.textContent = data.answer;

    } catch (error) {

        console.error(error);

        thinkingMessage.textContent =
            "❌ Sorry, I couldn't connect to the AI.";

    }

    messages.scrollTop = messages.scrollHeight;
}


function handleKey(event) {

    if (event.key === "Enter") {

        sendMessage();

    }

}
