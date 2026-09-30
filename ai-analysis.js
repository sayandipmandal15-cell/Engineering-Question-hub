// ================= AI ANALYSIS PAGE =================

const paperSelect =
    document.getElementById("paperSelect");

const analysisStatus =
    document.getElementById("analysisStatus");


// =====================================================
// LOAD QUESTION PAPERS
// =====================================================

async function loadPapersForAnalysis() {

    const { data, error } =
        await supabaseClient
            .from("question_papers")
            .select(
                "id, subject, branch, semester, exam_year, file_url"
            )
            .order("exam_year", {
                ascending: false
            });


    if (error) {

        console.error(error);

        paperSelect.innerHTML = `
            <option value="">
                ❌ Papers load হয়নি
            </option>
        `;

        return;
    }


    paperSelect.innerHTML = `
        <option value="">
            -- Select a Question Paper --
        </option>
    `;


    data.forEach(function (paper) {

        const option =
            document.createElement("option");


        option.value =
            paper.id;


        option.textContent =
            `${paper.subject} - ${paper.branch} - ${paper.exam_year}`;


        option.dataset.fileUrl =
            paper.file_url;


        paperSelect.appendChild(option);

    });

}


// =====================================================
// EXTRACT SECTION
// =====================================================

function extractSection(
    text,
    startPattern,
    endPatterns
) {

    const startRegex =
        new RegExp(
            startPattern,
            "i"
        );


    const startMatch =
        text.match(startRegex);


    if (!startMatch) {
        return "";
    }


    const startIndex =
        startMatch.index +
        startMatch[0].length;


    let endIndex =
        text.length;


    for (const pattern of endPatterns) {

        const regex =
            new RegExp(
                pattern,
                "i"
            );


        const match =
            text
                .slice(startIndex)
                .match(regex);


        if (match) {

            const possibleEnd =
                startIndex +
                match.index;


            if (
                possibleEnd <
                endIndex
            ) {

                endIndex =
                    possibleEnd;
            }
        }
    }


    return text
        .slice(
            startIndex,
            endIndex
        )
        .trim();
}


// =====================================================
// CLEAN AI TEXT
// =====================================================

