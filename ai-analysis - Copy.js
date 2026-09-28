// ================= AI ANALYSIS PAGE =================

const paperSelect = document.getElementById("paperSelect");
const analysisStatus = document.getElementById("analysisStatus");


// ================= LOAD QUESTION PAPERS =================

async function loadPapersForAnalysis() {

    const { data, error } = await supabaseClient
        .from("question_papers")
        .select("id, subject, branch, semester, exam_year, file_url")
        .order("exam_year", { ascending: false });

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

        const option = document.createElement("option");

        option.value = paper.id;

        option.textContent =
            `${paper.subject} - ${paper.branch} - ${paper.exam_year}`;

        option.dataset.fileUrl = paper.file_url;

        paperSelect.appendChild(option);
    });
}


// ================= EXTRACT SECTION =================

function extractSection(text, startPattern, endPatterns) {

    const startRegex = new RegExp(
        startPattern,
        "i"
    );

    const startMatch = text.match(startRegex);

    if (!startMatch) {
        return "";
    }

    const startIndex =
        startMatch.index + startMatch[0].length;

    let endIndex = text.length;

    for (const pattern of endPatterns) {

        const regex = new RegExp(
            pattern,
            "i"
        );

        const match =
            text.slice(startIndex).match(regex);

        if (match) {

            const possibleEnd =
                startIndex + match.index;

            if (possibleEnd < endIndex) {
                endIndex = possibleEnd;
            }
        }
    }

    return text
        .slice(startIndex, endIndex)
        .trim();
}


// ================= CLEAN AI TEXT =================

function cleanAIText(text) {

    if (!text) {
        return "No information available.";
    }

    let cleaned = text;

    // Remove markdown headings
    cleaned = cleaned.replace(/^#{1,6}\s*/gm, "");

    // Remove bold / italic markdown
    cleaned = cleaned.replace(/\*\*/g, "");
    cleaned = cleaned.replace(/__/g, "");
    cleaned = cleaned.replace(/\*/g, "");

    // Remove unwanted markdown symbols
    cleaned = cleaned.replace(/`/g, "");

    // Remove LaTeX wrappers
    cleaned = cleaned.replace(
        /\\text\{([^}]+)\}/g,
        "$1"
    );

    // Replace multiple spaces
    cleaned = cleaned.replace(/[ \t]+/g, " ");

    // Fix excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    return cleaned.trim();
}


// ================= CONVERT AI TEXT TO HTML =================

function formatAIText(text) {

    if (!text) {
        return "<p>No information available.</p>";
    }

    text = cleanAIText(text);

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

    let html = "";

    let listItems = [];

    function closeList() {

        if (listItems.length > 0) {

            html += "<ul>";

            listItems.forEach(function (item) {

                html += `<li>${escapeHTML(item)}</li>`;

            });

            html += "</ul>";

            listItems = [];
        }
    }


    lines.forEach(function (line) {

        // Remove numbering such as:
        // 1.
        // 1)
        // Q1.
        // Q1)
        const numberedMatch =
            line.match(
                /^(?:Q(?:uestion)?\s*)?\d+[\.\)]\s*(.*)$/i
            );


        // Bullet point
        const bulletMatch =
            line.match(
                /^[-•●▪]\s*(.*)$/
            );


        if (numberedMatch) {

            listItems.push(
                numberedMatch[1]
            );

            return;
        }


        if (bulletMatch) {

            listItems.push(
                bulletMatch[1]
            );

            return;
        }


        // If line looks like a heading
        if (
            line.endsWith(":") &&
            line.length < 100
        ) {

            closeList();

            html += `
                <h4>
                    ${escapeHTML(line)}
                </h4>
            `;

            return;
        }


        // Normal paragraph
        closeList();

        html += `
            <p>
                ${escapeHTML(line)}
            </p>
        `;
    });


    closeList();

    return html;
}


// ================= ESCAPE HTML =================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ================= ANALYZE PAPER =================

async function analyzePaper() {

    if (!paperSelect.value) {

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


    analysisStatus.innerHTML =
        "⏳ AI question paper analyse করছে...<br>" +
        "একটু অপেক্ষা করো.";


    // Clear previous results

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

        // ===============================
        // CALL SUPABASE EDGE FUNCTION
        // ===============================

        const { data, error } =
            await supabaseClient.functions.invoke(
                "analyze-paper",
                {
                    body: {
                        fileUrl: fileUrl
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


        // ===============================
        // GET GEMINI TEXT
        // ===============================

        const aiText =
            data.analysis
                ?.candidates?.[0]
                ?.content?.parts
                ?.map(part =>
                    part.text || ""
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


        // ===============================
        // EXTRACT SECTIONS
        // ===============================

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


        // ===============================
        // SHOW RESULTS
        // ===============================

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


        // ===============================
        // SUCCESS MESSAGE
        // ===============================

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


// ================= PAGE LOAD =================

loadPapersForAnalysis();