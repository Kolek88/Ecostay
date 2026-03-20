// ==========================================
// 1. APP INITIALIZATION & SECURITY
// ==========================================
async function initApp() {
        
    // Prevent running on the login page
    if (document.getElementById('login-section')) return;
        
    if (document.getElementById('adminChart')) return;

    let userData = localStorage.getItem("ecoUser");

    if (!userData) {
        window.location.href = "login.php"; 
        return;
    }

    let user = JSON.parse(userData);

    // 1. Update Header
    if(document.querySelector(".header h2")) {
        document.querySelector(".header h2").innerHTML = `Hi, ${user.name}! &#128075;`;
    }
    if(document.getElementById("user-score")) {
        document.getElementById("user-score").innerText = user.eco_points || 0;
    }

    // 2. Update Block Title
    if(document.getElementById("dash-block-title")) {
        document.getElementById("dash-block-title").innerText = user.block;
    }

    // 3. Update Rank 
    if(document.getElementById("dash-rank")) {
        document.getElementById("dash-rank").innerHTML = getRankName(user.eco_points || 0);
    }
    
    // Load other dashboard elements
    updateLiveConsumption(user);
    loadProfile(user); 
    loadLeaderboard();
    loadDailyQuiz();
	initWordle();
    loadMail();
}

// Function to save data permanently to the MySQL database
async function saveProgressToDatabase(userObj) {
    let formData = new FormData();
    formData.append('email', userObj.email);
    formData.append('eco_points', userObj.eco_points || 0);
    formData.append('last_quiz_date', userObj.last_quiz_date || "");
    formData.append('last_wordle_date', userObj.last_wordle_date || "");
    formData.append('completed_missions', userObj.completed_missions || "");
    formData.append('reward_target', userObj.reward_target || 1000); 
    try {
        let response = await fetch('update_progress.php', { method: 'POST', body: formData });
        let text = await response.text(); 
        
        // If it fails, pop up an alert so we can fix the database!
        if (text.includes("error") || text.includes("Warning") || text.includes("Unknown column")) {
            alert("SERVER ERROR: " + text);
        } else {
            console.log("Saved to DB successfully!");
            loadLeaderboard(); // Update the leaderboard instantly
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

// ==========================================
// 2. DASHBOARD FUNCTIONS (Fixed Loading...)
// ==========================================
// Change this to an async function so it can fetch the database average!
async function updateLiveConsumption(user) {
    if (!user) return;

    // --- Update Electricity ---
    if (user.base_electric && user.block) {
        let elecText = document.getElementById("elec-text");
        let elecBar = document.getElementById("elec-bar");
        
        try {
            // Ask the database for the block's average
            let response = await fetch('get_block_avg.php?block=' + encodeURIComponent(user.block));
            let data = await response.json();
            let blockAvg = data.avg || 100; 
            
            let usage = parseFloat(user.base_electric) || 0;
            
            if (elecText) {
                // Show both their usage AND the block average!
                elecText.innerHTML = `${usage} kWh <span style="font-size:10px; color:#777;">(Avg: ${blockAvg} kWh)</span>`;
                elecText.style.color = "#333"; 
            }
            
            if (elecBar) {
                // Make the bar visually scale so the average is sitting around the middle (50% width)
                let percent = (usage / (blockAvg * 2)) * 100;
                if (percent > 100) percent = 100;
                
                elecBar.style.width = percent + "%";
                
                // NEW COLOR LOGIC: Compare to average!
                if (usage < blockAvg * 0.9) {
                    elecBar.style.backgroundColor = "#2ecc71"; // Green (More than 10% below average - Great!)
                } else if (usage <= blockAvg * 1.1) {
                    elecBar.style.backgroundColor = "#f1c40f"; // Yellow (Average zone - Be careful)
                } else {
                    elecBar.style.backgroundColor = "#e74c3c"; // Red (More than 10% above average - Bad!)
                }
            }
        } catch(error) {
            console.log("Error loading average.");
        }
    }

    // --- Update Next Reward  ---
    if (user.reward_target) {
        let currentPoints = parseInt(user.eco_points) || 0;
        let targetPoints = parseInt(user.reward_target) || 1000;
        
        let titleEl = document.getElementById("reward-title");
        if (titleEl) titleEl.innerText = "Target: " + targetPoints + " Points";
        
        let textEl = document.getElementById("reward-text");
        if (textEl) textEl.innerText = currentPoints + " / " + targetPoints + " earned";
        
        let progressPercent = (currentPoints / targetPoints) * 100;
        if (progressPercent > 100) progressPercent = 100;
        
        let rewardBar = document.getElementById("reward-bar");
        if (rewardBar) rewardBar.style.width = progressPercent + "%";
        
        let btn = document.getElementById("claim-btn");
        if (progressPercent >= 100) {
            if (textEl) textEl.style.display = "none";
            if (btn) btn.style.display = "block";
        } else {
            if (textEl) textEl.style.display = "block";
            if (btn) btn.style.display = "none";
        }
    }
}

async function loadLeaderboard(type = 'points') {
    let container = document.getElementById("leaderboard-list");
    if (!container) return;
    
    // Toggle Button Styles
    let btnP = document.getElementById("btn-points");
    let btnC = document.getElementById("btn-consume");
    
    if (type === 'points') {
        if(btnP) { btnP.style.background = "white"; btnP.style.color = "#3498db"; btnP.style.opacity = "1"; }
        if(btnC) { btnC.style.background = "rgba(255,255,255,0.3)"; btnC.style.color = "white"; }
    } else {
        if(btnC) { btnC.style.background = "white"; btnC.style.color = "#3498db"; btnC.style.opacity = "1"; }
        if(btnP) { btnP.style.background = "rgba(255,255,255,0.3)"; btnP.style.color = "white"; }
    }

    container.innerHTML = "<p style='text-align:center; margin-top:20px;'>Loading...</p>";

    try {
        let response = await fetch('get_leaderboard.php?type=' + type);
        let data = await response.json();
        
        container.innerHTML = ""; 

        let rank = 1;
        data.forEach(player => {
            let valueHtml = "";
            let rowStyle = "border-left: 5px solid #2ecc71;"; // Default Green
            let displayName = ""; 
            
            if (type === 'points') {
                // POINTS MODE
                // Grab the username from the database instead of the block name
                displayName = player.username || "Student"; 
                valueHtml = `<strong style="color:#2ecc71">${player.eco_points} pts</strong>`;
            } else {
                // CONSUMPTION MODE 
                displayName = player.block_name; 
                let usage = parseFloat(player.base_electric) || 0; 
                
                // NEW COLOR LOGIC: Based on the actual kWh number!
                let color = "";
                if (usage < 80) {
                    color = "#27ae60"; // Green (Excellent - under 80)
                } else if (usage <= 110) {
                    color = "#f39c12"; // Yellow (Warning - between 80 and 110)
                } else {
                    color = "#e74c3c"; // Red (High - over 110)
                }
                
                rowStyle = `border-left: 5px solid ${color};`;
                
                valueHtml = `
                <div style="text-align:right;">
                    <strong style="color:${color}">${usage} kWh</strong>
                    <div style="font-size:10px; color:#aaa;">Electricity</div>
                </div>`;
            }

            // Inject the dynamic name into the HTML
            let html = `
            <div class="rank-item" style="${rowStyle}">
                <div style="display:flex; align-items:center;">
                    <span class="rank-number">${rank}</span>
                    <div>
                        <strong style="font-size:14px;">${displayName}</strong>
                    </div>
                </div>
                ${valueHtml}
            </div>`;
            container.innerHTML += html;
            rank++;
        });
    } catch (error) {
        container.innerHTML = "<p style='text-align:center; color:#777; margin-top:20px;'>Leaderboard data not connected yet.</p>";
    }
}

// ==========================================
// 3. UI INTERACTION & REPORTS
// ==========================================
function switchTab(viewId, navElement) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    let target = document.getElementById('view-' + viewId);
    if(target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(navElement) navElement.classList.add('active');
}

async function submitReport(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;

    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (!user) { alert("Please login first!"); return; }

    btn.innerText = "Sending...";
    
    // Grab all the text and the photo from the form
    let formData = new FormData(e.target); 
    formData.append('user_email', user.email); 

    try {
        let response = await fetch('submit_report.php', { method: 'POST', body: formData });
        let rawText = await response.text(); // Get the raw response to catch PHP errors
        
        try {
            let data = JSON.parse(rawText);
            if (data.status === "success") {
                // Notice we do NOT give points here anymore!
                alert("✅ Report sent to maintenance! You will receive 50 points when staff marks it fixed.");
                e.target.reset();
            } else {
                alert("Database Error: " + data.message);
            }
        } catch (jsonError) {
            // If PHP spits out an HTML error, this will show it to us
            alert("Server Error: " + rawText);
        }
    } catch (error) {
        alert("Network Error: Could not connect to submit_report.php");
    }
    
    btn.innerText = originalText;
}

// ==========================================
// 4. PROFILE & SYSTEM ACTIONS
// ==========================================
function loadProfile(user) {
    if (user) {
        if(document.getElementById("profile-name")) 
            document.getElementById("profile-name").innerText = user.name;
        
        if(document.getElementById("profile-block")) 
            document.getElementById("profile-block").innerText = user.block;
        
        if(document.getElementById("profile-rank")) 
            document.getElementById("profile-rank").innerText = getRankName(user.eco_points || 0);

        if(document.getElementById("profile-points")) 
            document.getElementById("profile-points").innerText = (user.eco_points || 0) + " pts";
    }
}

function confirmLogout() {
    let result = confirm("Are you sure you want to log out?");
    if (result) {
        localStorage.removeItem("ecoUser");
        window.location.href = "landing.html"; 
    }
}

async function claimReward() {
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (!user) return;
    
    let target = parseInt(user.reward_target) || 1000;
    let currentPoints = parseInt(user.eco_points) || 0;

    if (currentPoints < target) {
        alert("You need more points to claim this reward!");
        return;
    }
    
    let btn = document.getElementById("claim-btn");
    btn.innerText = "Claiming...";
    
    // THE MILESTONE MATH: Do not touch their points, just increase the target!
    user.reward_target = target + 500;
    
    // Save locally and to the database
    localStorage.setItem("ecoUser", JSON.stringify(user));
    saveProgressToDatabase(user);
    
    // Refresh the UI to show the new empty bar
    initApp(); 
    
    alert(`🎉 Reward Claimed! Your next milestone is now ${user.reward_target} points.`);
    btn.innerText = "Claim Reward!";
}

// ==========================================
// 5. RANK CALCULATOR
// ==========================================
function getRankName(points) {
    points = parseInt(points);
    if (points >= 2000) return "Eco-Legend 👑";
    if (points >= 1500) return "Eco-Master 🎓";
    if (points >= 1000) return "Eco-Warrior ⚔️";
    if (points >= 500)  return "Eco-Apprentice 🌿";
    return "Eco-Novice 🌱";
}

// ==========================================
// 6. SIMULATION LOGIC
// ==========================================
async function finishWeek() {
    let confirmSim = confirm("Simulate end of week? Rankings will be calculated and points awarded.");
    if (!confirmSim) return;

    try {
        let response = await fetch('end_week.php');
        let data = await response.json();

        if (data.status === "success") {
            let msg = "📅 Week Completed!\n\n" + data.message.join("\n");
            alert(msg);
            location.reload(); 
        }
    } catch (error) {
        alert("Simulation failed. Check if end_week.php exists.");
    }
}

// ==========================================
// 7. DAILY MISSIONS (TRUE DAILY ECO-QUIZ)
// ==========================================
const quizBank = [
    { q: "What is the most energy-efficient type of light bulb for a dorm room?", options: ["Incandescent", "Halogen", "LED", "Fluorescent"], correctIndex: 2 },
    { q: "What is the recommended temperature to set your AC for optimal energy saving in Malaysia?", options: ["16°C", "20°C", "24°C", "28°C"], correctIndex: 2 },
    { q: "Which appliance consumes the most power when plugged in but turned off?", options: ["Phone Charger", "Desktop Computer / Laptop Charger", "Desk Lamp", "Electric Kettle"], correctIndex: 1 },
    { q: "How much energy does turning off a ceiling fan save when you leave an empty room?", options: ["None, fans don't use much energy", "Fans cool people, not rooms, so it saves 100% of its usage", "It consumes more energy to turn it back on", "Only 10%"], correctIndex: 1 }
];

let selectedAnswerIsCorrect = false;

function loadDailyQuiz() {
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    let todayString = new Date().toDateString(); // e.g., "Wed Mar 04 2026"
    
    // Pick question based on the day of the year (Always the same today!)
    let dayIndex = Math.floor(Date.now() / 86400000); 
    let qIndex = dayIndex % quizBank.length;
    let questionData = quizBank[qIndex];

    document.getElementById("quiz-question").innerText = questionData.q;
    let optionsContainer = document.getElementById("quiz-options");
    let submitBtn = document.getElementById('submit-quiz-btn');
    let feedback = document.getElementById('quiz-feedback');

    // Check if they already played today
    if (user && user.last_quiz_date === todayString) {
        optionsContainer.innerHTML = "<div style='background:#e8f8f5; padding:20px; border-radius:8px; text-align:center; color:#2ecc71; font-weight:bold;'>✅ You already completed today's Eco-Quiz! Come back tomorrow for more points.</div>";
        submitBtn.style.display = "none";
        feedback.innerText = "";
        return;
    }

    // Otherwise, generate the buttons
    optionsContainer.innerHTML = ""; 
    questionData.options.forEach((optionText, index) => {
        let isCorrect = (index === questionData.correctIndex);
        let btn = document.createElement("button");
        btn.innerText = optionText;
        btn.style.cssText = "padding: 12px; background: white; border: 2px solid #eee; border-radius: 8px; cursor: pointer; text-align: left; font-size: 14px; transition: 0.2s;";
        btn.onclick = function() { selectAnswer(this, isCorrect); };
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(buttonEl, isCorrect) {
    let buttons = document.getElementById('quiz-options').getElementsByTagName('button');
    for(let btn of buttons) {
        btn.style.background = "white";
        btn.style.color = "#333";
        btn.style.borderColor = "#eee";
    }
    
    buttonEl.style.background = "#8e44ad";
    buttonEl.style.color = "white";
    buttonEl.style.borderColor = "#8e44ad";

    selectedAnswerIsCorrect = isCorrect;
    document.getElementById('submit-quiz-btn').style.display = "block";
}

function submitQuiz() {
    let feedback = document.getElementById('quiz-feedback');
    let submitBtn = document.getElementById('submit-quiz-btn');
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (!user) return;

    // Mark as played today
    user.last_quiz_date = new Date().toDateString();

    if (selectedAnswerIsCorrect) {
        feedback.style.color = "#2ecc71";
        feedback.innerText = "Correct! +20 Eco-Points! 🎉";
        user.eco_points = (parseInt(user.eco_points) || 0) + 20;
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Incorrect. Try again tomorrow! ❌";
    }

    localStorage.setItem("ecoUser", JSON.stringify(user));
    saveProgressToDatabase(user);
    initApp(); // Refresh header score

    submitBtn.style.display = "none";
    let buttons = document.getElementById('quiz-options').getElementsByTagName('button');
    for(let b of buttons) { 
        b.disabled = true; 
        b.style.cursor = "not-allowed";
        b.style.opacity = "0.6";
        b.onclick = null;
    }
}


// 8. ECO-WORDLE MINI-GAME (DAILY)
const wordleDictionary = [
    { clue: "The color most associated with eco-friendly living.", word: "GREEN" },
    { clue: "The essential liquid we must conserve during showers.", word: "WATER" },
    { clue: "The planet we are trying to save.", word: "EARTH" },
    { clue: "Renewable energy captured from the sun.", word: "SOLAR" },
    { clue: "A living organism that absorbs CO2 and produces oxygen.", word: "PLANT" },
    { clue: "Waste material that should be recycled when possible.", word: "TRASH" },
    { clue: "Reduce, _____, Recycle.", word: "REUSE" },
    { clue: "The opposite of dirty or polluted.", word: "CLEAN" },
    { clue: "Another word for electricity or energy usage.", word: "POWER" },
    { clue: "The atmospheric layer protecting us from UV rays.", word: "OZONE" },
    { clue: "Tall flora that provide shade and improve air quality.", word: "TREES" },
    { clue: "Turn this off when you leave an empty dorm room.", word: "LIGHT" }
];

let targetWord = "";
let currentAttempt = 0;
let wordleSolved = false;

function initWordle() {
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    let todayString = new Date().toDateString();

    // Pick word based on the day of the year
    let dayIndex = Math.floor(Date.now() / 86400000);
    let wIndex = dayIndex % wordleDictionary.length;
    let randomData = wordleDictionary[wIndex];
    
    targetWord = randomData.word;
    currentAttempt = 0;
    wordleSolved = false;
    
    let clueEl = document.getElementById("wordle-clue");
    let grid = document.getElementById("wordle-grid");
    let controls = document.getElementById("wordle-controls");
    let feedback = document.getElementById("wordle-feedback");
    
    if(!grid) return;

    // Check if they already played today
    if (user && user.last_wordle_date === todayString) {
        if(clueEl) clueEl.innerText = "Check back tomorrow!";
        grid.innerHTML = "<div style='background:#e8f8f5; padding:20px; border-radius:8px; width: 100%; text-align:center; color:#2ecc71; font-weight:bold;'>✅ You already played today's Wordle!</div>";
        controls.style.display = "none";
        feedback.innerText = "";
        return;
    }

    // Otherwise, start the game normally
    if(clueEl) clueEl.innerText = randomData.clue;
    controls.style.display = "flex";
    if (feedback) feedback.innerText = "";

    grid.innerHTML = ""; 
    for(let r = 0; r < 6; r++) {
        let rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.gap = "5px";
        for(let c = 0; c < 5; c++) {
            let box = document.createElement("div");
            box.id = `box-${r}-${c}`;
            box.style.width = "40px";
            box.style.height = "40px";
            box.style.border = "2px solid #ccc";
            box.style.borderRadius = "4px";
            box.style.display = "flex";
            box.style.alignItems = "center";
            box.style.justifyContent = "center";
            box.style.fontSize = "22px";
            box.style.fontWeight = "bold";
            box.style.textTransform = "uppercase";
            box.style.backgroundColor = "white";
            rowDiv.appendChild(box);
        }
        grid.appendChild(rowDiv);
    }

    let inputEl = document.getElementById("wordle-input");
    if (inputEl) {
        inputEl.value = "";
        inputEl.disabled = false;
    }
    let btnEl = document.querySelector("#wordle-controls button");
    if (btnEl) btnEl.disabled = false;
}

function updateWordleGrid() {
    if (wordleSolved || currentAttempt >= 6) return;
    let inputEl = document.getElementById("wordle-input");
    let guess = inputEl.value.toUpperCase();
    
    for(let i = 0; i < 5; i++) {
        let box = document.getElementById(`box-${currentAttempt}-${i}`);
        if (box) box.innerText = guess[i] || ""; 
    }
}

function handleWordleKeyPress(event) {
    if (event.key === "Enter") submitWordle();
}

function submitWordle() {
    if (wordleSolved || currentAttempt >= 6) return;
    
    let inputEl = document.getElementById("wordle-input");
    let guess = inputEl.value.toUpperCase();
    let feedback = document.getElementById("wordle-feedback");
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (!user) return;
    
    if (guess.length !== 5) {
        feedback.innerText = "Word must be exactly 5 letters!";
        feedback.style.color = "#e74c3c";
        for(let i = 0; i < 5; i++) {
            let box = document.getElementById(`box-${currentAttempt}-${i}`);
            if(box) box.innerText = "";
        }
        inputEl.value = ""; 
        return;
    }
    
    feedback.innerText = ""; 
    let targetArr = targetWord.split("");
    let guessArr = guess.split("");
    let boxColors = ["#ccc", "#ccc", "#ccc", "#ccc", "#ccc"];
    
    for(let i=0; i<5; i++) {
        if (guessArr[i] === targetArr[i]) {
            boxColors[i] = "#2ecc71"; 
            targetArr[i] = null; 
        }
    }
    
    for(let i=0; i<5; i++) {
        if (boxColors[i] === "#2ecc71") continue; 
        let foundIndex = targetArr.indexOf(guessArr[i]);
        if (foundIndex !== -1) {
            boxColors[i] = "#f1c40f"; 
            targetArr[foundIndex] = null; 
        } else {
            boxColors[i] = "#95a5a6"; 
        }
    }
    
    for(let i=0; i<5; i++) {
        let box = document.getElementById(`box-${currentAttempt}-${i}`);
        box.innerText = guessArr[i];
        box.style.backgroundColor = boxColors[i];
        box.style.color = "white";
        box.style.borderColor = boxColors[i];
    }
    
    inputEl.value = ""; 
    currentAttempt++;
    
    let gameEnded = false;
    if (guess === targetWord) {
        wordleSolved = true;
        gameEnded = true;
        feedback.innerText = `Brilliant! The word was ${targetWord}. +50 Eco-Points! 🎉`;
        feedback.style.color = "#2ecc71";
        user.eco_points = (parseInt(user.eco_points) || 0) + 50;
    } else if (currentAttempt >= 6) {
        gameEnded = true;
        feedback.innerText = `Game Over! The word was ${targetWord}.`;
        feedback.style.color = "#e74c3c";
    }

    if (gameEnded) {
        user.last_wordle_date = new Date().toDateString();
        localStorage.setItem("ecoUser", JSON.stringify(user));
        saveProgressToDatabase(user); // <--- ADD THIS EXACT LINE HERE TOO!
        initApp(); 
        inputEl.disabled = true;
        document.querySelector("#wordle-controls button").disabled = true;
    }
}


// SCALABLE ONE-TIME MISSIONS


function completeMission(missionId, pointsAwarded) {
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (!user) return;

    // Convert the database string into an array 
    let completedList = user.completed_missions ? user.completed_missions.split(",") : [];
    
    // Stop if they already did it
    if (completedList.includes(missionId)) return; 

    // Add new mission to the list and award points
    completedList.push(missionId);
    user.completed_missions = completedList.join(",");
    user.eco_points = (parseInt(user.eco_points) || 0) + pointsAwarded;
    
    localStorage.setItem("ecoUser", JSON.stringify(user));
    saveProgressToDatabase(user);
    initApp(); 
    
    alert(`Mission Completed! +${pointsAwarded} Eco-Points! 🌍`);
}

// Opens and closes the calculator if they want to see their results again
function toggleCalculator() {
    let ui = document.getElementById("calc-ui");
    if (ui.style.display === "none" || ui.style.display === "") {
        ui.style.display = "block";
    } else {
        ui.style.display = "none";
    }
}

// Function that checks which buttons should be locked
function checkOneTimeMissions(user) {
    if (!user || !user.completed_missions) return;
    
    let completedList = user.completed_missions.split(",");

    // Check Pledge
    if (completedList.includes("pledge")) {
        let btn = document.getElementById("btn-msn-pledge");
        if (btn) {
            btn.innerText = "Completed ✅";
            btn.style.background = "#2ecc71";
            btn.disabled = true;
        }
    }

    // Check Calculator
    if (completedList.includes("calc")) {
        let startBtn = document.getElementById("btn-msn-calc-start");
        let doneBtn = document.getElementById("btn-msn-calc-done");
        let ui = document.getElementById("calc-ui");
        
        if (startBtn) startBtn.style.display = "none";
        if (ui) ui.style.display = "none"; // Keep hidden until they click "Completed"
        if (doneBtn) doneBtn.style.display = "block";
        
        // Restore their previous inputs from memory!
        if (user.saved_mah) document.getElementById("calc-mah").value = user.saved_mah;
        if (user.saved_v) document.getElementById("calc-v").value = user.saved_v;
        if (user.saved_calc_text) {
            let resBox = document.getElementById("calc-result");
            resBox.innerText = user.saved_calc_text;
            resBox.style.color = "#27ae60";
        }
        
        // Change the claim button so they know they already got points
        let calcBtn = document.querySelector("#calc-ui button[onclick='runCarbonCalculation()']");
        if (calcBtn) {
            calcBtn.innerText = "Recalculate";
            calcBtn.style.background = "#7f8c8d";
        }
    }
}
// The Math Logic 
// A Mock API Database for the Calculator 
const mockDeviceDatabase = {
    "galaxy a55": { mah: 5000, v: 3.85 }, 
    "galaxy s24": { mah: 4000, v: 3.88 },
    "galaxy s24 ultra": { mah: 5000, v: 3.88 },
    "iphone 15": { mah: 3349, v: 3.87 },
    "iphone 15 pro max": { mah: 4422, v: 3.87 },
    "iphone 14": { mah: 3279, v: 3.87 },
    "pixel 8": { mah: 4575, v: 3.89 },
    "pixel 8 pro": { mah: 5050, v: 3.89 }
};

function searchDeviceSpecs() {
    let searchInput = document.getElementById("calc-device-search").value.toLowerCase().trim();
    let resultBox = document.getElementById("calc-result");

    if (!searchInput) {
        resultBox.innerText = "Please enter a device name to search.";
        resultBox.style.color = "#e74c3c";
        return;
    }

    // Look up the device in local database
    if (mockDeviceDatabase[searchInput]) {
        let specs = mockDeviceDatabase[searchInput];
        
        // Auto-fill the manual inputs
        document.getElementById("calc-mah").value = specs.mah;
        document.getElementById("calc-v").value = specs.v;
        
        resultBox.innerText = `Device found! Specs auto-filled.`;
        resultBox.style.color = "#3498db";
    } else {
        resultBox.innerText = "Device not found in MVP database. Please enter specs manually.";
        resultBox.style.color = "#e67e22";
    }
}

function runCarbonCalculation() {
    let mah = parseFloat(document.getElementById("calc-mah").value);
    let v = parseFloat(document.getElementById("calc-v").value);
    let resultBox = document.getElementById("calc-result");

    if (!mah || !v) {
        resultBox.innerText = "Please enter both capacity and voltage.";
        resultBox.style.color = "#e74c3c";
        return;
    }

    // Find Watt-hours
    let wh = (mah * v) / 1000;
    
    // Account for 80% Charging Efficiency
    let actualEnergyWh = wh / 0.8;
    
    // Convert to kWh
    let kwh = actualEnergyWh / 1000;
    
    // Calculate Carbon Footprint (Malaysia Grid: 0.758 kg CO2e/kWh)
    let co2Kg = kwh * 0.758;
    let co2Grams = (co2Kg * 1000).toFixed(2);

    // CONDITIONAL FUN FACT LOGIC
    let funFactHtml = "";
    
    if (mah > 4500) {
        let totalCampusCo2 = (co2Kg * 500).toFixed(1);
        funFactHtml = `📱 <strong>Heavy Duty:</strong> Your phone has a massive battery! If 500 students in your block charged this exact phone right now, the campus would emit over <strong>${totalCampusCo2} kg</strong> of CO2! <br><span style="font-size:9px; color:#aaa;">(Source: Malaysia Energy Commission)</span>`;
        
    } else if (mah > 3000) {
        let ledHours = (kwh / 0.01).toFixed(1); 
        funFactHtml = `💡 <strong>Power Equivalent:</strong> That’s the exact same amount of energy needed to keep a standard 10W LED dorm light on for <strong>${ledHours} hours</strong>! <br><span style="font-size:9px; color:#aaa;">(Source: US Dept of Energy)</span>`;
        
    } else {
        let cupsOfWater = (kwh / 0.03).toFixed(1); // 0.03 kWh = boil 1 cup of water
        funFactHtml = `☕ <strong>Small but Mighty:</strong> With that much energy, you could boil enough water for <strong>${cupsOfWater} cups</strong> of tea or Maggi! <br><span style="font-size:9px; color:#aaa;">(Source: Energy Saving Trust)</span>`;
    }

    // Output to the screen
    resultBox.style.color = "#27ae60";
    resultBox.innerHTML = `One full charge consumes ${kwh.toFixed(4)} kWh and emits <strong>${co2Grams}g of CO2</strong>!<br><br>
                           <div style="background:#e8f8f5; padding:10px; border-radius:8px; border-left:4px solid #1abc9c; color:#333; text-align:left; line-height:1.4;">
                               ${funFactHtml}
                           </div>`;
        
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (user) {
        user.saved_mah = mah;
        user.saved_v = v;
        user.saved_calc_text = resultBox.innerHTML;
        localStorage.setItem("ecoUser", JSON.stringify(user));
    }

    // Wait 10 seconds so user can read the fun fact, then award the points
    setTimeout(() => {
        completeMission('calc', 150);
        document.getElementById("calc-ui").style.display = "none";
        document.getElementById("btn-msn-calc-done").style.display = "block";
    }, 10000);
}

// 10. STAFF ADMIN DASHBOARD

async function loadAdminChart() {
    let canvas = document.getElementById("adminChart");
    if (!canvas) return;

    try {
        let response = await fetch('get_analytics.php');
        let data = await response.json();

        let blockNames = [];
        let currentData = [];
        let pastData = [];

        // Sort data into arrays for Chart.js
        data.blocks.forEach(row => {
            blockNames.push(row.block_name);
            currentData.push(row.current_usage);
            pastData.push(row.past_usage);
        });

        // Inject the dynamically calculated ROI Data
        let rmBox = document.getElementById("roi-rm");
        let co2Box = document.getElementById("roi-co2");
        let treesBox = document.getElementById("roi-trees");
        let repairBox = document.getElementById("roi-repair"); 

        if(rmBox) rmBox.innerText = "RM " + data.rm_saved;
        if(co2Box) co2Box.innerText = data.co2_tons + " Tons";
        if(treesBox) treesBox.innerText = "≈ " + data.trees_planted + " Trees Planted";
        if(repairBox) repairBox.innerText = data.avg_repair_time + " Days"; 

        // Draw the Grouped Bar Chart
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: blockNames,
                datasets: [
                    {
                        label: 'This Month',
                        data: currentData,
                        backgroundColor: '#3498db', 
                        borderRadius: 4
                    },
                    {
                        label: 'Last Month',
                        data: pastData,
                        backgroundColor: '#bdc3c7', 
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { display: true, position: 'top', labels: { boxWidth: 12 } }
                }
            }
        });
            
        drawSavingsChart(data.savings_trend);
            
    } catch (error) {
        console.error("Chart Error:", error); 
        canvas.parentElement.innerHTML = "<p style='text-align:center; color:#777;'>Error loading chart data.</p>";
    }
}
// Function to dynamically load student reports into the Staff Dashboard
async function loadPendingReports() {
    let container = document.getElementById("admin-reports-container");
    if (!container) return; // Only run on the Staff page

    container.innerHTML = "<p style='text-align:center; color:#777;'>Loading reports...</p>";

    try {
        let response = await fetch('get_reports.php');
        let reports = await response.json();

        if (reports.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#2ecc71; font-weight:bold; margin-top:20px;'>✅ All caught up! No pending reports.</p>";
            return;
        }

        container.innerHTML = ""; // Clear the loading text

        // Loop through the real database reports and build the cards!
        reports.forEach(report => {
            // Format the database timestamp into a readable date
            let dateObj = new Date(report.report_date);
            let timeString = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // Check if user uploaded a photo
            let photoBtnHtml = "";
            if (report.photo_url && report.photo_url !== "") {
                // Opens the image in a new tab when clicked
                photoBtnHtml = `<button class="btn" onclick="window.open('${report.photo_url}', '_blank')" style="flex: 1; background: #3498db; padding: 8px; font-size: 11px;">View Photo</button>`;
            } else {
                // Make the button gray and unclickable if no photo exists
                photoBtnHtml = `<button class="btn" disabled style="flex: 1; background: #bdc3c7; padding: 8px; font-size: 11px; box-shadow: none;">No Photo</button>`;
            }

            let card = `
            <div style="background: #fff; border: 1px solid #e74c3c; border-left: 5px solid #e74c3c; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between;">
                    <strong style="color: #c0392b; font-size: 14px;">${report.issue}</strong>
                    <span style="font-size: 11px; color: #777;">${timeString}</span>
                </div>
                <p style="margin: 5px 0 2px 0; font-size: 13px; color: #555;"><strong>Loc:</strong> ${report.location}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #555; background: #f9f9f9; padding: 5px; border-radius: 4px; border: 1px dashed #ccc;"><strong>Desc:</strong> ${report.description || 'No description provided.'}</p>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #777;">By: ${report.username || report.user_email}</p>
                
                <div style="display: flex; gap: 5px;">
                    ${photoBtnHtml}
                    <button class="btn" onclick="rejectMaintenance(this, ${report.id}, '${report.user_email}')" style="flex: 1; background: #e74c3c; padding: 8px; font-size: 11px;">Reject</button>
                    <button class="btn" onclick="resolveMaintenance(this, ${report.id}, '${report.user_email}')" style="flex: 1.5; background: #2ecc71; padding: 8px; font-size: 11px;">Fix (+50)</button>
                </div>
            </div>`;
            
            container.innerHTML += card;
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='text-align:center; color:#e74c3c;'>Database connection failed.</p>";
    }
}

// Function to resolve a maintenance issue and award points
async function resolveMaintenance(btnElement, reportId, studentEmail) {
    // Temporarily lock the button so they don't double-click it
    let originalText = btnElement.innerText;
    btnElement.innerText = "Processing...";
    btnElement.disabled = true;

    let formData = new FormData();
    formData.append('report_id', reportId);       
    formData.append('student_email', studentEmail);

    try {
        let response = await fetch('resolve_report.php', { method: 'POST', body: formData });
        let data = await response.json();

        if (data.status === "success") {
            alert(`✅ Issue marked as fixed! 50 Eco-Points automatically awarded.`);
            btnElement.innerText = "Resolved ✅";
            btnElement.style.background = "#7f8c8d"; 
            btnElement.style.boxShadow = "none";
            
            // Fade out the entire report card slightly
            btnElement.closest('div[style*="background: #fff"]').style.opacity = "0.6";
        } else {
            // If the email wasn't found in the DB
            alert("Error: " + data.message);
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    } catch (error) {
        alert("Server Error. Make sure resolve_report.php is uploaded.");
        btnElement.innerText = originalText;
        btnElement.disabled = false;
    }
}

// Staff: Reject a report
async function rejectMaintenance(btnElement, reportId, studentEmail) {
    let confirmReject = confirm("Are you sure you want to reject this report? The student will be notified.");
    if(!confirmReject) return;

    btnElement.innerText = "...";
    let formData = new FormData();
    formData.append('report_id', reportId);       
    formData.append('student_email', studentEmail);

    try {
        let response = await fetch('reject_report.php', { method: 'POST', body: formData });
        let data = await response.json();
        if (data.status === "success") {
            btnElement.closest('div[style*="background: #fff"]').innerHTML = "<p style='text-align:center; color:#e74c3c; margin: 10px 0;'>Report Rejected.</p>";
        }
    } catch (e) { alert("Error connecting to server."); }
}

// Student: Load the In-Game Mailbox
async function loadMail() {
    let container = document.getElementById("inbox-list");
    let user = JSON.parse(localStorage.getItem("ecoUser"));
    if (!container || !user) return;

    try {
        let response = await fetch('get_mail.php?email=' + user.email);
        let mails = await response.json();

        if (mails.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#777; font-size: 12px;'>No new mail.</p>";
            return;
        }

        container.innerHTML = "";
        mails.forEach(mail => {
            let icon = mail.title.includes("Rejected") ? "❌" : "🎁";
            let color = mail.title.includes("Rejected") ? "#e74c3c" : "#2ecc71";
            
            let html = `
            <div style="background: white; border-left: 4px solid ${color}; padding: 12px; margin-bottom: 10px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative;">
                <button onclick="deleteMail(${mail.id}, this)" style="position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; color: #aaa; font-size: 14px;">🗑️</button>
                <strong style="display:block; font-size: 13px; color: #333; margin-bottom: 4px; padding-right: 20px;">${icon} ${mail.title}</strong>
                <p style="margin: 0; font-size: 11px; color: #555; line-height: 1.4;">${mail.message}</p>
            </div>`;
            container.innerHTML += html;
        });
    } catch (e) {
        container.innerHTML = "<p style='text-align:center; color:#e74c3c;'>Mail server offline.</p>";
    }
}

// Function to delete mail from the database
async function deleteMail(mailId, btnElement) {
    let confirmDelete = confirm("Delete this message?");
    if (!confirmDelete) return;

    let formData = new FormData();
    formData.append('mail_id', mailId);

    try {
        let response = await fetch('delete_mail.php', { method: 'POST', body: formData });
        let data = await response.json();
        
        if (data.status === "success") {
            // Remove the mail card from the screen 
            let card = btnElement.parentElement;
            card.style.opacity = "0";
            setTimeout(() => card.remove(), 300);
        }
    } catch (e) {
        alert("Failed to delete mail.");
    }
}

// Staff: Send a global broadcast to all users
async function sendBroadcast() {
    let title = document.getElementById("broadcast-title").value;
    let msg = document.getElementById("broadcast-msg").value;

    if (!title || !msg) {
        alert("Please fill in both the title and the message!");
        return;
    }

    let formData = new FormData();
    formData.append('title', title);
    formData.append('message', msg);

    try {
        let response = await fetch('send_broadcast.php', { method: 'POST', body: formData });
        let data = await response.json();
        
        if (data.status === "success") {
            alert("✅ Broadcast successfully sent to all students!");
            document.getElementById("broadcast-title").value = "";
            document.getElementById("broadcast-msg").value = "";
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Server error. Check your PHP file.");
    }
}


// Function to draw the new Line Graph
function drawSavingsChart(trendData) {
    let canvas = document.getElementById("savingsChart");
    if (!canvas) return;

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: trendData.labels, // ['Jan', 'Feb', ...]
            datasets: [{
                label: 'Cost Savings (RM)',
                data: trendData.data, // [1250, 1580, ...]
                borderColor: '#2ecc71', //  Green
                backgroundColor: 'rgba(46, 204, 113, 0.1)', // Light Green Fill
                fill: true, // Shades the area under the line
                tension: 0.3, // Makes the line smooth/curvy
                pointBackgroundColor: '#2ecc71',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allows it to fit the 250px container height
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: function(value) { return 'RM ' + value; } } // Adds 'RM' to the Y-axis
                }
            },
            plugins: {
                legend: { display: false } // We have the card title, so hide the graph legend
            }
        }
    });
}

// ADMIN: MANUAL POINT GRANT 
async function grantManualPoints() {
    let emailInput = document.getElementById("grant-email").value.trim();
    let pointsInput = document.getElementById("grant-points").value.trim();

    // Basic validation
    if (!emailInput || !pointsInput) {
        alert("Please enter both an email and a point value.");
        return;
    }

    try {
        let response = await fetch('grant_points.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: emailInput, 
                points: pointsInput 
            })
        });

        let data = await response.json();

        if (data.status === "success") {
            alert(data.message);
            // Clear the input boxes after success
            document.getElementById("grant-email").value = "";
            document.getElementById("grant-points").value = "";
        } else {
            alert(data.message); // Shows error if email doesn't exist
        }

    } catch (error) {
        alert("Server connection error while granting points.");
    }
}

loadPendingReports();

// Start App when the script loads
loadAdminChart();
initApp();
