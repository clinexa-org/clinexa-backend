# Flutter Appointment Booking Guide (Single Doctor System)

Since the system currently operates as a **Single Doctor Clinic**, the backend automatically assigns the appointment to the main doctor and clinic. You **do not** need to pass `doctor_id` or `clinic_id`.

## API Endpoint

- **URL:** `POST /api/appointments`
- **Auth:** Bearer Token (Patient)

### Request Body

| Field        | Type                | Required | Description                                                 |
| ------------ | ------------------- | -------- | ----------------------------------------------------------- |
| `date`       | String (YYYY-MM-DD) | ✅ Yes\* | Appointment date (e.g., `2024-02-25`)                       |
| `time`       | String (HH:mm)      | ✅ Yes\* | Appointment time (e.g., `14:30`)                            |
| `start_time` | String (ISO 8601)   | -        | \*Alternative: both `date` + `time` OR single `start_time`. |
| `reason`     | String              | No       | Reason for visit (e.g., "Checkup", "Pain", etc.)            |

---

## Flutter Implementation

### 1. Appointment Model

```dart
class AppointmentRequest {
  final String date; // "2024-02-25"
  final String time; // "14:30"
  final String reason;

  AppointmentRequest({
    required this.date,
    required this.time,
    required this.reason,
  });

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'time': time,
      'reason': reason,
    };
  }
}
```

### 2. Service Method

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> bookAppointment(AppointmentRequest request) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/appointments'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token', // Get token from storage
      },
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 201) {
      print("✅ Appointment Booked!");
      return true;
    } else {
      print("❌ Error: ${response.statusCode} - ${response.body}");
      return false;
    }
  } catch (e) {
    print("❌ Exception: $e");
    return false;
  }
}
```

### 3. Usage Example

```dart
// 1. User picks a date and a time (e.g., via DatePicker + TimePicker)
final selectedDate = "2024-02-25"; // YYYY-MM-DD
final selectedTime = "14:30";      // HH:mm

// 2. Create request object
final request = AppointmentRequest(
  date: selectedDate,
  time: selectedTime,
  reason: "General Checkup",
);

// 3. Call API
final success = await bookAppointment(request);

if (success) {
  // Show success dialog or navigate to Success Screen
}
```

---

## Important Logic Notes

1.  **Single Doctor:** You don't need to select a doctor in the UI. The backend automatically finds the primary doctor.
2.  **Date Format:** Ensure `DateTime` is converted to **ISO 8601 String** (`toIso8601String()`) before sending.
3.  **Validation:** The backend validates that the time is in the future.
