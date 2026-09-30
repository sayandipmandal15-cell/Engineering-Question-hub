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

const totalUsers =
    document.getElementById("totalUsers");

const totalAdmins =
    document.getElementById("totalAdmins");

const onlineUsers =
    document.getElementById("onlineUsers");


// ============================================================
// CURRENT USER / OWNER STATUS
// ============================================================

let currentUser = null;
let currentUserRole = null;


// ============================================================
// CHECK ADMIN ACCESS
// ============================================================

async function checkAdmin() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        adminStatus.textContent =
            "❌ আগে Login করতে হবে.";

        adminPaperList.innerHTML = "";

        return false;
    }


    currentUser = user;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_users")
            .select("user_id, role")
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


    currentUserRole =
        data.role || "admin";


    adminStatus.innerHTML =
        "✅ <strong>Admin access verified.</strong>";


    return true;
}


// ============================================================
// CHECK OWNER
// ============================================================

async function isCurrentUserOwner() {

    if (!currentUser) {
        return false;
    }


    return currentUserRole === "owner";
}


// ============================================================
// GET USER PRESENCE
// ============================================================
//
// Online status is read from user_presence when that table exists.
// A user is considered online when last_seen_at is within 2 minutes.
// If the presence table/policy is not ready yet, the dashboard keeps
// working and simply shows Offline/— instead of breaking.
// ============================================================

async function loadPresenceMap() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("user_presence")
            .select("user_id, last_seen_at");


        if (error) {
            console.warn("Presence unavailable:", error.message);
            return new Map();
        }


        const map = new Map();

        const now = Date.now();

        const onlineWindow = 2 * 60 * 1000;

        (data || []).forEach(function (row) {

            if (!row.user_id || !row.last_seen_at) {
                return;
            }

            const lastSeen = new Date(row.last_seen_at).getTime();

            if (!Number.isNaN(lastSeen)) {
                map.set(
                    row.user_id,
                    now - lastSeen <= onlineWindow
                );
            }

        });

        return map;

    } catch (error) {

        console.warn("Presence load failed:", error);
        return new Map();

    }

}


function getPresenceHTML(isOnline) {

    if (isOnline) {
        return `
            <span class="user-presence online-presence">
                <span class="presence-dot"></span>
                Online
            </span>
        `;
    }


    return `
        <span class="user-presence offline-presence">
            <span class="presence-dot"></span>
            Offline
        </span>
    `;
}


// ============================================================
// LOAD ADMIN OVERVIEW
// ============================================================

async function loadAdminOverview() {

    if (
        !totalUsers ||
        !totalAdmins ||
        !onlineUsers
    ) {
        return;
    }


    // Loading state

    totalUsers.textContent = "…";
    totalAdmins.textContent = "…";
    onlineUsers.textContent = "…";


    try {

        const isOwner =
            await isCurrentUserOwner();


        // ====================================================
        // OWNER
        // Owner RPC থেকে সব users পাওয়া যাবে
        // ====================================================

        if (isOwner) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "get_owner_user_list"
                    );


            if (error) {
                throw error;
            }


            const users =
                data || [];


            const admins =
                users.filter(
                    function (user) {

                        return (
                            user.role === "admin" ||
                            user.role === "owner"
                        );

                    }
                );


            totalUsers.textContent =
                users.length;


            totalAdmins.textContent =
                admins.length;


        } else {

            // =================================================
            // NORMAL ADMIN
            // নিজের admin status অনুযায়ী minimum information
            // =================================================

            totalUsers.textContent =
                "—";


            totalAdmins.textContent =
                "—";

        }


        // ====================================================
        // ONLINE
        // Only Owner can see the user presence summary.
        // ====================================================

        if (isOwner) {

            const presenceMap =
                await loadPresenceMap();

            let onlineCount = 0;

            presenceMap.forEach(function (isOnline) {
                if (isOnline) {
                    onlineCount++;
                }
            });

            onlineUsers.textContent =
                presenceMap.size > 0
                    ? onlineCount
                    : "—";

        } else {

            onlineUsers.textContent =
                "—";

        }


    } catch (error) {

        console.error(
            "Admin Overview Error:",
            error
        );


        totalUsers.textContent =
            "—";


        totalAdmins.textContent =
            "—";


        onlineUsers.textContent =
            "—";

    }

}


// ============================================================
// LOAD OWNER MANAGEMENT
// ============================================================

