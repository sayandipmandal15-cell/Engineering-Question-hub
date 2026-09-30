// =====================================================
// ENGINEERINGHUB SCRIPT.JS
// =====================================================


// ================= SEARCH =================

function searchQuestion() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) return;

    const searchValue =
        searchInput.value.trim();

    if (searchValue === "") {

        alert(
            "Please enter a question, subject or topic."
        );

        return;
    }

    alert(
        "Searching for: " +
        searchValue
    );
}


// ================= AI SOLVER =================

function solveQuestion() {

    const questionInput =
        document.getElementById("questionInput");

    const result =
        document.getElementById("aiResult");

    if (!questionInput || !result) return;

    const question =
        questionInput.value.trim();

    if (question === "") {

        result.innerHTML =
            "⚠️ Please enter a question first.";

        return;
    }

    result.innerHTML =
        "<strong>🤖 AI Demo</strong><br><br>" +
        "Your question has been received.<br><br>" +
        "In the next stage, this section will connect " +
        "with our AI system and generate the complete answer.";
}


// ================= OPEN AI =================

function openAI() {

    const aiSection =
        document.getElementById("ai");

    if (!aiSection) return;

    aiSection.scrollIntoView({
        behavior: "smooth"
    });
}


// ================= UPLOAD =================

function uploadQuestion() {

    window.location.href =
        "Engineering-Question-hub.html";
}


// ================= QUESTION BANK =================

function filterQuestions() {

    const branchElement =
        document.getElementById("branch");

    const semesterElement =
        document.getElementById("semester");

    const yearElement =
        document.getElementById("year");

    if (
        !branchElement ||
        !semesterElement ||
        !yearElement
    ) {
        return;
    }

    const branch =
        branchElement.value;

    const semester =
        semesterElement.value;

    const year =
        yearElement.value;

    const cards =
        document.querySelectorAll(
            ".question-card"
        );

    let count = 0;

    cards.forEach(function(card) {

        const cardBranch =
            card.dataset.branch;

        const cardSemester =
            card.dataset.semester;

        const cardYear =
            card.dataset.year;

        const branchMatch =
            branch === "" ||
            branch === cardBranch;

        const semesterMatch =
            semester === "" ||
            semester === cardSemester;

        const yearMatch =
            year === "" ||
            year === cardYear;

        if (
            branchMatch &&
            semesterMatch &&
            yearMatch
        ) {

            card.style.display =
                "flex";

            count++;

        } else {

            card.style.display =
                "none";
        }

    });

    const resultText =
        document.getElementById(
            "resultText"
        );

    if (resultText) {

        resultText.innerText =
            "Found " +
            count +
            " question paper(s)";
    }
}


// ================= VIEW PAPER =================

function viewPaper(paperName) {

    alert(
        "Opening: " +
        paperName +
        "\n\nQuestion Paper page will be connected in the next step."
    );
}


// ================= AI QUESTION SOLVER =================

function solveWithAI(question) {

    const questionCards =
        document.querySelectorAll(
            ".single-question"
        );

    let currentCard = null;

    questionCards.forEach(function(card) {

        const heading =
            card.querySelector("h2");

        if (
            heading &&
            question.includes(
                heading.innerText.substring(0, 20)
            )
        ) {

            currentCard = card;
        }

    });

    if (!currentCard) {

        alert(
            "Question not found."
        );

        return;
    }

    const answerBox =
        currentCard.querySelector(
            ".answer-box"
        );

    if (!answerBox) return;

    answerBox.innerHTML = `

        <strong>🤖 AI Answer</strong>

        <br><br>

        <strong>Answer:</strong>

        <br>

        This is an AI-generated answer preview.

        <br><br>

        The complete AI system will be connected
        in the next stage.

        <br><br>

        <strong>Important:</strong>

        <br>

        This question can also be analysed against
        previous year question papers to identify
        frequently asked topics.

    `;

    answerBox.classList.add(
        "show"
    );
}


// =====================================================
// QUESTION PAPER UPLOAD
// =====================================================

