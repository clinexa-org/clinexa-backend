# Flutter Password Reset Guide

## API Endpoints

| Method | Path                        | Auth  | Description                |
| ------ | --------------------------- | ----- | -------------------------- |
| POST   | `/api/auth/forgot-password` | ❌ No | Request password reset OTP |
| POST   | `/api/auth/reset-password`  | ❌ No | Reset password with OTP    |

---

## 1. Forgot Password (Request OTP)

### Request

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "patient@example.com"
}
```

### Response (200 Success)

```json
{
  "status": "success",
  "message": "Password reset OTP sent to your email",
  "data": {
    "expiresIn": 600
  }
}
```

### Error Responses

| Status | Message                               |
| ------ | ------------------------------------- |
| `400`  | "Email is required"                   |
| `404`  | "User with this email does not exist" |
| `500`  | Server error                          |

---

## 2. Reset Password (Verify OTP)

### Request

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "patient@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

### Response (200 Success)

```json
{
  "status": "success",
  "message": "Password reset successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "patient@example.com",
      "role": "patient"
    },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

### Error Responses

| Status | Message                                     |
| ------ | ------------------------------------------- |
| `400`  | "Email, OTP, and new password are required" |
| `400`  | "Password must be at least 6 characters"    |
| `400`  | "No password reset was requested"           |
| `400`  | "OTP has expired. Please request a new one" |
| `400`  | "Invalid OTP"                               |
| `404`  | "User with this email does not exist"       |

---

## Flutter Implementation

### 1. Service Methods

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  final String baseUrl;

  AuthService(this.baseUrl);

  /// Request password reset OTP
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'expiresIn': data['data']['expiresIn']};
      } else {
        return {'success': false, 'message': data['message']};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  /// Reset password with OTP
  Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'user': data['data']['user'],
          'token': data['data']['token'],
        };
      } else {
        return {'success': false, 'message': data['message']};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
```

### 2. Usage Example

```dart
final authService = AuthService('https://your-api.com');

// Step 1: Request OTP
void onForgotPasswordPressed(String email) async {
  final result = await authService.forgotPassword(email);

  if (result['success']) {
    // Navigate to OTP verification screen
    // Show: "Check your email for the OTP code"
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => OtpVerificationScreen(email: email),
    ));
  } else {
    // Show error
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result['message'])),
    );
  }
}

// Step 2: Verify OTP and Reset Password
void onResetPasswordPressed(String email, String otp, String newPassword) async {
  final result = await authService.resetPassword(
    email: email,
    otp: otp,
    newPassword: newPassword,
  );

  if (result['success']) {
    // Save token and navigate to home
    await SecureStorage.write('token', result['token']);
    Navigator.pushReplacementNamed(context, '/home');
  } else {
    // Show error (invalid OTP, expired, etc.)
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result['message'])),
    );
  }
}
```

---

## UI Flow Recommendation

```
┌─────────────────┐
│   Login Screen  │
│  [Forgot Pass?] │──────┐
└─────────────────┘      │
                         ▼
               ┌─────────────────┐
               │  Email Input    │
               │  [Send OTP]     │
               └─────────────────┘
                         │
                         ▼
               ┌─────────────────┐
               │  OTP Input      │
               │  (6 digits)     │
               │  + New Password │
               │  [Reset]        │
               └─────────────────┘
                         │
                         ▼
               ┌─────────────────┐
               │  ✅ Success!     │
               │  Auto-login     │
               └─────────────────┘
```

## Important Notes

- **OTP expires in 10 minutes**
- **OTP is 6 digits**
- **Password minimum length: 6 characters**
- **After successful reset, user is auto-logged in** (token returned)