async function loadOwnerManagement() {

    const ownerSection =
        document.getElementById(
            "ownerManagement"
        );


    if (!ownerSection) {
        return;
    }


    const owner =
        await isCurrentUserOwner();


    if (!owner) {

        ownerSection.style.display =
            "none";

        return;
    }


    ownerSection.style.display =
        "block";


    await loadOwnerUserList();
}


// ============================================================
// LOAD OWNER USER LIST
// ============================================================

async function loadOwnerUserList() {

    const ownerInfo =
        document.getElementById(
            "ownerInfo"
        );

    const adminUserList =
        document.getElementById(
            "adminUserList"
        );

    const normalUserList =
        document.getElementById(
            "normalUserList"
        );


    if (ownerInfo) {

        ownerInfo.innerHTML =
            "<p>⏳ Loading...</p>";

    }


    if (adminUserList) {

        adminUserList.innerHTML =
            "<p>⏳ Loading admins...</p>";

    }


    if (normalUserList) {

        normalUserList.innerHTML =
            "<p>⏳ Loading users...</p>";

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "get_owner_user_list"
                );


        if (error) {
            throw error;
        }


        const users =
            data || [];


        const owners =
            users.filter(
                function (user) {

                    return user.role === "owner";

                }
            );


        const admins =
            users.filter(
                function (user) {

                    return user.role === "admin";

                }
            );


        const normalUsers =
            users.filter(
                function (user) {

                    return (
                        !user.role ||
                        user.role === "user"
                    );

                }
            );


        const presenceMap =
            await loadPresenceMap();


        // ====================================================
        // OWNER
        // ====================================================

        if (ownerInfo) {

            if (owners.length === 0) {

                ownerInfo.innerHTML =
                    "<p>Owner পাওয়া যায়নি.</p>";

            } else {

                ownerInfo.innerHTML =
                    owners.map(
                        function (user) {

                            return `

                                <div class="admin-user-card owner-card">

                                    <div class="admin-user-main">

                                        <div class="admin-user-avatar">
                                            👑
                                        </div>

                                        <div>

                                            <div class="admin-user-name admin-name-with-status">
                                                <span>Owner</span>
                                                ${getPresenceHTML(
                                                    presenceMap.get(user.user_id) === true
                                                )}
                                            </div>

                                            <div class="admin-user-email">
                                                ${escapeAdminHTML(
                                                    user.email
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                    <div class="admin-role-badge owner-badge">
                                        👑 OWNER
                                    </div>

                                </div>

                            `;

                        }
                    ).join("");

            }

        }


        // ====================================================
        // ADMINS
        // ====================================================

        if (adminUserList) {

            if (admins.length === 0) {

                adminUserList.innerHTML = `

                    <div class="admin-empty-user">
                        🛡️ এখনো কোনো additional Admin নেই।
                    </div>

                `;

            } else {

                adminUserList.innerHTML =
                    admins.map(
                        function (user) {

                            return `

                                <div class="admin-user-card">

                                    <div class="admin-user-main">

                                        <div class="admin-user-avatar">
                                            🛡️
                                        </div>

                                        <div>

                                            <div class="admin-user-name admin-name-with-status">
                                                <span>Admin</span>
                                                ${getPresenceHTML(
                                                    presenceMap.get(user.user_id) === true
                                                )}
                                            </div>

                                            <div class="admin-user-email">
                                                ${escapeAdminHTML(
                                                    user.email
                                                )}
                                            </div>

                                        </div>

                                    </div>


                                    <div class="admin-user-right">

                                        <div class="admin-role-badge admin-badge">
                                            🛡️ ADMIN
                                        </div>


                                        <button
                                            type="button"
                                            class="remove-admin-btn"
                                            onclick="removeAdminAccess('${escapeAdminAttribute(user.user_id)}')"
                                        >
                                            ❌ Remove Admin
                                        </button>

                                    </div>

                                </div>

                            `;

                        }
                    ).join("");

            }

        }


        // ====================================================
        // NORMAL USERS
        // ====================================================

        if (normalUserList) {

            if (normalUsers.length === 0) {

                normalUserList.innerHTML = `

                    <div class="admin-empty-user">
                        👤 কোনো normal user পাওয়া যায়নি।
                    </div>

                `;

            } else {

                normalUserList.innerHTML =
                    normalUsers.map(
                        function (user) {

                            return `

                                <div class="admin-user-card">

                                    <div class="admin-user-main">

                                        <div class="admin-user-avatar">
                                            👤
                                        </div>

                                        <div>

                                            <div class="admin-user-name admin-name-with-status">
                                                <span>User</span>
                                                ${getPresenceHTML(
                                                    presenceMap.get(user.user_id) === true
                                                )}
                                            </div>

                                            <div class="admin-user-email">
                                                ${escapeAdminHTML(
                                                    user.email
                                                )}
                                            </div>

                                        </div>

                                    </div>


                                    <div class="admin-user-right">

                                        <div class="admin-role-badge user-badge">
                                            👤 USER
                                        </div>


                                        <button
                                            type="button"
                                            class="give-admin-btn"
                                            onclick="giveAdminAccess('${escapeAdminAttribute(user.user_id)}')"
                                        >
                                            🛡️ Give Admin Access
                                        </button>

                                    </div>

                                </div>

                            `;

                        }
                    ).join("");

            }

        }


    } catch (error) {

        console.error(
            "Owner User List Error:",
            error
        );


        if (ownerInfo) {

            ownerInfo.innerHTML =
                "<p>❌ Owner information load হয়নি.</p>";

        }


        if (adminUserList) {

            adminUserList.innerHTML =
                "<p>❌ Admin list load হয়নি.</p>";

        }


        if (normalUserList) {

            normalUserList.innerHTML =
                "<p>❌ User list load হয়নি.</p>";

        }

    }

}


