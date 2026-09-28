// ============================================================
// ENGINEERING QUESTION HUB
// ADMIN DASHBOARD
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const adminStatus =
    document.getElementById("adminStatus");

const adminPaperList =
    document.getElementById("adminPaperList");


// ============================================================
// CHECK ADMIN ACCESS
// ============================================================

async function checkAdmin() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    // Login check
    if (userError || !user) {

        adminStatus.textContent =
            "❌ আগে Login করতে হবে.";

        adminPaperList.innerHTML = "";

        return false;
    }


    // Check admin_users table
    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();


    if (error) {

        console.error(
            "Admin Check Error:",
            error
        );

        adminStatus.textContent =
            "❌ Admin access check failed.";

        adminPaperList.innerHTML = "";

        return false;
    }


    if (!data) {

        adminStatus.textContent =
            "❌ তোমার Admin access নেই.";

        adminPaperList.innerHTML = `

            <div class="admin-access-denied">

                <h3>
                    🚫 Access Denied
                </h3>

                <p>
                    এই page শুধুমাত্র Admin-এর জন্য।
                </p>

            </div>

        `;

        return false;
    }


    // Admin verified
    adminStatus.innerHTML =
        "✅ <strong>Admin access verified.</strong>";


    return true;
}


// ============================================================
// LOAD ALL QUESTION PAPERS
// ============================================================

