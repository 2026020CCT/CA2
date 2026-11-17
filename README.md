A full-stack web application built with **Node.js**, **Express**, and **MongoDB**.  
Users can register, log in, and manage items (with image uploads) in a simple storefront-style interface.

## Features

- User registration and login with password hashing (`bcryptjs`) and JWT authentication
- Item creation with image upload (PNG, JPEG, WebP)
- Item listing API
- Static frontend served from the `public` folder
- MongoDB for data persistence

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Node.js, Express 5                  |
| Database    | MongoDB + Mongoose                 |
| Auth        | bcryptjs, jsonwebtoken              |
| File Upload | Multer                              |
| Frontend    | HTML, CSS, JavaScript (vanilla)     |

## Project Structure
CA2/

├── public/

│   ├── css/

│   ├── html/          # Frontend pages (index, register, itemInsert, etc.)

│   ├── images/        # Uploaded item images

│   └── js/

├── server/

│   └── models/

│       ├── User.js

│       └── Item.js

├── server.js          # Main application entry point

├── package.json

└── .env               # Environment variables (not committed)Text
## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/2026020CCT/CA2.git
   cd CA2
Install dependenciesBashnpm install
Create a .env file in the root directory:PropertiesPORT=3000
MONGODB_URI=mongodb://localhost:27017/ca2
JWT_SECRET=your_super_secret_jwt_key_hereReplace the values with your actual MongoDB connection string and a strong secret.
Start the serverBash# Production
npm start

# Development (with auto-reload)
npm run dev
Open your browser and go to:Texthttp://localhost:3000
API Endpoints







































MethodEndpointDescriptionPOST/api/registerRegister a new userPOST/api/loginLogin and receive JWT tokenGET/api/usersGet all users (no passwords)GET/api/itemsGet all itemsPOST/api/itemsCreate a new item (with image)GET/api/testHealth checkExample: RegisterBashcurl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"fname":"John","lname":"Doe","email":"john@example.com","password":"securepass"}'Example: LoginBashcurl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"securepass"}'Frontend Pages







































RouteFileDescription/index.htmlHomepage/registerregister.htmlUser registration/itemInsertitemInsert.htmlAdd new item/homehome.htmlHome / dashboard/basketbasket.htmlShopping basket/profileprofile.htmlUser profileNotes
Uploaded images are stored in public/images/ and validated by file signature (not just extension).
Maximum image size: 5 MB.
Supported formats: PNG, JPEG, WebP.
The public/images folder is created automatically on first upload.
LicenseISCAuthor: 2026020CCT

Repository: github.com/2026020CCT/CA2Text
---

### How to add it:

1. Go to your repo → **Add file** → **Create new file**
2. Name it `README.md`
3. Paste the content above
4. Click **Commit changes**

Would you like a shorter version, or do you want me to customize anything (project name, description, add badges, etc.)?