// ================= AI QUESTION SOLVER =================

async function solveWithAI(question) {

    // Find the question card that contains this question
    const questionCards =
        document.querySelectorAll(".single-question");

    let currentCard = null;

    questionCards.forEach(function (card) {

        const heading = card.querySelector("h2");

        if (
            heading &&
            question.toLowerCase().includes(
                heading.textContent.trim().toLowerCase()
            )
        ) {
            currentCard = card;
        }
    });


    // If question card not found
    if (!currentCard) {

        console.error(
            "Question card not found for:",
            question
        );

        alert("Question box পাওয়া যায়নি.");

        return;
    }


    // Find answer box
    const answerBox =
        currentCard.querySelector(".answer-box");


    // Find button
    const button =
        currentCard.querySelector(".ai-solve-btn");


    if (!answerBox) {

        console.error("Answer box not found.");

        return;
    }


    // Loading state
    answerBox.style.display = "block";

    answerBox.innerHTML = `
        <p>
            ⏳ <strong>AI solving...</strong>
        </p>
    `;


    if (button) {

        button.disabled = true;

        button.innerHTML =
            "⏳ AI solving...";
    }


    try {

        console.log(
            "Sending question to AI:",
            question
        );


        // ===============================
        // CALL SUPABASE EDGE FUNCTION
        // ===============================

        const { data, error } =
            await supabaseClient.functions.invoke(
                "solve-question",
                {
                    body: {
                        question: question
                    }
                }
            );


        console.log(
            "Solve Question Response:",
            {
                data: data,
                error: error
            }
        );


        // Check Supabase error
        if (error) {

            throw new Error(
                error.message ||
                "Edge Function error"
            );
        }


        // Check response
        if (!data) {

            throw new Error(
                "AI থেকে কোনো response পাওয়া যায়নি."
            );
        }


        // ===============================
        // GET AI ANSWER
        // ===============================

        const answer =
            data.answer ||
            data.data?.answer ||
            data.result ||
            data.data?.result;


        if (!answer) {

            console.error(
                "Unexpected AI response:",
                data
            );

            throw new Error(
                "AI answer পাওয়া গেছে কিন্তু display করার মতো answer field নেই."
            );
        }


        // ===============================
        // DISPLAY ANSWER
        // ===============================

        answerBox.innerHTML = `
            <div class="ai-answer-content">

                <h3>🤖 AI Answer</h3>

                <div class="ai-answer-text">
                    ${formatAIAnswer(answer)}
                </div>

            </div>
        `;


        // Restore button
        if (button) {

            button.disabled = false;

            button.innerHTML =
                "🤖 Solve Again";
        }


        console.log(
            "AI Answer displayed successfully."
        );


    } catch (error) {

        console.error(
            "AI solving error:",
            error
        );


        answerBox.innerHTML = `
            <div class="ai-error">

                ❌ <strong>AI answer পাওয়া যায়নি.</strong>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Unknown error"
                    )}
                </p>

            </div>
        `;


        // Restore button
        if (button) {

            button.disabled = false;

            button.innerHTML =
                "🤖 Try Again";
        }
    }
}


// ===============================
// FORMAT AI ANSWER
// ===============================

function formatAIAnswer(text) {

    let formatted =
        escapeHTML(text);


    // Bold markdown
    formatted =
        formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // Headings
    formatted =
        formatted.replace(
            /^### (.*?)$/gm,
            "<h4>$1</h4>"
        );


    formatted =
        formatted.replace(
            /^## (.*?)$/gm,
            "<h3>$1</h3>"
        );


    // Numbered lists
    formatted =
        formatted.replace(
            /^\s*(\d+)\.\s+(.*?)$/gm,
            "<li>$2</li>"
        );


    // Bullet points
    formatted =
        formatted.replace(
            /^\s*[-*]\s+(.*?)$/gm,
            "<li>$1</li>"
        );


    // Convert line breaks
    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    return formatted;
}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;
}
