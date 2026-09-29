# ARC CAPTURE SCHEMA v1

## Purpose
Define the minimum data required to capture one real Arc request reliably.

## Core Fields

- Student Name
- Request Type
- Clinical Site
- Requested Date / Date Range
- Source
- Current Status
- Notes
- Owner
- Created Timestamp
- Updated Timestamp

## Capture Rule
Every incoming request must become one structured Arc record without losing the original source context.

## v1 Principle
Keep the schema minimal. Add fields only when real implementation proves they are necessary.