async function loadAdminPapers() {

    adminPaperList.innerHTML = `

        <div class="admin-loading">
            ⏳ Papers loading...
        </div>

    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("question_papers")
            .select("*")
            .order(
                "exam_year",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load Papers Error:",
            error
        );

        adminPaperList.innerHTML = `

            <div class="admin-error">

                ❌ Papers load হয়নি.

                <p>
                    ${escapeAdminHTML(error.message)}
                </p>

            </div>

        `;

        return;
    }


    if (!data || data.length === 0) {

        adminPaperList.innerHTML = `

            <div class="admin-empty">

                📚 এখনো কোনো question paper নেই।

            </div>

        `;

        return;
    }


    adminPaperList.innerHTML = "";


    // Create every paper card
    data.forEach(function (paper) {

        const card =
            document.createElement("div");


        card.className =
            "admin-paper-card";


        card.innerHTML = `

            <div class="admin-paper-info">

                <div class="paper-icon">
                    📄
                </div>


                <div class="admin-paper-details">

                    <span class="admin-year-badge">
                        ${escapeAdminHTML(
                            paper.exam_year
                        )}
                    </span>


                    <h3>
                        ${escapeAdminHTML(
                            paper.subject
                        )}
                    </h3>


                    <p>
                        ${escapeAdminHTML(
                            paper.branch
                        )}
                        •
                        ${escapeAdminHTML(
                            paper.semester
                        )}
                    </p>


                    <p class="admin-university">
                        ${escapeAdminHTML(
                            paper.university
                        )}
                    </p>

                </div>

            </div>


            <div class="admin-actions">


                <!-- VIEW -->

                <a
                    href="${escapeAdminAttribute(
                        paper.file_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="admin-action-btn view-btn"
                >
                    👁️ View
                </a>


                <!-- EDIT -->

                <button
                    type="button"
                    class="admin-action-btn edit-btn"
                    onclick="editPaper(${paper.id})"
                >
                    ✏️ Edit
                </button>


                <!-- DELETE -->

                <button
                    type="button"
                    class="admin-action-btn delete-btn"
                    onclick="deletePaper(${paper.id})"
                >
                    🗑️ Delete
                </button>


            </div>

        `;


        adminPaperList.appendChild(card);

    });

}


// ============================================================
// EDIT PAPER
// ============================================================

async function editPaper(id) {

    try {

        // Get selected paper
        const {
            data: paper,
            error
        } =
            await supabaseClient
                .from("question_papers")
                .select("*")
                .eq("id", id)
                .single();


        if (error) {
            throw error;
        }


        if (!paper) {

            alert(
                "❌ Question paper পাওয়া যায়নি."
            );

            return;
        }


        // Remove old modal if exists
        const oldModal =
            document.getElementById(
                "editPaperModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        // Create modal
        const modal =
            document.createElement("div");


        modal.id =
            "editPaperModal";


        modal.innerHTML = `

            <div class="edit-modal-overlay">


                <div class="edit-modal-box">


                    <!-- HEADER -->

                    <div class="edit-modal-header">

                        <div>

                            <h2>
                                ✏️ Edit Question Paper
                            </h2>

                            <p>
                                Question paper-এর information
                                update করো
                            </p>

                        </div>


                        <button
                            type="button"
                            class="edit-close-btn"
                            onclick="closeEditModal()"
                        >
                            ×
                        </button>

                    </div>


                    <!-- FORM -->

                    <form
                        id="editPaperForm"
                    >


                        <!-- UNIVERSITY -->

                        <label>
                            University / Board
                        </label>

                        <input
                            type="text"
                            id="editUniversity"
                            value="${escapeAdminAttribute(
                                paper.university
                            )}"
                            required
                        >


                        <!-- BRANCH -->

                        <label>
                            Branch
                        </label>

                        <input
                            type="text"
                            id="editBranch"
                            value="${escapeAdminAttribute(
                                paper.branch
                            )}"
                            placeholder="CSE, ECE, EEE..."
                            required
                        >


                        <!-- SEMESTER -->

                        <label>
                            Semester
                        </label>

                        <input
                            type="text"
                            id="editSemester"
                            value="${escapeAdminAttribute(
                                paper.semester
                            )}"
                            placeholder="3rd Semester"
                            required
                        >


                        <!-- SUBJECT -->

                        <label>
                            Subject
                        </label>

                        <input
                            type="text"
                            id="editSubject"
                            value="${escapeAdminAttribute(
                                paper.subject
                            )}"
                            required
                        >


                        <!-- YEAR -->

                        <label>
                            Exam Year
                        </label>

                        <input
                            type="number"
                            id="editYear"
                            value="${escapeAdminAttribute(
                                paper.exam_year
                            )}"
                            min="1900"
                            max="2100"
                            required
                        >


                        <!-- DESCRIPTION -->

                        <label>
                            Description
                        </label>

                        <textarea
                            id="editDescription"
                            placeholder="Additional information..."
                        >${escapeAdminHTML(
                            paper.description || ""
                        )}</textarea>


                        <!-- CURRENT FILE -->

                        <div class="current-file-box">

                            <div class="current-file-title">
                                📄 Current Question Paper
                            </div>


                            <a
                                href="${escapeAdminAttribute(
                                    paper.file_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                👁️
                                ${escapeAdminHTML(
                                    paper.file_name
                                )}
                            </a>

                        </div>


                        <!-- REPLACE FILE -->

                        <label>
                            Replace Question Paper
                        </label>

                        <input
                            type="file"
                            id="editFile"
                            accept=".pdf,.jpg,.jpeg,.png"
                        >


                        <p class="edit-help-text">

                            নতুন file select না করলে
                            পুরোনো file একই থাকবে।

                        </p>


                        <!-- STATUS -->

                        <div
                            id="editStatus"
                            class="edit-status"
                        ></div>


                        <!-- BUTTONS -->

                        <div
                            class="edit-modal-actions"
                        >

                            <button
                                type="submit"
                                class="edit-save-btn"
                            >
                                💾 Save Changes
                            </button>


                            <button
                                type="button"
                                class="edit-cancel-btn"
                                onclick="closeEditModal()"
                            >
                                Cancel
                            </button>

                        </div>


                    </form>

                </div>

            </div>

        `;


        document.body.appendChild(modal);


        // Form submit
        const form =
            document.getElementById(
                "editPaperForm"
            );


        form.addEventListener(
            "submit",
            function (event) {

                saveEditedPaper(
                    event,
                    paper
                );

            }
        );


    } catch (error) {

        console.error(
            "Edit Error:",
            error
        );


        alert(
            "❌ Edit form খুলতে সমস্যা হয়েছে:\n" +
            error.message
        );

    }

}


// ============================================================
// SAVE EDITED PAPER
// ============================================================

async function saveEditedPaper(
    event,
    oldPaper
) {

    event.preventDefault();


    const status =
        document.getElementById(
            "editStatus"
        );


    const saveButton =
        document.querySelector(
            ".edit-save-btn"
        );


    try {

        // Get values
        const university =
            document
                .getElementById(
                    "editUniversity"
                )
                .value
                .trim();


        const branch =
            document
                .getElementById(
                    "editBranch"
                )
                .value
                .trim();


        const semester =
            document
                .getElementById(
                    "editSemester"
                )
                .value
                .trim();


        const subject =
            document
                .getElementById(
                    "editSubject"
                )
                .value
                .trim();


        const examYear =
            document
                .getElementById(
                    "editYear"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "editDescription"
                )
                .value
                .trim();


        const newFile =
            document
                .getElementById(
                    "editFile"
                )
                .files[0];


        // ====================================================
        // VALIDATION
        // ====================================================

        if (
            !university ||
            !branch ||
            !semester ||
            !subject ||
            !examYear
        ) {

            status.textContent =
                "❌ সব required field পূরণ করো।";

            return;
        }


        const yearNumber =
            Number(examYear);


        if (
            !Number.isInteger(
                yearNumber
            ) ||
            yearNumber < 1900 ||
            yearNumber > 2100
        ) {

            status.textContent =
                "❌ Valid exam year দাও।";

            return;
        }


        // ====================================================
        // FILE VALIDATION
        // ====================================================

        if (newFile) {

            const allowedTypes = [

                "application/pdf",

                "image/jpeg",

                "image/png"

            ];


            if (
                !allowedTypes.includes(
                    newFile.type
                )
            ) {

                status.textContent =
                    "❌ শুধু PDF, JPG অথবা PNG file দেওয়া যাবে।";

                return;
            }


            // 20 MB
            const maxSize =
                20 * 1024 * 1024;


            if (
                newFile.size >
                maxSize
            ) {

                status.textContent =
                    "❌ File size 20MB-এর বেশি হতে পারবে না।";

                return;
            }

        }


        // ====================================================
        // DISABLE SAVE BUTTON
        // ====================================================

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "⏳ Saving...";

        }


        status.textContent =
            "⏳ Question paper update হচ্ছে...";


        // ====================================================
        // DATA TO UPDATE
        // ====================================================

        let updateData = {

            university:
                university,

            branch:
                branch,

            semester:
                semester,

            subject:
                subject,

            exam_year:
                yearNumber,

            description:
                description

        };


        // ====================================================
        // NEW FILE UPLOAD
        // ====================================================

        let newFilePath =
            null;


        if (newFile) {

            const {
                data: { user },
                error: userError
            } =
                await supabaseClient
                    .auth
                    .getUser();


            if (
                userError ||
                !user
            ) {

                throw new Error(
                    "Login session পাওয়া যায়নি।"
                );

            }


            status.textContent =
                "⏳ নতুন file upload হচ্ছে...";


            // Unique file name
            const fileName =
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .substring(2, 8) +
                "_" +
                newFile.name.replace(
                    /\s+/g,
                    "_"
                );


            newFilePath =
                user.id +
                "/" +
                fileName;


            // Upload
            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from(
                        "question-papers"
                    )
                    .upload(
                        newFilePath,
                        newFile
                    );


            if (uploadError) {
                throw uploadError;
            }


            // Public URL
            const {
                data: publicUrlData
            } =
                supabaseClient
                    .storage
                    .from(
                        "question-papers"
                    )
                    .getPublicUrl(
                        newFilePath
                    );


            updateData.file_name =
                newFile.name;


            updateData.file_url =
                publicUrlData.publicUrl;


            updateData.file_path =
                newFilePath;

        }


        // ====================================================
        // UPDATE DATABASE
        // ====================================================

        status.textContent =
            "⏳ Database update হচ্ছে...";


        const {
            error: updateError
        } =
            await supabaseClient
                .from("question_papers")
                .update(
                    updateData
                )
                .eq(
                    "id",
                    oldPaper.id
                );


        // If DB update fails
        if (updateError) {

            // Remove newly uploaded file
            if (newFilePath) {

                await supabaseClient
                    .storage
                    .from(
                        "question-papers"
                    )
                    .remove([
                        newFilePath
                    ]);

            }


            throw updateError;
        }


        // ====================================================
        // DELETE OLD FILE
        // ====================================================

        if (newFilePath) {

            const oldFilePath =
                getStorageFilePath(
                    oldPaper
                );


            if (
                oldFilePath &&
                oldFilePath !==
                newFilePath
            ) {

                status.textContent =
                    "⏳ পুরোনো file remove হচ্ছে...";


                const {
                    error:
                        deleteOldError
                } =
                    await supabaseClient
                        .storage
                        .from(
                            "question-papers"
                        )
                        .remove([
                            oldFilePath
                        ]);


                if (deleteOldError) {

                    console.warn(
                        "Old file delete failed:",
                        deleteOldError
                    );

                }

            }

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        status.innerHTML =
            "✅ <strong>Successfully updated!</strong>";


        setTimeout(
            async function () {

                closeEditModal();

                await loadAdminPapers();

            },
            700
        );


    } catch (error) {

        console.error(
            "Save Edit Error:",
            error
        );


        status.textContent =
            "❌ Update failed: " +
            (
                error.message ||
                "Unknown error"
            );


        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Save Changes";

        }

    }

}


// ============================================================
// DELETE PAPER
// ============================================================

async function deletePaper(id) {

    const confirmed =
        confirm(
            "এই question paper delete করতে চাও?"
        );


    if (!confirmed) {
        return;
    }


    try {

        // Get paper
        const {
            data: paper,
            error: findError
        } =
            await supabaseClient
                .from("question_papers")
                .select("*")
                .eq("id", id)
                .single();


        if (findError) {
            throw findError;
        }


        // ====================================================
        // DELETE STORAGE FILE
        // ====================================================

        const filePath =
            getStorageFilePath(
                paper
            );


        if (filePath) {

            const {
                error:
                    storageError
            } =
                await supabaseClient
                    .storage
                    .from(
                        "question-papers"
                    )
                    .remove([
                        filePath
                    ]);


            if (storageError) {
                throw storageError;
            }

        }


        // ====================================================
        // DELETE DATABASE ROW
        // ====================================================

        const {
            error: databaseError
        } =
            await supabaseClient
                .from("question_papers")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (databaseError) {
            throw databaseError;
        }


        // ====================================================
        // REFRESH
        // ====================================================

        await loadAdminPapers();


    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );


        alert(
            "❌ Delete failed:\n" +
            error.message
        );

    }

}


// ============================================================
// CLOSE EDIT MODAL
// ============================================================

function closeEditModal() {

    const modal =
        document.getElementById(
            "editPaperModal"
        );


    if (modal) {
        modal.remove();
    }

}


// ============================================================
// GET STORAGE FILE PATH
// ============================================================

function getStorageFilePath(
    paper
) {

    // New records
    if (
        paper.file_path &&
        paper.file_path.trim() !== ""
    ) {

        return paper.file_path;

    }


    // Old records
    if (!paper.file_url) {
        return null;
    }


    try {

        const marker =
            "/storage/v1/object/public/question-papers/";


        const index =
            paper.file_url.indexOf(
                marker
            );


        if (index === -1) {
            return null;
        }


        return decodeURIComponent(
            paper.file_url.substring(
                index +
                marker.length
            )
        );


    } catch (error) {

        console.error(
            "File path error:",
            error
        );

        return null;

    }

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeAdminHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            text ?? ""
        );


    return div.innerHTML;

}


// ============================================================
// ATTRIBUTE ESCAPE
// ============================================================

function escapeAdminAttribute(
    text
) {

    return escapeAdminHTML(
        text
    )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#39;"
        );

}


// ============================================================
// ADMIN DASHBOARD CSS
// ============================================================

const adminStyle =
    document.createElement(
        "style"
    );


adminStyle.textContent = `

