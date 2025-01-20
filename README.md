# Indiana Hotels Admin Dashboard

A React-based admin dashboard for managing the Indiana Hotels system.

## Features

- Staff management
- Room management
- Booking oversight
- Service request handling
- User management
- Analytics and reporting

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Firebase (Firestore, Authentication, Storage)
- Vite

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/singhtechie24/Indiana-Hotels-Final.git
cd indiana-hotels-admin
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
- Copy `.env.example` to `.env`
- Fill in your Firebase configuration

4. Start the development server
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following:
```
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
```

## Security Notes

- Never commit `.env` files
- Keep Firebase configuration secure
- Follow Firebase security rules
- Protect API keys and sensitive data

## License

This project is licensed under the MIT License
