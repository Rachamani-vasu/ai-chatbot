/* =========================================
   32J3_ChatBot
   Main JavaScript
   ========================================= */


/* =========================================
   VARIABLES
   ========================================= */

let conversation = [];

let chats = JSON.parse(
    localStorage.getItem("32J3Chats") || "[]"
);

let currentChatId = null;

let isGenerating = false;


/* =========================================
   PAGE LOAD
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadTheme();

    renderChatHistory();

    createNewChat(false);

});


/* =========================================
   NEW CHAT
   ========================================= */

function newChat() {

    createNewChat(true);

}


function createNewChat(saveOldChat = true) {

    if (
        saveOldChat &&
        conversation.length > 0
    ) {

        saveCurrentChat();

    }


    conversation = [];

    currentChatId = Date.now();


    const messages =
        document.getElementById("messages");


    const welcome =
        document.getElementById("welcomeScreen");


    if (messages) {

        messages.innerHTML = "";

    }


    if (welcome) {

        welcome.style.display = "block";

    }


    renderChatHistory();

    closeSidebarMobile();

}


/* =========================================
   SEND MESSAGE
   ========================================= */

async function sendMessage() {

    if (isGenerating) {

        return;

    }


    const input =
        document.getElementById("userInput");


    const messagesBox =
        document.getElementById("messages");


    if (!input || !messagesBox) {

        return;

    }


    const message =
        input.value.trim();


    /* Don't send empty messages */

    if (message === "") {

        return;

    }


    /* Hide welcome */

    const welcome =
        document.getElementById("welcomeScreen");


    if (welcome) {

        welcome.style.display = "none";

    }


    /* Show user message */

    addMessage(
        "user",
        message
    );


    /* Add to conversation memory */

    conversation.push({

        role: "user",

        content: message

    });


    /* Clear input */

    input.value = "";

    autoResize(input);


    /* Show typing */

    const typingMessage =
        createTypingMessage();


    messagesBox.appendChild(
        typingMessage
    );


    messagesBox.scrollTop =
        messagesBox.scrollHeight;


    isGenerating = true;

    updateSendButton();


    try {

        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        messages:
                            conversation

                    })
                }
            );


        /*
         * Read response as TEXT first.
         * This prevents the frontend from crashing
         * if the server returns invalid/empty JSON.
         */

        const responseText =
            await response.text();


        console.log(
            "Server response:",
            responseText
        );


        /* Remove typing */

        typingMessage.remove();


        /* Empty server response */

        if (
            !responseText ||
            responseText.trim() === ""
        ) {

            throw new Error(
                "Server returned an empty response."
            );

        }


        /* Parse JSON safely */

        let data;

        try {

            data =
                JSON.parse(responseText);

        } catch (jsonError) {

            console.error(
                "JSON parse error:",
                jsonError
            );

            throw new Error(
                "Invalid response from server."
            );

        }


        /* Server error */

        if (!response.ok) {

            throw new Error(

                data.answer ||
                "AI service error."

            );

        }


        /* Get answer */

        const answer =
            data.answer;


        if (
            !answer ||
            typeof answer !== "string"
        ) {

            throw new Error(
                "The AI returned no answer."
            );

        }


        /* Show AI answer */

        addMessage(
            "bot",
            answer
        );


        /* Add AI answer to memory */

        conversation.push({

            role: "assistant",

            content: answer

        });


        /* Save conversation */

        saveCurrentChat();

        renderChatHistory();


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        /* Remove typing if still present */

        if (
            typingMessage &&
            typingMessage.parentNode
        ) {

            typingMessage.remove();

        }


        addMessage(

            "bot",

            "❌ " +
            (
                error.message ||
                "Sorry, I couldn't connect to the AI."
            )

        );

    }


    isGenerating = false;

    updateSendButton();

}


/* =========================================
   ADD MESSAGE
   ========================================= */

