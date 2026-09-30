// =====================================================
// ENGINEERINGHUB AUTHENTICATION
// =====================================================


// ================= CREATE ACCOUNT =================

async function createAccount() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const status =
        document.getElementById("authStatus");


    if (!email || !password) {

        status.innerText =
            "⚠️ Email and password দিতে হবে।";

        return;
    }


    status.innerText =
        "⏳ Account তৈরি হচ্ছে...";


    const { error } =
        await supabaseClient.auth.signUp({
            email: email,
            password: password
        });


    if (error) {

        status.innerText =
            "❌ " + error.message;

        return;
    }


    status.innerText =
        "✅ Account তৈরি হয়েছে! আপনার email check করুন।";
}



// ================= LOGIN =================

async function loginUser() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const status =
        document.getElementById("authStatus");


    if (!email || !password) {

        status.innerText =
            "⚠️ Email and password দিতে হবে।";

        return;
    }


    status.innerText =
        "⏳ Login হচ্ছে...";


    // ================= SUPABASE LOGIN =================

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

    });


    if (error) {

        status.innerText =
            "❌ " + error.message;

        return;
    }


    if (!data.user) {

        status.innerText =
            "❌ User পাওয়া যায়নি।";

        return;
    }


    status.innerText =
        "🔍 Account type check হচ্ছে...";


    // ================= SECURE ROLE CHECK =================

    const {
        data: role,
        error: roleError
    } = await supabaseClient.rpc("get_my_role");


    console.log("EngineeringHub role:", role);
    console.log("Role error:", roleError);


    // ================= ROLE CHECK ERROR =================

    if (roleError) {

        console.error(
            "Role check failed:",
            roleError
        );

        status.innerText =
            "⚠️ Login হয়েছে, কিন্তু account type check করা যায়নি।";

        return;
    }


    // ================= OWNER =================

    if (role === "owner") {

        status.innerText =
            "👑 Owner account detected! Admin Panel খুলছে...";

        setTimeout(function() {

            window.location.href =
                "admin.html";

        }, 700);

        return;
    }


    // ================= ADMIN =================

    if (role === "admin") {

        status.innerText =
            "🛡️ Admin account detected! Admin Panel খুলছে...";

        setTimeout(function() {

            window.location.href =
                "admin.html";

        }, 700);

        return;
    }


    // ================= NORMAL USER =================

    status.innerText =
        "👤 Login successful!";


    setTimeout(function() {

        window.location.href =
            "upload.html";

    }, 700);

}