/* =========================================================
   ADMIN PAPER CARD
   ========================================================= */

.admin-paper-card {

    background: #ffffff;

    border-radius: 18px;

    padding: 28px;

    margin-bottom: 18px;

    box-shadow:
        0 8px 30px
        rgba(15, 23, 42, 0.08);

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 25px;

}


.admin-paper-info {

    display: flex;

    align-items: center;

    gap: 20px;

    min-width: 0;

}


.paper-icon {

    font-size: 42px;

    flex-shrink: 0;

}


.admin-paper-details {

    min-width: 0;

}


.admin-paper-details h3 {

    margin: 8px 0 7px;

    font-size: 21px;

    color: #111827;

}


.admin-paper-details p {

    margin: 4px 0;

    color: #64748b;

}


.admin-university {

    font-size: 14px;

}


.admin-year-badge {

    display: inline-block;

    background: #eff6ff;

    color: #2563eb;

    padding: 5px 11px;

    border-radius: 20px;

    font-size: 13px;

    font-weight: 700;

}


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

.admin-actions {

    display: flex;

    align-items: center;

    gap: 8px;

    flex-shrink: 0;

}


.admin-action-btn {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    min-width: 90px;

    padding: 11px 16px;

    border: none;

    border-radius: 8px;

    font-size: 14px;

    font-weight: 600;

    text-decoration: none;

    cursor: pointer;

    transition:
        0.2s ease;

    box-sizing: border-box;

}


