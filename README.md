# Train Like Pros (TLP) Elite Training Scheduler

A premium, professional-grade management and scheduling platform designed for elite baseball and softball training facilities. TLP provides a seamless interface for parents to secure high-performance coaching for their athletes and a robust terminal for coaches to manage facilities and player rosters.

## Core Purpose

The TLP Training Scheduler is built to bridge the gap between world-class coaching and athlete development. It streamlines the authorization of training sessions, ensures facility availability is accurately reflected, and maintains detailed athlete dossiers for performance tracking.

## Key Features

### 1. Elite Athlete Booking Flow
- **Discipline Selection**: Tailored paths for Baseball and Softball.
- **Curriculum Selection**: Specialized programs for Hitting, Pitching, Fielding, and Small Group training.
- **Dynamic Scheduling**: Real-time access to facility calendars with automated weekend/weekday time-slot logic.
- **Secure Authorization**: Integrated profile management and payment verification for confirmed training sessions.

### 2. Professional Coach Terminal
- **Performance Dashboard**: High-level analytics on session volume and active athlete counts.
- **Athlete Roster Management**: Detailed dossiers containing training history, bio information, and emergency contacts.
- **Facility Control**: granular calendar management allowing coaches to block specific time slots or entire days for facility maintenance or events.
- **Personnel Management**: Secure staff onboarding system for authorizing new instructors onto the terminal.

### 3. Integrated Performance Consultant
- Leverages intelligent data analysis to provide athletes with tailored training recommendations based on their age, discipline, and specific notes provided by parents.

## Architecture & Design

- **Material 3 Foundations**: Utilizing the latest design principles for a clean, professional, and accessible user experience.
- **Responsive Split-Screen Layout**: Optimized for desktop with high-impact cinematic visuals, while maintaining full functionality on mobile devices.
- **Data Resilience**: Implements persistent local storage to ensure athlete and schedule data remains secure across sessions.

---

## Local Development Instructions

Follow these steps to get the TLP Scheduler running on your local machine:

### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS version recommended)
- A modern web browser

### Setup

1. **Clone the project** to your local environment.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Configuration**:
   The application requires an API key for the training advice consultant feature. Ensure this is available in your environment:
   - Create a `.env` file in the root directory.
   - Add your key: `API_KEY=your_key_here`

4. **Launch the Application**:
   ```bash
   npm start
   ```
   *Note: If using Vite or a similar modern bundler, use `npm run dev`.*

5. **Access the Terminal**:
   Open `http://localhost:3000` (or the port specified in your console) to view the site.

### Default Access Credentials
To access the Coach Terminal during development:
- **Coach ID**: `COACH1`
- **Security Key**: `admin123`

---
*© 2024 Train Like Pros LLC. Unauthorized duplication of this training architecture is prohibited.*