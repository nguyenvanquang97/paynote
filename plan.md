# Personal Finance Tracker - React Native Implementation Plan

# Project Goal

Xây dựng ứng dụng quản lý chi tiêu cá nhân trên Android bằng React Native.

Ứng dụng sẽ:
- Tự động đọc notification ngân hàng
- Parse giao dịch
- Lưu transaction local
- Phân loại chi tiêu
- Detect miss transaction
- Dashboard analytics
- Export dữ liệu

---

# Core Philosophy

## Không làm:
- Login vào app ngân hàng
- OCR app ngân hàng
- Accessibility hack
- Auto click banking app
- Reverse engineering app bank

## Chỉ làm:
- Đọc notification Android
- Parse text
- Local-first storage

---

# Target Platform

## MVP
- Android only

## Why
iOS không cho đọc notification app khác.

---

# Recommended Stack

# Frontend

## Core
- React Native
- TypeScript

## Navigation
- React Navigation

## State Management
- Zustand

## Database
- React Native MMKV
- SQLite

## Charts
- react-native-gifted-charts

## Date
- dayjs

## UUID
- react-native-uuid

---

# Native Android

## Required Native Features

### Notification Listener
```kotlin
NotificationListenerService
```

### Foreground Service
```kotlin
startForeground()
```

### Native Event Bridge
```kotlin
RCTDeviceEventEmitter
```

---

# Project Structure

```txt
src/
├── app/
│
├── screens/
│   ├── dashboard/
│   ├── transactions/
│   ├── categories/
│   ├── settings/
│   └── onboarding/
│
├── modules/
│   ├── banking/
│   │   ├── parsers/
│   │   ├── detectors/
│   │   ├── reconciliation/
│   │   ├── categorization/
│   │   └── services/
│   │
│   ├── transactions/
│   ├── analytics/
│   └── export/
│
├── database/
│
├── native/
│
├── shared/
│
└── utils/
```

---

# Application Flow

```txt
Bank Notification
        ↓
Android NotificationListenerService
        ↓
Native Event Emitter
        ↓
React Native Event Listener
        ↓
Bank Detector
        ↓
Bank Parser
        ↓
Transaction Validator
        ↓
Reconciliation Check
        ↓
SQLite Storage
        ↓
Dashboard / Charts
```

---

# Phase 1 — React Native Setup

## Create App

```bash
npx react-native init finance-tracker \
  --template react-native-template-typescript
```

## Install Dependencies

```bash
yarn add zustand
yarn add dayjs
yarn add react-native-uuid
yarn add @react-navigation/native
yarn add @react-navigation/native-stack
yarn add react-native-sqlite-storage
yarn add react-native-gifted-charts
```

---

# Phase 2 — Native Android Notification Listener

## AndroidManifest.xml

```xml
<service
    android:name=".NotificationService"
    android:label="Notification Service"
    android:permission=
        "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">

    <intent-filter>
        <action android:name=
            "android.service.notification.NotificationListenerService"/>
    </intent-filter>

</service>
```

---

## NotificationService.kt

```kotlin
class NotificationService
  : NotificationListenerService() {

    override fun onNotificationPosted(
        sbn: StatusBarNotification
    ) {

        val packageName = sbn.packageName

        val title =
            sbn.notification.extras
                .getString("android.title")

        val text =
            sbn.notification.extras
                .getCharSequence("android.text")
                ?.toString()

        NotificationBridge.send(
            packageName,
            title,
            text
        )
    }
}
```

---

# React Native Bridge

```kotlin
object NotificationBridge {

    fun send(
        packageName: String,
        title: String?,
        text: String?
    ) {

        val params = Arguments.createMap()

        params.putString(
            "packageName",
            packageName
        )

        params.putString(
            "title",
            title
        )

        params.putString(
            "text",
            text
        )

        reactContext
            .getJSModule(
                RCTDeviceEventEmitter::class.java
            )
            .emit(
                "BANK_NOTIFICATION",
                params
            )
    }
}
```

---

# React Native Listener