/* View */

.view-btn {

    background: #2563eb;

    color: #ffffff !important;

}


.view-btn:hover {

    background: #1d4ed8;

    transform:
        translateY(-1px);

}


/* Edit */

.edit-btn {

    background: #2563eb;

    color: #ffffff;

}


.edit-btn:hover {

    background: #1d4ed8;

    transform:
        translateY(-1px);

}


/* Delete */

.delete-btn {

    background: #2563eb;

    color: #ffffff;

}


.delete-btn:hover {

    background: #1d4ed8;

    transform:
        translateY(-1px);

}


/* =========================================================
   LOADING / EMPTY / ERROR
   ========================================================= */

.admin-loading,
.admin-empty,
.admin-error {

    background: #ffffff;

    padding: 25px;

    border-radius: 12px;

    text-align: center;

}


.admin-error {

    color: #dc2626;

}


.admin-access-denied {

    background: #fff;

    padding: 30px;

    border-radius: 15px;

    text-align: center;

}


/* =========================================================
   EDIT MODAL
   ========================================================= */

#editPaperModal {

    position: fixed;

    inset: 0;

    z-index: 99999;

}


.edit-modal-overlay {

    position: fixed;

    inset: 0;

    background:
        rgba(15, 23, 42, 0.60);

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;

    box-sizing: border-box;

}