function addMessage(
    type,
    text
) {

    const messagesBox =
        document.getElementById(
            "messages"
        );


    if (!messagesBox) {

        return;

    }


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "message-container";


    const message =
        document.createElement(
            "div"
        );


    if (type === "user") {

        message.className =
            "user-message";

    } else {

        message.className =
            "bot-message";

    }


    /*
     * textContent is used for safety.
     */

    message.textContent =
        text;


    container.appendChild(
        message
    );


    /* Copy button for AI */

    if (type === "bot") {

        const copyButton =
            document.createElement(
                "button"
            );


        copyButton.className =
            "copy-button";


        copyButton.textContent =
            "📋 Copy";


        copyButton.onclick =
            function () {

                copyText(
                    text,
                    copyButton
                );

            };


        container.appendChild(
            copyButton
        );

    }


    messagesBox.appendChild(
        container
    );


    messagesBox.scrollTop =
        messagesBox.scrollHeight;

}


/* =========================================
   TYPING ANIMATION
   ========================================= */

function createTypingMessage() {

    const container =
        document.createElement(
            "div"
        );


    container.className =
        "message-container";


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "bot-message";


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "typing";


    typing.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;


    message.appendChild(
        typing
    );


    container.appendChild(
        message
    );


    return container;

}


/* =========================================
   COPY ANSWER
   ========================================= */

async function copyText(
    text,
    button
) {

    try {

        await navigator.clipboard.writeText(
            text
        );


        button.textContent =
            "✅ Copied!";


        setTimeout(
            function () {

                button.textContent =
                    "📋 Copy";

            },
            1500
        );


    } catch (error) {

        console.error(
            "Copy error:",
            error
        );


        button.textContent =
            "❌ Failed";

    }

}


/* =========================================
   ENTER KEY
   ========================================= */

function handleKey(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

}


/* =========================================
   AUTO RESIZE INPUT
   ========================================= */

function autoResize(textarea) {

    if (!textarea) {

        return;

    }


    textarea.style.height =
        "auto";


    textarea.style.height =
        Math.min(
            textarea.scrollHeight,
            150
        ) + "px";

}


/* =========================================
   SEND BUTTON
   ========================================= */

function updateSendButton() {

    const button =
        document.getElementById(
            "sendButton"
        );


    if (!button) {

        return;

    }


    if (isGenerating) {

        button.textContent =
            "■";


        button.disabled =
            true;

    } else {

        button.textContent =
            "➤";


        button.disabled =
            false;

    }

}


/* =========================================
   CHAT HISTORY
   ========================================= */

function saveCurrentChat() {

    if (
        !conversation ||
        conversation.length === 0
    ) {

        return;

    }


    const firstUserMessage =
        conversation.find(
            function (message) {

                return (
                    message.role === "user"
                );

            }
        );


    let title =
        "New Chat";


    if (firstUserMessage) {

        title =
            firstUserMessage.content
                .substring(0, 35);

    }


    const existingIndex =
        chats.findIndex(
            function (chat) {

                return (
                    chat.id ===
                    currentChatId
                );

            }
        );


    const chatData = {

        id:
            currentChatId,

        title:
            title,

        messages:
            conversation,

        updated:
            new Date().toISOString()

    };


    if (existingIndex !== -1) {

        chats[existingIndex] =
            chatData;

    } else {

        chats.unshift(
            chatData
        );

    }


    /* Keep last 30 chats */

    chats =
        chats.slice(0, 30);


    localStorage.setItem(
        "32J3Chats",
        JSON.stringify(chats)
    );

}


/* =========================================
   DISPLAY CHAT HISTORY
   ========================================= */

function renderChatHistory() {

    const history =
        document.getElementById(
            "chatHistory"
        );


    if (!history) {

        return;

    }


    history.innerHTML = "";


    chats.forEach(
        function (chat) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            item.textContent =
                "💬 " + chat.title;


            item.onclick =
                function () {

                    loadChat(
                        chat.id
                    );

                };


            history.appendChild(
                item
            );

        }
    );

}


/* =========================================
   LOAD OLD CHAT
   ========================================= */