async function submitQuestionPaper(event) {

    event.preventDefault();

    const universityElement =
        document.getElementById(
            "university"
        );

    const branchElement =
        document.getElementById(
            "branch"
        );

    const semesterElement =
        document.getElementById(
            "semester"
        );

    const subjectElement =
        document.getElementById(
            "subject"
        );

    const yearElement =
        document.getElementById(
            "exam_year"
        );

    const fileElement =
        document.getElementById(
            "questionFile"
        );

    const descriptionElement =
        document.getElementById(
            "description"
        );

    const status =
        document.getElementById(
            "uploadStatus"
        );

    if (
        !universityElement ||
        !branchElement ||
        !semesterElement ||
        !subjectElement ||
        !yearElement ||
        !fileElement
    ) {

        return;
    }

    const university =
        universityElement.value.trim();

    const branch =
        branchElement.value.trim();

    const semester =
        semesterElement.value.trim();

    const subject =
        subjectElement.value.trim();

    const year =
        yearElement.value;

    const file =
        fileElement.files[0];

    const description =
        descriptionElement
            ? descriptionElement.value.trim()
            : "";

    if (!file) {

        if (status) {

            status.innerText =
                "⚠️ Please select a question paper file.";
        }

        return;
    }

    const maxSize =
        10 * 1024 * 1024;

    if (file.size > maxSize) {

        if (status) {

            status.innerText =
                "⚠️ File size must be less than 10 MB.";
        }

        return;
    }

    const allowedTypes = [

        "application/pdf",
        "image/jpeg",
        "image/png"

    ];

    if (!allowedTypes.includes(file.type)) {

        if (status) {

            status.innerText =
                "⚠️ Only PDF, JPG, JPEG or PNG files are allowed.";
        }

        return;
    }

    if (status) {

        status.innerText =
            "⏳ Uploading...";
    }

    try {

        const {
            data: {
                user
            },
            error: userError

        } =
            await supabaseClient.auth.getUser();

        if (
            userError ||
            !user
        ) {

            if (status) {

                status.innerText =
                    "⚠️ Please login before uploading.";
            }

            return;
        }

        const fileName =
            Date.now() +
            "_" +
            file.name;

        const {
            error: uploadError

        } =
            await supabaseClient
                .storage
                .from("question-papers")
                .upload(
                    fileName,
                    file
                );

        if (uploadError) {

            console.error(
                uploadError
            );

            if (status) {

                status.innerText =
                    "❌ File upload failed: " +
                    uploadError.message;
            }

            return;
        }

        const {
            data: publicUrlData
        } =
            supabaseClient
                .storage
                .from("question-papers")
                .getPublicUrl(
                    fileName
                );

        const fileUrl =
            publicUrlData.publicUrl;

        const {
            error: databaseError

        } =
            await supabaseClient
                .from("question_papers")
                .insert([

                    {

                        university:
                            university,

                        branch:
                            branch,

                        semester:
                            semester,

                        subject:
                            subject,

                        exam_year:
                            Number(year),

                        file_name:
                            file.name,

                        file_url:
                            fileUrl,

                        description:
                            description,

                        uploaded_by:
                            user.id
                    }

                ]);

        if (databaseError) {

            console.error(
                databaseError
            );

            if (status) {

                status.innerText =
                    "❌ Database save failed: " +
                    databaseError.message;
            }

            return;
        }

        if (status) {

            status.innerHTML = `
                ✅ Question paper uploaded successfully!
            `;
        }

    } catch (error) {

        console.error(
            error
        );

        if (status) {

            status.innerText =
                "❌ Something went wrong.";
        }

    }

}


// =====================================================
// ACCOUNT SYSTEM
// =====================================================


// ================= CURRENT USER =================

async function getCurrentAccount() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) {

            console.error(
                "Auth user error:",
                error
            );

            return null;
        }

        return data.user || null;

    } catch (error) {

        console.error(
            "Account error:",
            error
        );

        return null;
    }
}


// ================= GET ACCOUNT ROLE =================

async function getAccountRole(userId) {

    if (!userId) {

        return "user";
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("admin_users")
                .select("role")
                .eq(
                    "user_id",
                    userId
                )
                .maybeSingle();

        if (error) {

            console.log(
                "Role check:",
                error.message
            );

            return "user";
        }

        if (!data) {

            return "user";
        }

        return data.role || "admin";

    } catch (error) {

        console.error(
            "Role error:",
            error
        );

        return "user";
    }
}


// ================= ROLE LABEL =================

function accountRoleLabel(role) {

    if (role === "owner") {

        return "👑 Owner";
    }

    if (role === "admin") {

        return "🛡️ Admin";
    }

    return "👤 User";
}


// ================= ESCAPE TEXT =================