.edit-modal-box {

    width: 100%;

    max-width: 650px;

    max-height: 90vh;

    overflow-y: auto;

    background: #ffffff;

    border-radius: 18px;

    padding: 28px;

    box-sizing: border-box;

    box-shadow:
        0 25px 70px
        rgba(0, 0, 0, 0.30);

}


.edit-modal-header {

    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 15px;

    margin-bottom: 22px;

}


.edit-modal-header h2 {

    margin: 0 0 5px;

    color: #111827;

}


.edit-modal-header p {

    margin: 0;

    color: #64748b;

    font-size: 14px;

}


.edit-close-btn {

    width: 38px;

    height: 38px;

    border: none;

    border-radius: 50%;

    background: #f1f5f9;

    color: #334155;

    font-size: 25px;

    cursor: pointer;

    flex-shrink: 0;

}


.edit-close-btn:hover {

    background: #e2e8f0;

}


/* Form */

.edit-modal-box label {

    display: block;

    margin-top: 15px;

    margin-bottom: 6px;

    font-weight: 600;

    color: #334155;

}


.edit-modal-box input,
.edit-modal-box textarea {

    width: 100%;

    box-sizing: border-box;

    padding: 12px 13px;

    border: 1px solid #cbd5e1;

    border-radius: 8px;

    font-size: 15px;

    outline: none;

}


.edit-modal-box input:focus,
.edit-modal-box textarea:focus {

    border-color: #2563eb;

    box-shadow:
        0 0 0 3px
        rgba(37, 99, 235, 0.10);

}


.edit-modal-box textarea {

    min-height: 100px;

    resize: vertical;

}


/* Current file */

.current-file-box {

    margin-top: 18px;

    padding: 14px;

    background: #f8fafc;

    border: 1px solid #e2e8f0;

    border-radius: 10px;

}


.current-file-title {

    font-weight: 700;

    margin-bottom: 7px;

}


.current-file-box a {

    color: #2563eb;

    text-decoration: none;

    word-break: break-all;

}


.current-file-box a:hover {

    text-decoration: underline;

}


.edit-help-text {

    margin-top: 7px;

    font-size: 13px;

    color: #64748b;

}


/* Status */

.edit-status {

    min-height: 22px;

    margin-top: 15px;

    font-size: 14px;

    font-weight: 600;

}


/* Modal buttons */

.edit-modal-actions {

    display: flex;

    gap: 10px;

    margin-top: 20px;

}


.edit-modal-actions button {

    flex: 1;

    padding: 12px 18px;

    border: none;

    border-radius: 9px;

    font-size: 15px;

    font-weight: 600;

    cursor: pointer;

}


.edit-save-btn {

    background: #2563eb;

    color: #ffffff;

}


.edit-save-btn:hover {

    background: #1d4ed8;

}


.edit-save-btn:disabled {

    opacity: 0.6;

    cursor: not-allowed;

}


.edit-cancel-btn {

    background: #e5e7eb;

    color: #111827;

}


.edit-cancel-btn:hover {

    background: #d1d5db;

}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 700px) {

    .admin-paper-card {

        flex-direction: column;

        align-items: stretch;

    }


    .admin-paper-info {

        align-items: flex-start;

    }


    .admin-actions {

        width: 100%;

        display: grid;

        grid-template-columns:
            repeat(3, 1fr);

    }


    .admin-action-btn {

        width: 100%;

        min-width: 0;

        padding: 10px 7px;

        font-size: 13px;

    }

}


@media (max-width: 500px) {

    .edit-modal-overlay {

        padding: 10px;

    }


    .edit-modal-box {

        padding: 20px;

        max-height: 95vh;

    }


    .edit-modal-actions {

        flex-direction: column;

    }

}

`;


document.head.appendChild(
    adminStyle
);


// ============================================================
// START ADMIN DASHBOARD
// ============================================================

async function startAdminDashboard() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    await loadAdminPapers();

}


// Start
startAdminDashboard();