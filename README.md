# SARCS Connect Care

## Overview
**SARCS Connect Care** is a disaster response platform that facilitates volunteer management, donation tracking, and emergency alerts. It provides an admin dashboard for managing volunteers, shifts, donations, and user roles. Volunteers can sign up for shifts based on different disasters, and donors can track their contributions.

## Features

### Admin Dashboard:
- Real-time monitoring of emergency alerts, shifts, and user activities.
- Ability to create and manage volunteer shifts.
- User management features, including promotion to admin and user search.
- Donation tracking and management.

### Volunteer Dashboard:
- View available volunteer shifts for various disasters.
- Sign up for shifts or cancel existing sign-ups.
- Track personal shift history.

### Donor Features:
- Track donations, manage payment methods, and see the total amount donated.

### Emergency Alerts:
- View and manage active emergency alerts.
- Create new alerts for volunteers and donors.

## Getting Started

### Prerequisites

To run this project locally, you'll need:

- [Node.js](https://nodejs.org/) and npm (Node Package Manager)
- [Supabase](https://supabase.com/) account for managing backend services

### Installation

1. **Clone the repository:**

bash 
git clone https://github.com/your-repository/sarcs-connect-care.git
cd sarcs-connect-care

2. Install dependencies:

npm install

3. Set up Supabase:

Create a Supabase account and project.

Set up tables for donations, shifts, profiles, user roles, etc.

Configure your .env file with Supabase API keys and project URL.

Running the Project Locally

Start the development server:

--npm run dev 
Open your browser and visit http://localhost:3000
