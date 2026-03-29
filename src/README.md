# Mergington High School Activities

A website that lets students browse extracurricular activities and allows teachers to manage registrations.

## Features

- **Activity browsing** — View all available activities as easy-to-read cards
- **Filtering** — Filter activities by category, day, time slot, and difficulty level
- **Search** — Search activities by name or description
- **Group By** — Group activities by category or day for an organized view
- **Calendar View** — See the weekly schedule as a visual calendar (toggle between card and calendar views)
- **Teacher authentication** — Teachers log in to manage registrations
- **Student registration** — Teachers can register and unregister students for activities
- **Dark mode** — Toggle between light and dark themes (preference is saved automatically)
- **Social sharing** — Share activities via X (Twitter), Facebook, or WhatsApp
- **Responsive design** — Works on desktop and mobile devices

## Architecture

- **Frontend** — Static HTML, CSS, and JavaScript (`src/static/`)
- **Backend** — FastAPI (Python) application (`src/app.py`, `src/backend/`)
- **Database** — MongoDB for storing activity and participant data

## Getting Started

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities` | List all activities. Accepts optional query params: `day`, `start_time`, `end_time` |
| POST | `/activities/{name}/signup` | Register a student for an activity. Requires `email` and `teacher_username` params |
| POST | `/activities/{name}/unregister` | Unregister a student from an activity. Requires `email` and `teacher_username` params |
| POST | `/auth/login` | Teacher login. Requires `username` and `password` query params |
| GET | `/auth/check-session` | Verify a teacher's session is still valid. Requires `username` query param |