function escapeAccountText(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// ACCOUNT CSS
// =====================================================

function injectAccountStyles() {

    if (
        document.getElementById(
            "accountSystemStyles"
        )
    ) {

        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "accountSystemStyles";

    style.textContent = `

        .account-btn {

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #7c3aed
                ) !important;

            color: #ffffff !important;

            border: none;

            cursor: pointer;

            font-weight: 700;
        }


        .account-overlay {

            position: fixed;

            inset: 0;

            background:
                rgba(
                    15,
                    23,
                    42,
                    0.65
                );

            backdrop-filter:
                blur(5px);

            z-index: 9998;
        }


        .account-box {

            position: fixed;

            top: 50%;

            left: 50%;

            transform:
                translate(
                    -50%,
                    -46%
                );

            width:
                min(
                    420px,
                    calc(
                        100% - 30px
                    )
                );

            background:
                #ffffff;

            border-radius:
                24px;

            padding:
                30px;

            box-shadow:
                0 25px 70px
                rgba(
                    0,
                    0,
                    0,
                    0.25
                );

            z-index:
                9999;

            opacity: 0;

            transition:
                all 0.2s ease;
        }


        #accountPanel.show
        .account-box {

            opacity: 1;

            transform:
                translate(
                    -50%,
                    -50%
                );
        }


        .account-close {

            position: absolute;

            right: 15px;

            top: 12px;

            width: 36px;

            height: 36px;

            border: none;

            border-radius: 50%;

            background:
                #f1f5f9;

            font-size: 24px;

            cursor: pointer;
        }


        .account-avatar {

            width: 72px;

            height: 72px;

            display: flex;

            align-items: center;

            justify-content: center;

            margin:
                0 auto 15px;

            border-radius: 50%;

            background:
                linear-gradient(
                    135deg,
                    #dbeafe,
                    #ede9fe
                );

            font-size: 35px;
        }


        .account-box h2 {

            text-align: center;

            margin: 0;

            color:
                #0f172a;
        }


        .account-subtitle {

            text-align: center;

            color:
                #64748b;

            margin-top: 6px;
        }


        .account-info-card {

            margin-top: 15px;

            padding: 15px;

            border-radius: 14px;

            background:
                #f8fafc;

            border:
                1px solid #e2e8f0;
        }


        .account-info-label {

            font-size: 11px;

            font-weight: 800;

            letter-spacing: 1px;

            color:
                #64748b;

            margin-bottom: 5px;
        }


        .account-info-value {

            color:
                #0f172a;

            font-weight: 700;

            word-break:
                break-word;
        }


        .account-logout-btn {

            width: 100%;

            margin-top: 22px;

            padding: 13px 16px;

            border: none;

            border-radius: 12px;

            background:
                linear-gradient(
                    135deg,
                    #ef4444,
                    #dc2626
                );

            color: white;

            font-size: 15px;

            font-weight: 800;

            cursor: pointer;
        }

    `;

    document.head.appendChild(
        style
    );
}


// ================= CLOSE ACCOUNT =================

function closeAccountPanel() {

    const panel =
        document.getElementById(
            "accountPanel"
        );

    if (panel) {

        panel.remove();
    }
}


// ================= SHOW ACCOUNT =================

async function showAccountPanel() {

    closeAccountPanel();

    const user =
        await getCurrentAccount();

    if (!user) {

        window.location.href =
            "auth.html";

        return;
    }

    const role =
        await getAccountRole(
            user.id
        );

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "accountPanel";

    panel.innerHTML = `

        <div
            class="account-overlay"
            onclick="closeAccountPanel()"
        ></div>


        <div class="account-box">

            <button
                class="account-close"
                onclick="closeAccountPanel()"
            >
                ×
            </button>


            <div class="account-avatar">
                👤
            </div>


            <h2>
                My Account
            </h2>


            <p class="account-subtitle">
                Your EngineeringHub account
            </p>


            <div class="account-info-card">

                <div class="account-info-label">
                    EMAIL
                </div>

                <div class="account-info-value">

                    ${escapeAccountText(
                        user.email || ""
                    )}

                </div>

            </div>


            <div class="account-info-card">

                <div class="account-info-label">
                    ACCOUNT TYPE
                </div>

                <div class="account-info-value">

                    ${accountRoleLabel(role)}

                </div>

            </div>


            <button
                class="account-logout-btn"
                onclick="logoutUser()"
            >
                🚪 Logout
            </button>

        </div>

    `;

    document.body.appendChild(
        panel
    );

    requestAnimationFrame(
        function() {

            panel.classList.add(
                "show"
            );

        }
    );
}


// ================= LOGOUT =================

async function logoutUser() {

    const confirmed =
        confirm(
            "Logout করতে চাও?"
        );

    if (!confirmed) {

        return;
    }

    const {
        error
    } =
        await supabaseClient
            .auth
            .signOut();

    if (error) {

        alert(
            "❌ Logout হয়নি:\n" +
            error.message
        );

        return;
    }

    closeAccountPanel();

    updateAuthNavigation(
        null
    );

    // Remove Admin Panel immediately
    removeAdminPanelButton();

    alert(
        "✅ Logout সফল হয়েছে।"
    );

    window.location.href =
        "index.html";
}


// ================= LOGIN / ACCOUNT BUTTON =================

async function updateAuthNavigation(
    existingUser
) {

    const loginButtons =
        document.querySelectorAll(
            ".login-btn"
        );

    const user =
        existingUser ||
        await getCurrentAccount();

    loginButtons.forEach(
        function(button) {

            const replacement =
                button.cloneNode(false);

            if (user) {

                replacement.className =
                    "login-btn account-btn";

                replacement.type =
                    "button";

                replacement.textContent =
                    "👤 Account";

                replacement.onclick =
                    showAccountPanel;

                replacement.title =
                    user.email ||
                    "My Account";

            } else {

                replacement.className =
                    "login-btn";

                replacement.type =
                    "button";

                replacement.textContent =
                    "Login";

                replacement.onclick =
                    function() {

                        window.location.href =
                            "auth.html";

                    };
            }

            button.replaceWith(
                replacement
            );

        }
    );
}


// =====================================================
// ADMIN PANEL BUTTON SYSTEM
// =====================================================


// Prevent simultaneous Admin Panel creation
let adminPanelButtonLoading = false;


// ================= REMOVE ADMIN BUTTON =================

function removeAdminPanelButton() {

    const existingButton =
        document.getElementById(
            "engineeringHubAdminPanel"
        );

    if (existingButton) {

        existingButton.remove();
    }


    // Also remove any old duplicate
    document
        .querySelectorAll(
            "button, a"
        )
        .forEach(
            function(element) {

                const text =
                    element.innerText
                        .trim();

                if (
                    text === "Admin Panel" ||
                    text === "👑 Admin Panel" ||
                    text === "🛡️ Admin Panel"
                ) {

                    element.remove();
                }

            }
        );
}


// ================= SHOW ADMIN PANEL =================

async function showAdminPanelButton() {

    // If another role-check is already running,
    // don't start another one.
    if (adminPanelButtonLoading) {

        return;
    }

    adminPanelButtonLoading = true;


    try {

        // Always remove old button first.
        removeAdminPanelButton();


        // Check logged-in user
        const {
            data: {
                user
            },
            error: userError
        } =
            await supabaseClient.auth.getUser();


        // No logged-in user
        if (
            userError ||
            !user
        ) {

            return;
        }


        // Secure role check
        const {
            data: role,
            error: roleError
        } =
            await supabaseClient.rpc(
                "get_my_role"
            );


        if (roleError) {

            console.error(
                "Admin role check failed:",
                roleError
            );

            return;
        }


        // Normal user
        // No Admin Panel
        if (
            role !== "admin" &&
            role !== "owner"
        ) {

            return;
        }


        // Find Account button
        const accountButton =
            document.querySelector(
                ".login-btn.account-btn"
            );


        if (!accountButton) {

            return;
        }


        // Final duplicate safety check
        if (
            document.getElementById(
                "engineeringHubAdminPanel"
            )
        ) {

            return;
        }


        // Create ONE Admin Panel button
        const adminButton =
            document.createElement(
                "button"
            );


        adminButton.id =
            "engineeringHubAdminPanel";


        adminButton.type =
            "button";


        adminButton.innerHTML =
            role === "owner"
                ? "👑 Admin Panel"
                : "🛡️ Admin Panel";


        adminButton.style.cssText = `

            border: none;

            background:
                linear-gradient(
                    135deg,
                    #ff7a18,
                    #ff3d81
                );

            color: white;

            padding:
                11px 20px;

            border-radius:
                10px;

            font-size:
                14px;

            font-weight:
                700;

            cursor:
                pointer;

            margin-right:
                10px;

            box-shadow:
                0 6px 18px
                rgba(
                    255,
                    61,
                    129,
                    0.25
                );

        `;


        adminButton.onclick =
            function() {

                window.location.href =
                    "admin.html";

            };


        // Put Admin Panel immediately
        // before Account button
        accountButton.parentNode.insertBefore(
            adminButton,
            accountButton
        );


    } catch (error) {

        console.error(
            "Admin Panel error:",
            error
        );

    } finally {

        // Allow future login/logout checks
        adminPanelButtonLoading =
            false;
    }
}


// =====================================================
// ACCOUNT NAVIGATION
// =====================================================

function setupAccountNavigation() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "Supabase client not found."
        );

        return;
    }


    injectAccountStyles();


    // Initial account check
    updateAuthNavigation()
        .then(
            function() {

                // Wait until Account button
                // is available, then check role.
                setTimeout(
                    showAdminPanelButton,
                    300
                );

            }
        );


    // ONE auth listener only.
    // This prevents duplicate Admin Panel calls.
    supabaseClient.auth.onAuthStateChange(
        function(
            _event,
            session
        ) {

            // Remove Admin Panel first
            if (!session) {

                removeAdminPanelButton();

                updateAuthNavigation(
                    null
                );

                return;
            }


            updateAuthNavigation(
                session.user
            );


            // Wait for Account button replacement
            setTimeout(
                showAdminPanelButton,
                300
            );

        }
    );


    // Escape key closes Account panel
    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeAccountPanel();
            }

        }
    );
}