function loadChat(id) {

    const chat =
        chats.find(
            function (item) {

                return (
                    item.id === id
                );

            }
        );


    if (!chat) {

        return;

    }


    currentChatId =
        chat.id;


    conversation =
        [...chat.messages];


    const welcome =
        document.getElementById(
            "welcomeScreen"
        );


    if (welcome) {

        welcome.style.display =
            "none";

    }


    const messages =
        document.getElementById(
            "messages"
        );


    if (!messages) {

        return;

    }


    messages.innerHTML = "";


    conversation.forEach(
        function (message) {

            addMessage(

                message.role === "user"
                    ? "user"
                    : "bot",

                message.content

            );

        }
    );


    closeSidebarMobile();

}


/* =========================================
   CLEAR CHAT HISTORY
   ========================================= */

function clearAllChats() {

    const confirmed =
        confirm(
            "Delete all 32J3_ChatBot chat history?"
        );


    if (!confirmed) {

        return;

    }


    chats = [];


    localStorage.removeItem(
        "32J3Chats"
    );


    createNewChat(false);

    renderChatHistory();

}


/* =========================================
   SEARCH CHAT HISTORY
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "searchChats"
            );


        if (!searchInput) {

            return;

        }


        searchInput.addEventListener(
            "input",
            function () {

                const search =
                    this.value
                        .toLowerCase()
                        .trim();


                const items =
                    document.querySelectorAll(
                        ".history-item"
                    );


                items.forEach(
                    function (item) {

                        const text =
                            item.textContent
                                .toLowerCase();


                        if (
                            text.includes(
                                search
                            )
                        ) {

                            item.style.display =
                                "block";

                        } else {

                            item.style.display =
                                "none";

                        }

                    }
                );

            }
        );

    }
);


/* =========================================
   DARK / LIGHT MODE
   ========================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(

        "32J3Theme",

        isDark
            ? "dark"
            : "light"

    );


    updateThemeIcons();

}


/* =========================================
   LOAD THEME
   ========================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            "32J3Theme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }


    updateThemeIcons();

}


/* =========================================
   UPDATE THEME BUTTONS
   ========================================= */

function updateThemeIcons() {

    const isDark =
        document.body.classList.contains(
            "dark"
        );


    const icon =
        document.getElementById(
            "themeIcon"
        );


    const topButton =
        document.getElementById(
            "topThemeButton"
        );


    if (icon) {

        icon.textContent =
            isDark
                ? "☀️"
                : "🌙";

    }


    if (topButton) {

        topButton.textContent =
            isDark
                ? "☀️"
                : "🌙";

    }

}


/* =========================================
   SIDEBAR
   ========================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    if (!sidebar || !overlay) {

        return;

    }


    sidebar.classList.toggle(
        "open"
    );


    overlay.classList.toggle(
        "active"
    );

}


/* =========================================
   CLOSE MOBILE SIDEBAR
   ========================================= */

function closeSidebarMobile() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "overlay"
        );


    if (!sidebar || !overlay) {

        return;

    }


    sidebar.classList.remove(
        "open"
    );


    overlay.classList.remove(
        "active"
    );

}


/* =========================================
   VOICE INPUT
   ========================================= */

function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;

    }


    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.interimResults =
        false;


    recognition.maxAlternatives =
        1;


    const voiceButton =
        document.getElementById(
            "voiceButton"
        );


    if (voiceButton) {

        voiceButton.textContent =
            "🔴";

    }


    recognition.start();


    recognition.onresult =
        function (event) {

            const text =
                event.results[0][0]
                    .transcript;


            const input =
                document.getElementById(
                    "userInput"
                );


            if (input) {

                input.value =
                    text;

                autoResize(input);

            }

        };


    recognition.onerror =
        function (event) {

            console.error(
                "Voice error:",
                event.error
            );


            if (voiceButton) {

                voiceButton.textContent =
                    "🎤";

            }

        };


    recognition.onend =
        function () {

            if (voiceButton) {

                voiceButton.textContent =
                    "🎤";

            }

        };

}
