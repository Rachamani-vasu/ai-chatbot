/* =========================================
   vasu_ChatBot
   Main Frontend JavaScript
   ========================================= */


/* =========================================
   VARIABLES
   ========================================= */

let conversation = [];

let chats = JSON.parse(
    localStorage.getItem("32J3_Chatbot") || "[]"
);

let currentChatId = null;

let isGenerating = false;


/* =========================================
   PAGE LOAD
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

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

    messages.innerHTML = "";

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

    const message =
        input.value.trim();

    if (message === "") {
        return;
    }


    /* Hide welcome screen */

    const welcome =
        document.getElementById("welcomeScreen");

    if (welcome) {

        welcome.style.display = "none";

    }


    /* Add user message */

    addMessage(
        "user",
        message
    );


    /* Save conversation */

    conversation.push({

        role: "user",

        content: message

    });


    input.value = "";

    autoResize(input);


    /* Show typing animation */

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
            await fetch("/chat", {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    messages:
                        conversation

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.answer ||
                "AI service error"
            );

        }


        /* Remove typing */

        typingMessage.remove();


        /* Add AI answer */

        addMessage(
            "bot",
            data.answer
        );


        /* Save AI response */

        conversation.push({

            role: "assistant",

            content: data.answer

        });


        /* Save chat */

        saveCurrentChat();

        renderChatHistory();


    } catch (error) {

        console.error(error);

        typingMessage.remove();


        addMessage(

            "bot",

            "❌ Sorry, I couldn't connect to the AI. Please try again."

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
        document.getElementById("messages");


    const container =
        document.createElement("div");

    container.className =
        "message-container";


    const message =
        document.createElement("div");

    message.className =
        type === "user"
            ? "user-message"
            : "bot-message";


    /* Safe text */

    message.textContent = text;


    container.appendChild(
        message
    );


    /* Copy button for AI */

    if (type === "bot") {

        const copyButton =
            document.createElement("button");

        copyButton.className =
            "copy-button";

        copyButton.textContent =
            "📋 Copy";

        copyButton.onclick =
            () => copyText(
                text,
                copyButton
            );

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
        document.createElement("div");

    container.className =
        "message-container";


    const message =
        document.createElement("div");

    message.className =
        "bot-message";


    const typing =
        document.createElement("div");

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


        setTimeout(() => {

            button.textContent =
                "📋 Copy";

        }, 1500);


    } catch {

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
   AUTO RESIZE TEXTAREA
   ========================================= */

function autoResize(textarea) {

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
   SUGGESTIONS
   ========================================= */

function useSuggestion(text) {

    const input =
        document.getElementById(
            "userInput"
        );

    input.value =
        text;

    autoResize(input);

    sendMessage();

}


/* =========================================
   CHAT HISTORY
   ========================================= */

function saveCurrentChat() {

    if (
        !conversation.length
    ) {

        return;

    }


    const firstUserMessage =
        conversation.find(
            message =>
                message.role === "user"
        );


    const title =
        firstUserMessage
            ? firstUserMessage.content.substring(
                0,
                35
            )
            : "New Chat";


    const existingIndex =
        chats.findIndex(
            chat =>
                chat.id === currentChatId
        );


    const chatData = {

        id: currentChatId,

        title: title,

        messages: conversation,

        updated:
            new Date().toISOString()

    };


    if (
        existingIndex !== -1
    ) {

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
        "vasuChats",
        JSON.stringify(chats)
    );

}


/* =========================================
   RENDER HISTORY
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


    chats.forEach(chat => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "history-item";


        item.textContent =
            "💬 " + chat.title;


        item.onclick =
            () => loadChat(
                chat.id
            );


        history.appendChild(
            item
        );

    });

}


/* =========================================
   LOAD CHAT
   ========================================= */

function loadChat(id) {

    const chat =
        chats.find(
            item =>
                item.id === id
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

    messages.innerHTML = "";


    conversation.forEach(
        message => {

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
   CLEAR ALL CHATS
   ========================================= */

function clearAllChats() {

    const confirmed =
        confirm(
            "Delete all chat history?"
        );


    if (!confirmed) {
        return;
    }


    chats = [];

    localStorage.removeItem(
        "vasuChats"
    );


    createNewChat(false);

    renderChatHistory();

}


/* =========================================
   SEARCH CHATS
   ========================================= */

const searchInput =
    document.getElementById(
        "searchChats"
    );


if (searchInput) {

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


            items.forEach(item => {

                const text =
                    item.textContent
                        .toLowerCase();


                item.style.display =
                    text.includes(search)
                        ? "block"
                        : "none";

            });

        }
    );

}


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
        "vasuTheme",
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
            "vasuTheme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }


    updateThemeIcons();

}


/* =========================================
   THEME ICON
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


    sidebar.classList.toggle(
        "open"
    );

    overlay.classList.toggle(
        "active"
    );

}


function closeSidebarMobile() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "overlay"
        );


    if (!sidebar) {
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


    voiceButton.textContent =
        "🔴";


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


            input.value =
                text;


            autoResize(input);

        };


    recognition.onerror =
        function () {

            voiceButton.textContent =
                "🎤";

        };


    recognition.onend =
        function () {

            voiceButton.textContent =
                "🎤";

        };

}