// ============================================================
// GIVE ADMIN ACCESS
// ============================================================

async function giveAdminAccess(userId) {

    if (!(await isCurrentUserOwner())) {

        alert(
            "❌ শুধু Owner Admin Access দিতে পারবে।"
        );

        return;
    }


    const confirmed =
        confirm(
            "এই User-কে Admin Access দিতে চাও?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("admin_users")
                .insert({

                    user_id:
                        userId,

                    role:
                        "admin"

                });


        if (error) {
            throw error;
        }


        alert(
            "✅ Admin Access দেওয়া হয়েছে।"
        );


        await loadOwnerUserList();

        await loadAdminOverview();


    } catch (error) {

        console.error(
            "Give Admin Access Error:",
            error
        );


        alert(
            "❌ Admin Access দেওয়া যায়নি:\n" +
            error.message
        );

    }

}


// ============================================================
// REMOVE ADMIN ACCESS
// ============================================================

async function removeAdminAccess(userId) {

    if (!(await isCurrentUserOwner())) {

        alert(
            "❌ শুধু Owner Admin Access remove করতে পারবে।"
        );

        return;
    }


    if (
        currentUser &&
        currentUser.id === userId
    ) {

        alert(
            "❌ Owner নিজের Admin Access remove করতে পারবে না।"
        );

        return;
    }


    const confirmed =
        confirm(
            "এই Admin-এর Admin Access remove করতে চাও?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("admin_users")
                .delete()
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "role",
                    "admin"
                );


        if (error) {
            throw error;
        }


        alert(
            "✅ Admin Access remove করা হয়েছে।"
        );


        await loadOwnerUserList();

        await loadAdminOverview();


    } catch (error) {

        console.error(
            "Remove Admin Error:",
            error
        );


        alert(
            "❌ Admin Access remove করা যায়নি:\n" +
            error.message
        );

    }

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
                    ${escapeAdminHTML(
                        error.message
                    )}
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


                <button
                    type="button"
                    class="admin-action-btn edit-btn"
                    onclick="editPaper(${paper.id})"
                >
                    ✏️ Edit
                </button>


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


        const oldModal =
            document.getElementById(
                "editPaperModal"
            );


        if (oldModal) {
            oldModal.remove();
        }


        const modal =
            document.createElement("div");


        modal.id =
            "editPaperModal";


        modal.innerHTML = `

            <div class="edit-modal-overlay">

                <div class="edit-modal-box">

                    <div class="edit-modal-header">

                        <div>

                            <h2>
                                ✏️ Edit Question Paper
                            </h2>

                            <p>
                                Question paper-এর information update করো
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


                    <form id="editPaperForm">

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


                        <label>
                            Branch
                        </label>

                        <input
                            type="text"
                            id="editBranch"
                            value="${escapeAdminAttribute(
                                paper.branch
                            )}"
                            required
                        >


                        <label>
                            Semester
                        </label>

                        <input
                            type="text"
                            id="editSemester"
                            value="${escapeAdminAttribute(
                                paper.semester
                            )}"
                            required
                        >


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


                        <label>
                            Description
                        </label>

                        <textarea
                            id="editDescription"
                        >${escapeAdminHTML(
                            paper.description || ""
                        )}</textarea>


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


                        <div
                            id="editStatus"
                            class="edit-status"
                        ></div>


                        <div class="edit-modal-actions">

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


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "⏳ Saving...";

        }


        status.textContent =
            "⏳ Question paper update হচ্ছে...";


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


        if (updateError) {

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

                await supabaseClient
                    .storage
                    .from(
                        "question-papers"
                    )
                    .remove([
                        oldFilePath
                    ]);

            }

        }


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

    if (
        paper.file_path &&
        paper.file_path.trim() !== ""
    ) {

        return paper.file_path;

    }


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
   ADMIN OVERVIEW
   ========================================================= */

.admin-overview-section {

    margin-top: 30px;

    margin-bottom: 35px;

}


.admin-overview-header {

    margin-bottom: 20px;

}


.admin-overview-header h2 {

    margin: 0 0 6px;

    font-size: 25px;

    color: #111827;

}


.admin-overview-header p {

    margin: 0;

    color: #64748b;

    font-size: 14px;

}


.admin-overview-grid {

    display: grid;

    grid-template-columns:
        repeat(3, 1fr);

    gap: 20px;

}


.overview-card {

    position: relative;

    overflow: hidden;

    min-height: 180px;

    padding: 24px;

    border-radius: 20px;

    color: #ffffff;

    box-sizing: border-box;

    box-shadow:
        0 12px 30px
        rgba(15, 23, 42, 0.12);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

}


.overview-card:hover {

    transform:
        translateY(-4px);

    box-shadow:
        0 18px 35px
        rgba(15, 23, 42, 0.18);

}


.users-card {

    background:
        linear-gradient(
            135deg,
            #2563eb,
            #4f46e5
        );

}


.admins-card {

    background:
        linear-gradient(
            135deg,
            #7c3aed,
            #9333ea
        );

}


.online-card {

    background:
        linear-gradient(
            135deg,
            #059669,
            #10b981
        );

}


.overview-card-top {

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 20px;

}


.overview-icon {

    width: 52px;

    height: 52px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 15px;

    background:
        rgba(
            255,
            255,
            255,
            0.20
        );

    font-size: 26px;

    backdrop-filter:
        blur(5px);

}


.overview-label {

    padding: 6px 10px;

    border-radius: 20px;

    background:
        rgba(
            255,
            255,
            255,
            0.18
        );

    font-size: 11px;

    font-weight: 800;

    letter-spacing: 1px;

}


.overview-number {

    font-size: 42px;

    line-height: 1;

    font-weight: 800;

    margin-bottom: 10px;

}


.overview-title {

    font-size: 18px;

    font-weight: 700;

    margin-bottom: 5px;

}


.overview-description {

    font-size: 13px;

    opacity: 0.85;

}


.overview-card::after {

    content: "";

    position: absolute;

    width: 120px;

    height: 120px;

    border-radius: 50%;

    right: -35px;

    bottom: -45px;

    background:
        rgba(
            255,
            255,
            255,
            0.10
        );

}


/* =========================================================
   USER / ADMIN MANAGEMENT
   ========================================================= */

.admin-user-list {

    display: flex;

    flex-direction: column;

    gap: 12px;

    margin-top: 15px;

}


.admin-user-card {

    background: #ffffff;

    border: 1px solid #e2e8f0;

    border-radius: 14px;

    padding: 16px 18px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 18px;

    box-shadow:
        0 4px 18px
        rgba(15, 23, 42, 0.06);

}


.admin-user-main {

    display: flex;

    align-items: center;

    gap: 14px;

    min-width: 0;

}


.admin-user-avatar {

    width: 48px;

    height: 48px;

    border-radius: 50%;

    background: #eff6ff;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 23px;

    flex-shrink: 0;

}


.admin-user-name {

    font-size: 16px;

    font-weight: 700;

    color: #111827;

    margin-bottom: 4px;

}


.admin-user-email {

    color: #64748b;

    font-size: 14px;

    word-break: break-all;

}


.admin-user-right {

    display: flex;

    align-items: center;

    gap: 10px;

    flex-shrink: 0;

}


.admin-role-badge {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    padding: 7px 11px;

    border-radius: 20px;

    font-size: 12px;

    font-weight: 700;

    white-space: nowrap;

}


.owner-badge {

    background: #fef3c7;

    color: #92400e;

}


.admin-badge {

    background: #dbeafe;

    color: #1d4ed8;

}


.user-badge {

    background: #f1f5f9;

    color: #475569;

}


.give-admin-btn,
.remove-admin-btn {

    border: none;

    border-radius: 8px;

    padding: 9px 12px;

    font-size: 13px;

    font-weight: 700;

    cursor: pointer;

}


.give-admin-btn {

    background: #2563eb;

    color: #ffffff;

}


.give-admin-btn:hover {

    background: #1d4ed8;

}


.remove-admin-btn {

    background: #fee2e2;

    color: #b91c1c;

}


.remove-admin-btn:hover {

    background: #fecaca;

}


.admin-empty-user {

    background: #ffffff;

    border: 1px dashed #cbd5e1;

    border-radius: 12px;

    padding: 20px;

    text-align: center;

    color: #64748b;

}


/* =========================================================
   PAPER CARD
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
   PAPER ACTIONS
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

    box-sizing: border-box;

}


.view-btn,
.edit-btn,
.delete-btn {

    background: #2563eb;

    color: #ffffff !important;

}


.view-btn:hover,
.edit-btn:hover,
.delete-btn:hover {

    background: #1d4ed8;

}


/* =========================================================
   LOADING / ERROR
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

    background: #ffffff;

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

}


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


.edit-modal-box textarea {

    min-height: 100px;

    resize: vertical;

}


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


.edit-help-text {

    margin-top: 7px;

    font-size: 13px;

    color: #64748b;

}


.edit-status {

    min-height: 22px;

    margin-top: 15px;

    font-size: 14px;

    font-weight: 600;

}


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


.edit-cancel-btn {

    background: #e5e7eb;

    color: #111827;

}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 800px) {

    .admin-overview-grid {

        grid-template-columns: 1fr;

    }


    .overview-card {

        min-height: 160px;

    }

}


@media (max-width: 700px) {

    .admin-user-card {

        align-items: flex-start;

        flex-direction: column;

    }


    .admin-user-right {

        width: 100%;

        flex-wrap: wrap;

    }


    .give-admin-btn,
    .remove-admin-btn {

        flex: 1;

    }


    .admin-paper-card {

        flex-direction: column;

        align-items: stretch;

    }


    .admin-actions {

        width: 100%;

        display: grid;

        grid-template-columns:
            repeat(3, 1fr);

    }


    .admin-action-btn {

        min-width: 0;

        padding: 10px 7px;

        font-size: 13px;

    }

}


/* =========================================================
   COLORFUL USER STATUS
   ========================================================= */

.admin-name-with-status {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
}

.user-presence {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
}

.presence-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
}

.online-presence {
    color: #047857;
    background: #d1fae5;
}

.online-presence .presence-dot {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14);
}

.offline-presence {
    color: #64748b;
    background: #f1f5f9;
}

.offline-presence .presence-dot {
    background: #94a3b8;
}

.owner-card {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.owner-card .admin-user-avatar {
    background: #fef3c7;
}

.admin-user-card:not(.owner-card) {
    background: linear-gradient(135deg, #ffffff, #f8fbff);
}

.admin-user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.11);
    transition: 0.2s ease;
}

.admin-user-card:nth-child(even) .admin-user-avatar {
    background: #f3e8ff;
}

.admin-user-card:nth-child(odd) .admin-user-avatar {
    background: #dbeafe;
}

.admin-paper-card:nth-child(3n + 1) {
    border-left: 6px solid #2563eb;
}

.admin-paper-card:nth-child(3n + 2) {
    border-left: 6px solid #7c3aed;
}

.admin-paper-card:nth-child(3n) {
    border-left: 6px solid #059669;
}

.view-btn {
    background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
}

.edit-btn {
    background: linear-gradient(135deg, #7c3aed, #9333ea) !important;
}

.delete-btn {
    background: linear-gradient(135deg, #dc2626, #ef4444) !important;
}

.view-btn:hover,
.edit-btn:hover,
.delete-btn:hover {
    filter: brightness(0.94);
}

.admin-access-denied {
    border: 1px solid #fecaca;
    background: linear-gradient(135deg, #fff1f2, #ffffff);
}

.admin-loading {
    border: 1px solid #bfdbfe;
    background: linear-gradient(135deg, #eff6ff, #ffffff);
}

.admin-empty {
    border: 1px dashed #cbd5e1;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
}

.admin-error {
    border: 1px solid #fecaca;
    background: linear-gradient(135deg, #fef2f2, #ffffff);
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


    // Load colorful overview

    await loadAdminOverview();


    // Load question papers

    await loadAdminPapers();


    // Owner-only management

    await loadOwnerManagement();

}


// ============================================================
// START
// ============================================================

startAdminDashboard();
