// ================= AUTHENTICATION =================

// Create Account
async function createAccount() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
        alert("Email and password দিতে হবে.");
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

    if (error) {
        alert("❌ Account তৈরি হয়নি:\n" + error.message);
        return;
    }

    alert(
        "✅ Account তৈরি হয়েছে! আপনার email check করুন।"
    );
}


// Login
async function loginUser() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
        alert("Email and password দিতে হবে.");
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        alert("❌ Login হয়নি:\n" + error.message);
        return;
    }

    alert("✅ Login সফল হয়েছে!");

    window.location.href = "upload.html";
}