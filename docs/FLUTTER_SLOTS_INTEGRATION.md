# Flutter Integration: Dynamic Slots

The API now returns **ALL** slots for a day, including booked ones. This allows you to render the full schedule and disable buttons for booked slots.

## 1. Updated API Response Structure

**Endpoint:** `GET /api/appointments/slots?date=YYYY-MM-DD`

**New Response:**

```json
{
  "success": true,
  "data": {
    "date": "2026-01-27",
    "timezone": "Africa/Cairo",
    "slots": [
      {
        "time": "2026-01-27T09:00:00.000Z",
        "status": "available"
      },
      {
        "time": "2026-01-27T09:30:00.000Z",
        "status": "booked"
      },
      {
        "time": "2026-01-27T10:00:00.000Z",
        "status": "available"
      }
    ]
  }
}
```

## 2. Flutter Implementation Guide

### A. Update your Model

Update your `Slot` model (or equivalent) to handle the object structure.

```dart
class Slot {
  final DateTime time;
  final String status; // 'available' or 'booked'

  Slot({required this.time, required this.status});

  factory Slot.fromJson(Map<String, dynamic> json) {
    return Slot(
      time: DateTime.parse(json['time']),
      status: json['status'],
    );
  }

  bool get isBooked => status == 'booked';
}
```

### B. Update your UI (Grid/List)

When rendering the chips/buttons, check the status.

```dart
// Inside your GridView.builder or Wrap
final slot = slots[index];

return AbsorbPointer(
  absorbing: slot.isBooked, // Disable clicks if booked
  child: ChoiceChip(
    label: Text(
      DateFormat('hh:mm a').format(slot.time.toLocal()),
      style: TextStyle(
        color: slot.isBooked ? Colors.grey : Colors.black,
        decoration: slot.isBooked ? TextDecoration.lineThrough : null, // Optional: strikethrough
      ),
    ),
    selected: selectedSlot == slot.time,
    // Style the disabled state
    disabledColor: Colors.grey.shade200,
    selectedColor: AppColors.primary,
    onSelected: slot.isBooked
        ? null // Important: logic to disable selection
        : (selected) {
            setState(() => selectedSlot = slot.time);
          },
  ),
);
```

### Key Changes

1.  **Parse the list of objects:** Don't expect a `List<String>`. Expect `List<Map<String, dynamic>>`.
2.  **Disable Interaction:** Use `onSelected: null` or check `isBooked` before updating state.
3.  **Visual Cues:** Use grey colors or strikethrough to indicate "Sold Out" slots.
