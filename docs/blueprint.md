# **App Name**: JVHouzin

## Core Features:

- Property Listings Display: Display property listings fetched from Firestore, with image, title, location, type, and price.
- Property Filters/Search: Implement filters/search for listings by location, type, and price range.
- Login/Register Modal: Implement a modal for user login/registration using Firebase Authentication (Google Sign-In).
- Property Listing Submission: Allow logged-in tenants to submit new property listings (title, description, location, type, price, image) to Firestore with 'pending' status.
- Admin Approval/Deletion: Admin panel (protected by Firebase Auth) to approve or delete pending listings.
- Payment Processing: Display total cost (price + 10% service fee) and allow users to upload payment receipt for confirmation, store payment record in Firestore.
- Earnings calculator: Use an LLM to act as a tool, deciding how much of the price belongs to the Landlord and to the app owner.

## Style Guidelines:

- Primary color: #3B82F6 (Strong Blue). This provides a sense of trust and reliability which aligns with the core function of the app: facilitating property transactions. Its strong saturation is suited to the content's direct style and practical intent.
- Background color: #E5E7EB (Light Gray). Offers a clean and neutral backdrop, ensuring the content and property listings are the main visual focus. The low saturation is subtle and subdued, avoiding distractions.
- Accent color: #4ade80 (Vivid Green). The higher saturation will stand out for important actions and confirmations such as payments or admin approvals.
- Headline font: 'Space Grotesk' sans-serif; Body font: 'Inter' sans-serif. Combination will bring a scientific, techy feel that goes well with the user's technology background, and also ensuring body readability for longer text content.
- Use clean, modern icons from a library like FontAwesome or Material Design Icons.
- Implement a responsive grid layout for property listings using Tailwind CSS grid system. Ensure consistency across devices.
- Subtle transitions and hover effects to enhance user experience, such as card elevation on hover or smooth modal transitions.