```ts
import {
  NativeEventEmitter,
  NativeModules
} from 'react-native'

const emitter =
  new NativeEventEmitter(
    NativeModules.NotificationBridge
  )

export const useBankNotifications = () => {

  useEffect(() => {

    const sub = emitter.addListener(
      'BANK_NOTIFICATION',
      handleNotification
    )

    return () => sub.remove()

  }, [])
}
```

---

# Bank Detection

## Supported Banks
- MB Bank
- Techcombank
- Vietcombank

## bankDetector.ts

```ts
export const detectBank = (
  packageName: string
) => {

  if (
    packageName.includes('mb')
  ) {
    return 'mbbank'
  }

  if (
    packageName.includes('tcb')
  ) {
    return 'techcombank'
  }

  return 'unknown'
}
```

---

# Parser System

## ParsedTransaction

```ts
export interface ParsedTransaction {

  amount: number

  balanceAfter?: number

  description?: string

  transactionType:
    | 'income'
    | 'expense'

  timestamp: number

  rawText: string
}
```

---

# Example MB Parser

```ts
export const parseMBNotification = (
  text: string
): ParsedTransaction | null => {

  const amountRegex =
    /([+-]?\d[\d,.]*)\s?VND/

  const amountMatch =
    text.match(amountRegex)

  if (!amountMatch) {
    return null
  }

  const amount =
    parseCurrency(amountMatch[1])

  return {

    amount,

    transactionType:
      amount > 0
        ? 'income'
        : 'expense',

    timestamp: Date.now(),

    rawText: text
  }
}
```

---

# SQLite Schema

```sql
CREATE TABLE transactions (

  id TEXT PRIMARY KEY,

  bank TEXT,

  amount REAL,

  balance_after REAL,

  description TEXT,

  category TEXT,

  transaction_type TEXT,

  timestamp INTEGER,

  raw_text TEXT,

  is_suspected_gap INTEGER
)
```

---

# Reconciliation System

## Goal
Detect missed notifications.

## Example

Notification 1:
```txt
+500,000
Balance: 5,000,000
```

Notification 2:
```txt
-50,000
Balance: 4,750,000
```

Expected:
```txt
5,000,000 - 50,000
= 4,950,000
```

=> Missing 200,000 transaction.

## Logic

```ts
const expectedBalance =
  prev.balanceAfter + current.amount

if (
  expectedBalance !== current.balanceAfter
) {

  current.isSuspectedGap = true
}
```

---

# Categorization System

```ts
const keywordCategories = {

  'highlands': 'cafe',

  'grab': 'transport',

  'circle k': 'food',

  'spotify': 'subscription'
}
```

---

# Dashboard Features

- Total income
- Total expense
- Current balance
- Monthly spending chart
- Category pie chart
- Recent transactions

---

# Settings Features

## Permissions
- Open Notification Settings
- Disable Battery Optimization

## Export
- Export CSV

---

# Background Reliability

## Important
Android sẽ kill app background.

## Solution
- Foreground Service
- Detect listener disabled
- Permission validation

---

# Duplicate Detection

```ts
hash =
 amount +
 timestamp +
 description
```

Nếu hash giống:
- skip insert.

---

# Security Rules

## Never Store
- Password bank
- Token bank
- Session bank

## Only Store
- Parsed transactions

---

# Onboarding Flow

1. Grant notification access
2. Disable battery optimization
3. Test notification detection

---

# MVP Timeline

## Week 1
- RN setup
- Native bridge
- Notification listener
- SQLite

## Week 2
- MB parser
- TCB parser
- Transaction storage
- Dashboard

## Week 3
- Reconciliation
- Deduplication
- Categorization
- Export CSV

## Week 4
- Charts
- Settings
- UX
- Error handling

---

# Future Improvements

## Optional Backend
- Cloud sync
- Multi-device
- Backup

## AI Features

Examples:
```txt
Bạn chi cafe nhiều hơn tháng trước 25%
```

```txt
Spotify là subscription định kỳ
```

---

# Final Architecture Summary

```txt
Android Notification
        ↓
Native Kotlin Listener
        ↓
React Native Bridge
        ↓
Bank Parser Engine
        ↓
Reconciliation Engine
        ↓
SQLite Database
        ↓
Analytics Dashboard
```