// ================= AUTH =================


// ================= CREATE ACCOUNT =================

async function createAccount() {

    const emailInput =
        document.getElementById("email") ||
        document.getElementById("authEmail");

    const passwordInput =
        document.getElementById("password") ||
        document.getElementById("authPassword");

    const status =
        document.getElementById(
            "authStatus"
        );

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";

    if (
        !email ||
        !password
    ) {

        if (status) {

            status.innerText =
                "⚠️ Email and password দিন.";

        } else {

            alert(
                "Email and password দিতে হবে."
            );
        }

        return;
    }


    if (status) {

        status.innerText =
            "⏳ Account তৈরি হচ্ছে...";
    }


    const {
        error
    } =
        await supabaseClient
            .auth
            .signUp({

                email:
                    email,

                password:
                    password

            });


    if (error) {

        if (status) {

            status.innerText =
                "❌ " +
                error.message;

        } else {

            alert(
                "❌ Account তৈরি হয়নি:\n" +
                error.message
            );
        }

        return;
    }


    if (status) {

        status.innerText =
            "✅ Account তৈরি হয়েছে! আপনার email check করুন.";

    } else {

        alert(
            "✅ Account তৈরি হয়েছে! আপনার email check করুন."
        );
    }
}


// ================= LOGIN =================

