<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# Anti-Social


## Basic Details

### Team Name: SolverSpace


### Team Members
- Member 1: Anirudh Ajikumar - Sree Narayana Gurukulam College of Engineering
- Member 2: Abhinav Krishna C S - Sree Narayana Gurukulam College of Engineering

### Project Description
Anti-Social is a full-featured social media platform where users can register, follow friends, like posts, comment, and receive real-time notifications—with one crucial catch: nobody can ever view the post content. Every post is preserved forever in the database but intentionally scrubbed to `null` before reaching anyone, keeping everyone perfectly isolated together.

### The Problem (that doesn't exist)
People are exhausted from doom-scrolling, reading unwanted hot-takes, and actually knowing what their peers and influencers are thinking. The modern internet suffers from a catastrophic overabundance of legible communication and mutual understanding.

### The Solution (that nobody asked for)
We built a social network that delivers 100% of the dopamine hits of social engagement (avatars, timestamps, likes, comment badges, and follower feeds) while completely zeroing out the burden of communication. You get to know *that* someone posted, *when* they posted, and *how popular* it is—while being completely blocked by absurd privacy shields. You can even pay ₹99/month for Anti-Social Premium™ to receive exclusive confirmation that you still cannot see the post!

## Technical Details
### Technologies/Components Used
For Software:
- Languages: TypeScript, JavaScript (ES6+), SQL, CSS
- Frameworks: Next.js 16 (App Router), React 19, Express.js
- Libraries: Tailwind CSS v4, Node.js built-in SQLite (`node:sqlite`), bcryptjs, jsonwebtoken (JWT), CORS, dotenv
- Tools: Node.js (v22+), npm, Postman / cURL, Git, GitHub

For Hardware:
- Main components: Not applicable (Pure Software Project)
- Specifications: Standard PC / Laptop with web browser (Chrome, Firefox, Safari, Edge)
- Tools required: Keyboard, Mouse / Trackpad, and an active Internet connection

### Implementation
For Software:
# Installation
```bash
# Clone the repository
git clone https://github.com/A-b-h-i-n-a-V-01/useless_project_temp.git
cd useless_project_temp

# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

# Run
```bash
# 1. Start the Backend server (from /backend folder, requires Node >= 22)
cd backend
npm run migrate    # Set up tables and seed data
npm run dev        # Runs Express API on http://localhost:4000

# 2. Start the Frontend client (from /frontend folder in a separate terminal)
cd frontend
npm run dev        # Runs Next.js app on http://localhost:3000
```

### Project Documentation
For Software:

# Screenshots (Add at least 3)
![Screenshot1](Add screenshot 1 here with proper name)
*The landing page welcoming users to connect, share, and remain completely isolated.*

![Screenshot2](Add screenshot 2 here with proper name)
*The main feed showcasing posts with timestamps, like counts, and dynamic unavailable content shields.*

![Screenshot3](Add screenshot 3 here with proper name)
*Anti-Social Premium checkout page offering full transparency that payment will still not reveal any posts.*

# Diagrams
![Workflow](Add your workflow/architecture diagram here)
*Anti-Social architecture workflow: User submits post -> Express stores in SQLite -> API sanitizes post content to null -> Next.js displays engagement metrics with humorous redaction notices.

## Team Contributions
- Anirudh Ajikumar: Frontend UI/UX architecture, Next.js page designs, interactive components (Feed, Explore, Premium, ExitPopup), and client-side styling.
- Abhinav Krishna C S: Backend API development, SQLite database schemas, authentication & JWT middleware, post sanitization logic, and system integration.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
