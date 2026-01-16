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
