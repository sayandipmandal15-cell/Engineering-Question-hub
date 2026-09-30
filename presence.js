// ========================================
// USER ONLINE / OFFLINE PRESENCE
// ========================================

async function updateUserPresence() {

    try {

        const {
            data: {
                user
            }
        } = await supabaseClient.auth.getUser();

        // Login না থাকলে কিছু করার দরকার নেই
        if (!user) {
            return;
        }

        const { error } = await supabaseClient
            .from("user_presence")
            .upsert(
                {
                    user_id: user.id,
                    last_seen_at: new Date().toISOString()
                },
                {
                    onConflict: "user_id"
                }
            );

        if (error) {
            console.error(
                "Presence update failed:",
                error
            );
        }

    } catch (error) {

        console.error(
            "Presence error:",
            error
        );

    }

}


// প্রথমবার update
updateUserPresence();


// প্রতি 30 second-এ update
setInterval(
    updateUserPresence,
    30 * 1000
);


// User আবার website-এ ফিরলে update
document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState === "visible"
        ) {
            updateUserPresence();
        }

    }
);
