# Life Architect

**Master your daily flow with the world's first physics-based strategic checklist.**

Life Architect transforms your daily habits into energy vectors, helping you visualize progress through the laws of motion. It combines strategic task management with RPG-like progression systems to build resilience and momentum.

## Features

- **Physics-Based Task Management**: Categorize tasks by energy type (Habits, Energy, Desire, Choices, Time) and difficulty (Easy Start, Some Weight, Heavy Weight).
- **Gamification Engine**: Earn XP and Coins for completing tasks. Level up from "Fragment Seeker" to "Pattern Mapper".
- **Avatar System**: Unlock and equip neural shells using earned coins.
- **Analytics Dashboard**: Visualize your "Flow Rate", clutter levels, and resilience metrics.
- **Cloud Synchronization**: Seamlessly sync progress across devices using Google Authentication and Cloud SQL.
- **Android Integration**: Native home screen widgets for status glances and quick actions (via Capacitor).

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Recharts
- **Backend**: Express.js, Google Cloud SQL (MySQL)
- **Authentication**: Google OAuth 2.0
- **Mobile Runtime**: Capacitor (Android)

## Run Locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment**

   Ensure you have a `.env` file or environment variables set for:
   - `VITE_GOOGLE_CLIENT_ID`
   - `DB_USER`, `DB_NAME`, `INSTANCE_CONNECTION_NAME` (for server-side)

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Build for production**

   ```bash
   npm run build
   ```

## License

Private / Proprietary
