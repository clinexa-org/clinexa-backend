# Flutter Avatar Integration Guide

## API Endpoints (Simplified)

| Method   | Endpoint             | Description                                     |
| -------- | -------------------- | ----------------------------------------------- |
| `PUT`    | `/api/users/profile` | Update name and/or avatar (multipart/form-data) |
| `DELETE` | `/api/users/avatar`  | Remove avatar (reset to default)                |
| `GET`    | `/api/users/profile` | Get user profile                                |

---

## Flutter Implementation

### 1. Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  image_picker: ^1.0.0
  http: ^1.0.0
  http_parser: ^4.0.0
```

### 2. Update Profile with Avatar

```dart
import 'dart:io';
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class ProfileService {
  final String baseUrl;
  final String token;

  ProfileService({required this.baseUrl, required this.token});

  /// Pick image from gallery or camera
  Future<File?> pickImage({bool fromCamera = false}) async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: fromCamera ? ImageSource.camera : ImageSource.gallery,
      maxWidth: 500,
      maxHeight: 500,
      imageQuality: 80,
    );
    return image != null ? File(image.path) : null;
  }

  /// Update profile (name and/or avatar)
  Future<Map<String, dynamic>?> updateProfile({
    String? name,
    File? avatarFile,
  }) async {
    final uri = Uri.parse('$baseUrl/api/users/profile');

    final request = http.MultipartRequest('PUT', uri)
      ..headers['Authorization'] = 'Bearer $token';

    // Add name if provided
    if (name != null) {
      request.fields['name'] = name;
    }

    // Add avatar if provided
    if (avatarFile != null) {
      request.files.add(await http.MultipartFile.fromPath(
        'avatar',
        avatarFile.path,
        contentType: MediaType('image', 'jpeg'),
      ));
    }

    final response = await request.send();

    if (response.statusCode == 200) {
      final responseData = await response.stream.bytesToString();
      return jsonDecode(responseData)['data']['user'];
    }
    return null;
  }

  /// Remove avatar (reset to default)
  Future<bool> removeAvatar() async {
    final response = await http.delete(
      Uri.parse('$baseUrl/api/users/avatar'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return response.statusCode == 200;
  }
}
```

### 3. Usage Example

```dart
final profileService = ProfileService(
  baseUrl: 'https://your-api.vercel.app',
  token: userToken,
);

// Update name only
await profileService.updateProfile(name: 'New Name');

// Update avatar only
final file = await profileService.pickImage();
if (file != null) {
  await profileService.updateProfile(avatarFile: file);
}

// Update both name and avatar
final file = await profileService.pickImage();
await profileService.updateProfile(
  name: 'New Name',
  avatarFile: file,
);
```

---

## Response Format

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Fares Samy",
      "email": "user@example.com",
      "role": "patient",
      "avatar": "https://res.cloudinary.com/dsv0dzuvo/image/upload/..."
    }
  }
}
```

---

## Patient Endpoints (with Avatar)

| Method | Endpoint           | Description                     |
| ------ | ------------------ | ------------------------------- |
| `GET`  | `/api/patients/me` | Get patient profile with avatar |
| `POST` | `/api/patients`    | Create/update patient profile   |

### Response Format (`/api/patients/me`)

```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "...",
      "user_id": {
        "_id": "...",
        "name": "Fares Samy",
        "email": "user@example.com",
        "avatar": "https://res.cloudinary.com/..."
      },
      "age": 25,
      "gender": "male",
      "phone": "+201234567890",
      "address": "Cairo, Egypt"
    }
  }
}
```

### Flutter Model

```dart
class Patient {
  final String id;
  final User user;
  final int? age;
  final String? gender;
  final String? phone;
  final String? address;

  Patient({
    required this.id,
    required this.user,
    this.age,
    this.gender,
    this.phone,
    this.address,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['_id'],
      user: User.fromJson(json['user_id']),
      age: json['age'],
      gender: json['gender'],
      phone: json['phone'],
      address: json['address'],
    );
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String avatar;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.avatar,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      name: json['name'],
      email: json['email'],
      avatar: json['avatar'] ?? '',
    );
  }
}
```

### Get Patient Profile

```dart
Future<Patient?> getMyPatient() async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/patients/me'),
    headers: {'Authorization': 'Bearer $token'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body)['data']['patient'];
    return Patient.fromJson(data);
  }
  return null;
}

// Usage: Access avatar via patient.user.avatar
final patient = await getMyPatient();
print(patient?.user.avatar); // https://res.cloudinary.com/...
```
