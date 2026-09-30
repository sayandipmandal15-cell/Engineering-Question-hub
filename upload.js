// ================= QUESTION PAPER UPLOAD ================= 
 
const uploadForm = document.getElementById("uploadForm"); 
 
uploadForm.addEventListener("submit", async function (event) { 
 
    event.preventDefault(); 
 
    const status = document.getElementById("uploadStatus"); 
 
    // Check login 
    const { data: { user } } = await supabaseClient.auth.getUser(); 
 
    if (!user) { 
        status.textContent = "❌ আগে Login করতে হবে."; 
        return; 
    } 
 
    // Get form values 
    const university = document.getElementById("university").value.trim(); 
    const branch = document.getElementById("branch").value.trim(); 
    const semester = document.getElementById("semester").value.trim(); 
    const subject = document.getElementById("subject").value.trim(); 
    const examYear = document.getElementById("exam_year").value; 
    const description = document.getElementById("description").value.trim(); 
    const file = document.getElementById("questionFile").files[0]; 
 
    if (!file) { 
        status.textContent = "❌ Question paper select করো."; 
        return; 
    } 
 
    try { 
 
        status.textContent = "⏳ Upload হচ্ছে..."; 
 
        // Create unique file name 
        const fileName = 
            Date.now() + "_" + 
            file.name.replace(/\s+/g, "_"); 
 
        const filePath = 
            user.id + "/" + fileName; 
 
        // 1. Upload file to Supabase Storage 
        const { error: storageError } = 
            await supabaseClient.storage 
                .from("question-papers") 
                .upload(filePath, file); 
 
        if (storageError) { 
            throw storageError; 
        } 
 
        // 2. Get public URL 
        const { data: publicUrlData } = 
            supabaseClient.storage 
                .from("question-papers") 
                .getPublicUrl(filePath); 
 
        const fileUrl = publicUrlData.publicUrl; 
 
        // 3. Save information in database 
        const { error: databaseError } = 
            await supabaseClient 
                .from("question_papers") 
                .insert({ 
                    university: university, 
                    branch: branch, 
                    semester: semester, 
                    subject: subject, 
                    exam_year: Number(examYear), 
                    file_name: file.name, 
                    file_url: fileUrl,

                    // NEW: Storage path
                    file_path: filePath,

                    description: description, 
                    uploaded_by: user.id 
                }); 
 
        if (databaseError) { 
            throw databaseError; 
        } 
 
        status.textContent = 
            "✅ Question paper successfully uploaded!"; 
 
        uploadForm.reset(); 
 
    } catch (error) { 
 
        console.error(error); 
 
        status.textContent = 
            "❌ Upload failed: " + error.message; 
    } 
});