async function loginUser() {

    const emailInput =
        document.getElementById("email") ||
        document.getElementById("authEmail");

    const passwordInput =
        document.getElementById("password") ||
        document.getElementById("authPassword");

    const status =
        document.getElementById(
            "authStatus"
        );

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";

    if (
        !email ||
        !password
    ) {

        if (status) {

            status.innerText =
                "⚠️ Email and password দিন.";

        } else {

            alert(
                "Email and password দিতে হবে."
            );
        }

        return;
    }


    if (status) {

        status.innerText =
            "⏳ Login হচ্ছে...";
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInWithPassword({

                email:
                    email,

                password:
                    password

            });


    if (error) {

        if (status) {

            status.innerText =
                "❌ " +
                error.message;

        } else {

            alert(
                "❌ Login হয়নি:\n" +
                error.message
            );
        }

        return;
    }


    if (
        !data ||
        !data.user
    ) {

        if (status) {

            status.innerText =
                "❌ User পাওয়া যায়নি.";

        }

        return;
    }


    if (status) {

        status.innerText =
            "✅ Login successful!";
    }


    // Redirect to home.
    // Admin Panel will automatically appear
    // after the session is detected.
    setTimeout(
        function() {

            window.location.href =
                "index.html";

        },
        500
    );
}


// ================= PROTECT AUTH PAGE =================

async function protectAuthPage() {

    const authForm =
        document.getElementById(
            "authForm"
        );

    if (!authForm) {

        return;
    }


    const user =
        await getCurrentAccount();


    if (user) {

        window.location.href =
            "index.html";
    }
}


// =====================================================
// START
// =====================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        function() {

            setupAccountNavigation();

            protectAuthPage();

        }
    );

} else {

    setupAccountNavigation();

    protectAuthPage();
}
