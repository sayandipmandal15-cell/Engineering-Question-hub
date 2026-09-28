// =====================================================
// ENGINEERING QUESTION HUB - GLOBAL SCRIPT
// =====================================================


// ================= SEARCH QUESTION =================

function searchQuestion() {

    const searchInput =
        document.getElementById("searchInput");

    const searchValue =
        searchInput.value.trim();

    if (searchValue === "") {

        alert("Please enter a question, subject or topic.");

        return;
    }

    window.location.href =
        "question-bank.html?search=" +
        encodeURIComponent(searchValue);
}


// ================= AI SOLVER =================

async function solveQuestion() {

    const questionInput =
        document.getElementById("questionInput");

    const result =
        document.getElementById("aiResult");

    const question =
        questionInput.value.trim();

    if (question === "") {
        result.innerHTML =
            "⚠️ Please enter a question first.";
        return;
    }

    result.innerHTML =
        "<p>⏳ AI solving...</p>";

    try {

        const { data, error } =
            await supabaseClient.functions.invoke(
                "solve-question",
                {
                    body: {
                        question: question
                    }
                }
            );

        if (error) {
            console.error("AI Error:", error);

            result.innerHTML = `
                <p style="color:red;">
                    ❌ AI answer পাওয়া যায়নি.
                </p>
                <p>
                    ${error.message}
                </p>
            `;

            return;
        }

        const answer =
            data?.answer ||
            data?.data?.answer ||
            data?.result ||
            data?.data?.result;

        if (!answer) {

            result.innerHTML =
                "❌ AI থেকে answer পাওয়া যায়নি.";

            return;
        }

        result.innerHTML = `
            <div class="ai-answer-content">
                <h3>🤖 AI Answer</h3>
                <div class="ai-answer-text">
                    ${formatHomepageAIAnswer(answer)}
                </div>
            </div>
        `;

    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <p style="color:red;">
                ❌ AI answer পাওয়া যায়নি.
            </p>
            <p>
                ${error.message}
            </p>
        `;
    }
}


function escapeHomepageHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = String(text);

    return div.innerHTML;
}

// ================= FORMAT AI ANSWER =================

function formatHomepageAIAnswer(text) {

    let formatted = escapeHomepageHTML(text);

    // Markdown headings-এর আগে নতুন line
    formatted = formatted.replace(
        /###\s*/g,
        "<br><br>"
    );

    // Horizontal line remove
    formatted = formatted.replace(
        /---/g,
        "<br>"
    );

    // Bold text
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Numbered sections
    formatted = formatted.replace(
        /(\d+)\.\s+/g,
        "<br><strong>$1.</strong> "
    );

    // Bullet points
    formatted = formatted.replace(
        /\s+\*\s+/g,
        "<br>• "
    );

    // Extra spaces/line breaks clean
    formatted = formatted.replace(
        /(<br>\s*){3,}/g,
        "<br><br>"
    );

    return formatted;
}

// ================= OPEN AI =================

function openAI() {

    const aiSection =
        document.getElementById("ai");

    if (!aiSection) {

        window.location.href =
            "index.html#ai";

        return;
    }


    aiSection.scrollIntoView({
        behavior: "smooth"
    });
}


// ================= OPEN QUESTION BANK =================

function openQuestionBank(branch) {

    if (branch) {

        window.location.href =
            "question-bank.html?branch=" +
            encodeURIComponent(branch);

    } else {

        window.location.href =
            "question-bank.html";
    }
}


// ================= OPEN AI ANALYSIS =================

function openAnalysis() {

    window.location.href =
        "ai-analysis.html";
}


// ================= OPEN UPLOAD =================

function uploadQuestion() {

    window.location.href =
        "upload.html";
}


// ================= LOGIN =================

function openLogin() {

    window.location.href =
        "auth.html";
}