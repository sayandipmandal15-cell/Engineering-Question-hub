// ================= QUESTION BANK =================

const questionGrid =
    document.getElementById("questionGrid");

const resultText =
    document.getElementById("resultText");


// ================= LOAD PAPERS =================

async function loadQuestionPapers() {

    questionGrid.innerHTML =
        "<p>⏳ Loading question papers...</p>";


    const { data, error } =
        await supabaseClient
            .from("question_papers")
            .select("*")
            .order("exam_year", {
                ascending: false
            });


    if (error) {

        console.error(error);

        questionGrid.innerHTML =
            "<p>❌ Question papers load হয়নি.</p>";

        return;
    }


    // Read values coming from Home page
    const params =
        new URLSearchParams(
            window.location.search
        );


    const branch =
        params.get("branch");

    const search =
        params.get("search");


    let filteredPapers = data || [];


    // ================= BRANCH FILTER =================

    if (branch) {

        filteredPapers =
            filteredPapers.filter(function (paper) {

                return paper.branch
                    ?.toLowerCase()
                    .includes(
                        branch.toLowerCase()
                    );

            });
    }


    // ================= SEARCH FILTER =================

    if (search) {

        const searchText =
            search.toLowerCase();


        filteredPapers =
            filteredPapers.filter(function (paper) {

                return (

                    paper.subject
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    paper.branch
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    paper.semester
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    paper.university
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    paper.file_name
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    paper.description
                        ?.toLowerCase()
                        .includes(searchText)

                );

            });
    }


    displayQuestionPapers(
        filteredPapers
    );
}


// ================= DISPLAY PAPERS =================

function displayQuestionPapers(papers) {

    questionGrid.innerHTML = "";


    if (
        !papers ||
        papers.length === 0
    ) {

        questionGrid.innerHTML = `
            <p>
                📚 কোনো matching question paper পাওয়া যায়নি।
            </p>
        `;

        resultText.textContent =
            "No question papers found";

        return;
    }


    resultText.textContent =
        `Showing ${papers.length} available paper(s)`;


    papers.forEach(function (paper) {

        const card =
            document.createElement("div");


        card.className =
            "question-card";


        card.innerHTML = `

            <div class="paper-icon">
                📄
            </div>


            <div>

                <span class="badge">
                    ${paper.exam_year}
                </span>


                <h3>
                    ${escapeHTML(
                        paper.subject
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        paper.branch
                    )}
                    •
                    ${escapeHTML(
                        paper.semester
                    )}
                </p>


                <p class="university">
                    ${escapeHTML(
                        paper.university
                    )}
                </p>

            </div>


            <a
                href="${paper.file_url}"
                target="_blank"
                rel="noopener noreferrer"
                class="view-paper-btn"
            >
                View Paper →
            </a>

        `;


        questionGrid.appendChild(card);

    });
}


// ================= FILTER QUESTIONS =================

async function filterQuestions() {

    const university =
        document.getElementById(
            "university"
        ).value;


    const branch =
        document.getElementById(
            "branch"
        ).value;


    const semester =
        document.getElementById(
            "semester"
        ).value;


    const year =
        document.getElementById(
            "year"
        ).value;


    let query =
        supabaseClient
            .from("question_papers")
            .select("*");


    if (university) {

        query =
            query.eq(
                "university",
                university
            );
    }


    if (branch) {

        query =
            query.eq(
                "branch",
                branch
            );
    }


    if (semester) {

        query =
            query.eq(
                "semester",
                semester
            );
    }


    if (year) {

        query =
            query.eq(
                "exam_year",
                Number(year)
            );
    }


    query =
        query.order(
            "exam_year",
            {
                ascending: false
            }
        );


    const {
        data,
        error
    } = await query;


    if (error) {

        console.error(error);

        questionGrid.innerHTML =
            "<p>❌ Search failed.</p>";

        return;
    }


    displayQuestionPapers(data);
}


// ================= HTML ESCAPE =================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


// ================= PAGE LOAD =================

loadQuestionPapers();