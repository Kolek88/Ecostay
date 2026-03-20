<?php
//DB CONNECTION
$db_host = 'fdb1028.awardspace.net';  
$db_user = '4526606_khaliq';  
$db_pass = 'CONFIDENTIAL_GITHUB'; 
$db_name = '4526606_khaliq';   

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name); 

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die("Database Connection Failed: " . $conn->connect_error);
}

$alertMessage = "";


// HANDLE FORM SUBMISSIONS
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    // SIGN UP
    if ($_POST['form_type'] == 'register') {
        $name = $_POST['reg_name'];
        $email = $_POST['reg_email'];
        $block = $_POST['reg_block'];
        $password = $_POST['reg_pass']; 
        
        // Check if the UTP email is already in the database
        $checkEmail = $conn->query("SELECT * FROM users WHERE email='$email'");
        
        if ($checkEmail->num_rows > 0) {
            $alertMessage = "This UTP Email is already registered!";
        } else {
            $sql = "INSERT INTO users (username, email, block_name, password) VALUES ('$name', '$email', '$block', '$password')";
            if ($conn->query($sql) === TRUE) {
                $alertMessage = "Account created successfully! You can now log in.";
            } else {
                $alertMessage = "Database Error: " . $conn->error;
            }
        }
    }

    // LOG IN 
    if ($_POST['form_type'] == 'login') {
        $email = $_POST['login_email'];
        $password = $_POST['login_pass'];

        // Find user in database
        $sql = "SELECT * FROM users WHERE email='$email' AND password='$password'";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $userData = json_encode([
                "name"          => $user['username'],
                "email"         => $user['email'],
                "block"         => $user['block_name'],  
                "eco_points"    => $user['eco_points'],  
                "base_electric" => $user['base_electric'], 
                "base_water"    => $user['base_water'],
                "reward_target" => $user['reward_target'],
                "reward_type"   => $user['reward_type'],
                "last_quiz_date"   => $user['last_quiz_date'],   
                "last_wordle_date" => $user['last_wordle_date'],
                "completed_missions" => $user['completed_missions']
            ]);
            
            echo "<script>
                    localStorage.setItem('ecoUser', '$userData');
                    window.location.href = 'index.html';
                  </script>";
            exit();
        } else {
            $alertMessage = "Invalid UTP Email or Password!";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoStay - Login</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-container" style="justify-content: center; padding: 30px; box-sizing: border-box; background: white;">
        
        <?php if($alertMessage != ""): ?>
            <div style="background: #e74c3c; color: white; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;">
                <?php echo $alertMessage; ?>
            </div>
        <?php endif; ?>

        <div id="login-section" style="width: 100%;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2ecc71; font-size: 36px; margin-bottom: 5px;">EcoStay &#127807;</h1>
                <p style="color: #777; margin-top: 0; font-size: 14px;">Sign in with your UTP Email</p>
            </div>

            <form method="POST" action="login.php">
                <input type="hidden" name="form_type" value="login">
                    
                <div style="text-align: left; width: 100%; margin-bottom: 20px;">
                    <a href="landing.html" style="text-decoration: none; color: #2ecc71; font-weight: bold; font-size: 14px; display: inline-flex; align-items: center; gap: 5px;">
                        <span>⬅️</span> Back to Home
                    </a>
                </div>
                
                <div class="form-group">
                    <label>UTP Email</label>
                    <input type="email" name="login_email" placeholder="e.g., ali@utp.edu.my" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="login_pass" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="btn-login" style="margin-top: 15px;">Log In</button>
            </form>
            
            <p style="text-align: center; margin-top: 25px; font-size: 14px; color: #555;">
                Don't have an account? <br>
                <a href="#" onclick="toggleAuth('register')" style="color: #3498db; font-weight: bold; text-decoration: none; display: inline-block; margin-top: 5px;">Sign up here</a>
            </p>
        </div>

        <div id="register-section" style="width: 100%; display: none;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3498db; font-size: 32px; margin-bottom: 5px;">Join EcoStay</h1>
                <p style="color: #777; margin-top: 0; font-size: 14px;">Create your green campus account</p>
            </div>

            <form method="POST" action="login.php">
                <input type="hidden" name="form_type" value="register">
                
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" name="reg_name" placeholder="e.g., Ali Bin Ahmad" required>
                </div>
                <div class="form-group">
                    <label>UTP Email</label>
                    <input type="email" name="reg_email" placeholder="e.g., ali@utp.edu.my" required>
                </div>
                <div class="form-group" style="margin-bottom: 10px;">
                    <label>Dorm Block</label>
                    <select name="reg_block" required>
                        <option value="">Select your block...</option>
                        <option value="Village 1A">Village 1A</option>
                        <option value="Village 1B">Village 1B</option>
                        <option value="Village 1C">Village 1C</option>
                        <option value="Village 2A">Village 2A</option>
                        <option value="Village 2B">Village 2B</option>
                        <option value="Village 2C">Village 2C</option>
                        <option value="Village 3A">Village 3A</option>
                        <option value="Village 3B">Village 3B</option>
                        <option value="Village 3C">Village 3C</option>
                        <option value="Village 4A">Village 4A</option>
                        <option value="Village 4B">Village 4B</option>
                        <option value="Village 4C">Village 4C</option>
                        <option value="Village 5A">Village 5A</option>
                        <option value="Village 5B">Village 5B</option>
                        <option value="Village 5C">Village 5C</option>
                        <option value="Village 6A">Village 6A</option>
                        <option value="Village 6B">Village 6B</option>
                        <option value="Village 6C">Village 6C</option>
                        <option value="Village 7A">Village 7A</option>
                        <option value="Village 7B">Village 7B</option>
                        <option value="Village 7C">Village 7C</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="reg_pass" placeholder="Create a password" required>
                </div>
                
                <button type="submit" class="btn-login" style="background: linear-gradient(135deg, #3498db, #2980b9); margin-top: 10px;">Sign Up</button>
            </form>

            <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #555;">
                Already have an account? <br>
                <a href="#" onclick="toggleAuth('login')" style="color: #2ecc71; font-weight: bold; text-decoration: none; display: inline-block; margin-top: 5px;">Log in here</a>
            </p>
                
        </div>

    </div>

    <script>
        function toggleAuth(view) {
            if (view === 'register') {
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('register-section').style.display = 'block';
            } else {
                document.getElementById('register-section').style.display = 'none';
                document.getElementById('login-section').style.display = 'block';
            }
        }
    </script>
</body>
</html>