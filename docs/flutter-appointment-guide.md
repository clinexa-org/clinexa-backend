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
| `notes`      | String              | No       | Additional notes for the doctor                             |

---

## Flutter Implementation

### 1. Appointment Model

```dart
class AppointmentRequest {
  final String date; // "2024-02-25"
  final String time; // "14:30"
  final String reason;
  final String notes;

  AppointmentRequest({
    required this.date,
    required this.time,
    required this.reason,
    this.notes = "",
  });

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'time': time,
      'reason': reason,
      'notes': notes,
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
  notes: "I have been feeling dizzy lately.",
);

// 3. Call API
final success = await bookAppointment(request);

if (success) {
  // Show success dialog or navigate to Success Screen
}
```

---

## Rescheduling Appointments

- **URL:** `PATCH /api/appointments/reschedule/:id`
- **Body:** Same as Create (`date`, `time`, or `start_time`)

---

## UI Logic: Displaying the Card

As shown in your screenshot, follow this logic for the Card UI:

### 1. Doctor Name (Nested Object)

The backend populates the doctor data. The name is nested:
`appointment.doctor_id.user_id.name`

**Flutter Model adjustment:**

```dart
class Doctor {
  final String id;
  final User user_id; // Contains the name

  Doctor({required this.id, required this.user_id});

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['_id'],
      user_id: User.fromJson(json['user_id']),
    );
  }
}
```

### 2. Status Colors

- **Pending:** Blue / Light Blue
- **Confirmed:** Green
- **Cancelled:** Red
- **Completed:** Grey

### 3. Reschedule Action

When the user clicks **Reschedule**:

1. Open a **Date/Time Picker**.
2. If the user picks a new time, call the `rescheduleAppointment` API.
3. Refresh the appointments list.

```dart
Future<bool> reschedule(String id, String newDate, String newTime) async {
  final response = await http.patch(
    Uri.parse('$baseUrl/api/appointments/reschedule/$id'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'date': newDate,
      'time': newTime,
    }),
  );
  return response.statusCode == 200;
}
```