function cleanAIText(text) {

    if (!text) {

        return "No information available.";
    }


    let cleaned =
        String(text);


    // -----------------------------------------
    // Remove Markdown headings
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /^#{1,6}\s*/gm,
            ""
        );


    // -----------------------------------------
    // Convert bold / italic Markdown
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /\*\*(.*?)\*\*/g,
            "$1"
        );


    cleaned =
        cleaned.replace(
            /__(.*?)__/g,
            "$1"
        );


    cleaned =
        cleaned.replace(
            /\*(.*?)\*/g,
            "$1"
        );


    // -----------------------------------------
    // Remove code backticks
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /`/g,
            ""
        );


    // -----------------------------------------
    // Remove LaTeX text wrapper
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /\\text\{([^}]+)\}/g,
            "$1"
        );


    // -----------------------------------------
    // Remove math $ wrappers
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /\$/g,
            ""
        );


    // -----------------------------------------
    // Convert LaTeX superscript
    // Example: 2^{10} → 2¹⁰
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /\^\{([^}]+)\}/g,
            function (match, value) {

                return "^" +
                    convertSuperscript(
                        value
                    );
            }
        );


    // -----------------------------------------
    // Convert normal exponent
    // Example: 2^10 → 2¹⁰
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /\^([0-9]+)/g,
            function (match, value) {

                return "^" +
                    convertSuperscript(
                        value
                    );
            }
        );


    // -----------------------------------------
    // Remove excessive spaces
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /[ \t]+/g,
            " "
        );


    // -----------------------------------------
    // Fix blank lines
    // -----------------------------------------

    cleaned =
        cleaned.replace(
            /\n{3,}/g,
            "\n\n"
        );


    return cleaned.trim();
}


// =====================================================
// SUPERSCRIPT CONVERTER
// =====================================================

function convertSuperscript(value) {

    const map = {

        "0": "⁰",
        "1": "¹",
        "2": "²",
        "3": "³",
        "4": "⁴",
        "5": "⁵",
        "6": "⁶",
        "7": "⁷",
        "8": "⁸",
        "9": "⁹",
        "+": "⁺",
        "-": "⁻",
        "=": "⁼",
        "(": "⁽",
        ")": "⁾"

    };


    return String(value)
        .split("")
        .map(function (char) {

            return map[char] || char;

        })
        .join("");
}


// =====================================================
// CONVERT AI TEXT TO HTML
// =====================================================

function formatAIText(text) {

    if (!text) {

        return `
            <p class="empty-ai-result">
                No information available.
            </p>
        `;
    }


    text =
        cleanAIText(text);


    const lines =
        text
            .split("\n")
            .map(function (line) {
                return line.trim();
            })
            .filter(function (line) {
                return line !== "";
            });


    let html = "";

    let listItems = [];


    // =================================================
    // CLOSE LIST
    // =================================================

    function closeList() {

        if (
            listItems.length === 0
        ) {

            return;
        }


        html += `
            <ul class="ai-result-list">
        `;


        listItems.forEach(
            function (item) {

                html += `
                    <li>
                        ${escapeHTML(item)}
                    </li>
                `;

            }
        );


        html += `
            </ul>
        `;


        listItems = [];
    }


    // =================================================
    // PROCESS EACH LINE
    // =================================================

    lines.forEach(
        function (line) {


            // -----------------------------------------
            // Markdown heading
            // -----------------------------------------

            if (
                /^#{1,6}\s*/.test(line)
            ) {

                closeList();


                const heading =
                    line.replace(
                        /^#{1,6}\s*/,
                        ""
                    );


                html += `
                    <h4 class="ai-subheading">
                        ${escapeHTML(heading)}
                    </h4>
                `;


                return;
            }


            // -----------------------------------------
            // Numbered list
            // 1. Topic
            // 1) Topic
            // Q1. Topic
            // -----------------------------------------

            const numberedMatch =
                line.match(
                    /^(?:Q(?:uestion)?\s*)?\d+[\.\)]\s*(.*)$/i
                );


            if (numberedMatch) {

                listItems.push(
                    numberedMatch[1]
                );


                return;
            }


            // -----------------------------------------
            // Bullet list
            // -----------------------------------------

            const bulletMatch =
                line.match(
                    /^[-•●▪◦]\s*(.*)$/
                );


            if (bulletMatch) {

                listItems.push(
                    bulletMatch[1]
                );


                return;
            }


            // -----------------------------------------
            // Step format
            // Step 1:
            // -----------------------------------------

            const stepMatch =
                line.match(
                    /^(Step\s+\d+\s*:?)\s*(.*)$/i
                );


            if (stepMatch) {

                closeList();


                html += `
                    <div class="ai-step">
                        <strong>
                            ${escapeHTML(
                                stepMatch[1]
                            )}
                        </strong>

                        ${
                            stepMatch[2]
                                ? `
                                    <span>
                                        ${escapeHTML(
                                            stepMatch[2]
                                        )}
                                    </span>
                                  `
                                : ""
                        }
                    </div>
                `;


                return;
            }


            // -----------------------------------------
            // Heading-like line ending with :
            // -----------------------------------------

            if (
                line.endsWith(":") &&
                line.length < 100
            ) {

                closeList();


                html += `
                    <h4 class="ai-subheading">
                        ${escapeHTML(line)}
                    </h4>
                `;


                return;
            }


            // -----------------------------------------
            // Normal paragraph
            // -----------------------------------------

            closeList();


            html += `
                <p class="ai-result-paragraph">
                    ${escapeHTML(line)}
                </p>
            `;

        }
    );


    closeList();


    return html;
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        String(text);


    return div.innerHTML;
}


// =====================================================
// ANALYZE PAPER
// =====================================================

async function analyzePaper() {

    if (
        !paperSelect.value
    ) {

        analysisStatus.textContent =
            "❌ আগে একটি question paper select করো.";

        return;
    }


    const selectedOption =
        paperSelect.options[
            paperSelect.selectedIndex
        ];


    const fileUrl =
        selectedOption.dataset.fileUrl;


    if (!fileUrl) {

        analysisStatus.textContent =
            "❌ Question paper file পাওয়া যায়নি.";

        return;
    }


    // =================================================
    // SHOW LOADING
    // =================================================

    analysisStatus.innerHTML =
        "⏳ AI question paper analyse করছে...<br>" +
        "একটু অপেক্ষা করো.";


    // =================================================
    // CLEAR PREVIOUS RESULTS
    // =================================================

    document.getElementById(
        "importantTopics"
    ).innerHTML =
        "<p>Analysing...</p>";


    document.getElementById(
        "repeatedTopics"
    ).innerHTML =
        "<p>Analysing...</p>";


    document.getElementById(
        "importantQuestions"
    ).innerHTML =
        "<p>Analysing...</p>";


    document.getElementById(
        "studyRecommendation"
    ).innerHTML =
        "<p>Analysing...</p>";


    try {


        // =================================================
        // CALL SUPABASE EDGE FUNCTION
        // =================================================

        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "analyze-paper",
                {
                    body: {
                        fileUrl:
                            fileUrl
                    }
                }
            );


        if (error) {

            console.error(
                "Edge Function Error:",
                error
            );

            throw error;
        }


        if (
            !data ||
            !data.analysis
        ) {

            throw new Error(
                "AI থেকে কোনো analysis পাওয়া যায়নি."
            );
        }


        // =================================================
        // GET GEMINI TEXT
        // =================================================

        const aiText =
            data.analysis
                ?.candidates?.[0]
                ?.content?.parts
                ?.map(
                    function (part) {

                        return part.text || "";

                    }
                )
                ?.join("\n")
                ?.trim();


        if (!aiText) {

            console.error(
                "Gemini Response:",
                data
            );


            throw new Error(
                "AI response empty."
            );
        }


        console.log(
            "AI RESPONSE:",
            aiText
        );


        // =================================================
        // EXTRACT SECTIONS
        // =================================================

        const importantTopics =
            extractSection(
                aiText,

                "(?:1\\.?\\s*)?Important Topics",

                [
                    "2\\.?\\s*Repeated Questions",
                    "Repeated Questions",
                    "3\\.?\\s*Important Questions",
                    "Important Questions",
                    "4\\.?\\s*Study Recommendation",
                    "Study Recommendation"
                ]
            );


        const repeatedTopics =
            extractSection(
                aiText,

                "(?:2\\.?\\s*)?Repeated Questions\\s*(?:/\\s*Topics)?",

                [
                    "3\\.?\\s*Important Questions",
                    "Important Questions",
                    "4\\.?\\s*Study Recommendation",
                    "Study Recommendation"
                ]
            );


        const importantQuestions =
            extractSection(
                aiText,

                "(?:3\\.?\\s*)?Important Questions",

                [
                    "4\\.?\\s*Study Recommendation",
                    "Study Recommendation"
                ]
            );


        const studyRecommendation =
            extractSection(
                aiText,

                "(?:4\\.?\\s*)?Study Recommendation",

                []
            );


        // =================================================
        // SHOW RESULTS
        // =================================================

        document.getElementById(
            "importantTopics"
        ).innerHTML =
            formatAIText(
                importantTopics
            );


        document.getElementById(
            "repeatedTopics"
        ).innerHTML =
            formatAIText(
                repeatedTopics
            );


        document.getElementById(
            "importantQuestions"
        ).innerHTML =
            formatAIText(
                importantQuestions
            );


        document.getElementById(
            "studyRecommendation"
        ).innerHTML =
            formatAIText(
                studyRecommendation
            );


        // =================================================
        // SUCCESS MESSAGE
        // =================================================

        analysisStatus.innerHTML =
            "✅ <strong>AI analysis complete!</strong><br>" +
            "Question paper successfully analysed.";


    } catch (error) {

        console.error(
            "AI Analysis Error:",
            error
        );


        analysisStatus.innerHTML =
            "❌ <strong>AI analysis failed.</strong><br>" +
            escapeHTML(
                error.message ||
                "Unknown error"
            );


        document.getElementById(
            "importantTopics"
        ).innerHTML =
            "<p>Analysis failed.</p>";


        document.getElementById(
            "repeatedTopics"
        ).innerHTML =
            "<p>Analysis failed.</p>";


        document.getElementById(
            "importantQuestions"
        ).innerHTML =
            "<p>Analysis failed.</p>";


        document.getElementById(
            "studyRecommendation"
        ).innerHTML =
            "<p>Analysis failed.</p>";
    }
}


// =====================================================
// PAGE LOAD
// =====================================================

loadPapersForAnalysis();
