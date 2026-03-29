<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Collect and sanitize input
    $name = htmlspecialchars(strip_tags(trim($_POST["name"])));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $service = htmlspecialchars(strip_tags(trim($_POST["service"])));
    $message = htmlspecialchars(strip_tags(trim($_POST["message"])));

    // Validate inputs
    if (empty($name) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Handle invalid input
        echo "<script>alert('Please fill out all fields correctly.'); window.location.href='index.html#contact';</script>";
        exit;
    }

    // Email configuration
    $to = "shabiqm@laundroplus.lk"; // The test email provided
    $subject = "New Contact Form Submission from $name";
    
    // Email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n";
    $email_content .= "Service Interest: $service\n\n";
    $email_content .= "Message:\n$message\n";

    // Email headers
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Send the email
    if (mail($to, $subject, $email_content, $headers)) {
        // Success
        echo "<script>alert('Thank you! Your message has been sent successfully.'); window.location.href='index.html#contact';</script>";
    } else {
        // Failure
        echo "<script>alert('Oops! Something went wrong and we couldn\'t send your message.'); window.location.href='index.html#contact';</script>";
    }
} else {
    // Not a POST request
    header("Location: index.html");
    exit;
}
?>
