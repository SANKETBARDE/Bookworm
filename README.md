# 📚 Bookworm

Bookworm is a full-stack digital library web application where users can upload books, read PDFs online, download books, manage reading progress, save bookmarks, write reviews, and discover books shared by other users.

The project is built using **React.js frontend**, **Flask backend**, and **Supabase** for database, authentication, and file storage.

---

## 🚀 Features

### 👤 User Features

- User registration and login
- Browse available books
- Search books by title, author, category, or tags
- Read PDF books inside the website
- Download books
- Add books to reading list
- Track reading status:
  - To Be Read
  - Reading
  - Completed
  - Dropped
- Save bookmarks for last read page or reading position
- Add comments and reviews
- View public user profiles
- Request unavailable books

### 🛠️ Admin Features

- Admin dashboard
- Approve or reject uploaded books
- Manage books
- Manage users
- Manage book requests
- View platform activity

---

## 🧰 Tech Stack

### Frontend

- React.js
- React Router
- Axios
- CSS / Tailwind CSS / Bootstrap

### Backend

- Python
- Flask
- Flask-CORS
- Supabase Python Client

### Database & Storage

- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage

---

## 📁 Project Structure

```bash
bookworm/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── book_routes.py
│   │   ├── review_routes.py
│   │   ├── reading_list_routes.py
│   │   ├── bookmark_routes.py
│   │   └── admin_routes.py
│   │
│   └── utils/
│       └── supabase_client.py
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── BookDetails.jsx
│   │   │   ├── Reader.jsx
│   │   │   ├── UploadBook.jsx
│   │   │   ├── ReadingList.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── BookCard.jsx
│   │   │   ├── ReviewCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   └── services/
│   │       └── api.js
│
└── README.md
```

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bookworm.git
cd bookworm
```

---

## 🔧 Backend Setup

### 2. Go to Backend Folder

```bash
cd backend
```

### 3. Create Virtual Environment

```bash
python -m venv venv
```

### 4. Activate Virtual Environment

For Windows:

```bash
venv\Scripts\activate
```

For Mac/Linux:

```bash
source venv/bin/activate
```

### 5. Install Required Packages

```bash
pip install -r requirements.txt
```

### 6. Create `.env` File

Create a `.env` file inside the `backend` folder:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_or_service_key
SUPABASE_BUCKET=books
FLASK_ENV=development
```

### 7. Run Flask Backend

```bash
python app.py
```

Backend will run on:

```bash
http://127.0.0.1:5000
```

---

## 🎨 Frontend Setup

### 8. Go to Frontend Folder

Open a new terminal:

```bash
cd frontend
```

### 9. Install Dependencies

```bash
npm install
```

### 10. Create `.env` File

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 11. Run React Frontend

```bash
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

## 🗄️ Supabase Setup

### Required Supabase Services

You need to set up the following services in Supabase:

- Supabase Database
- Supabase Authentication
- Supabase Storage

### Storage Buckets

Create the following buckets in Supabase Storage:

```bash
books
covers
```

Use the `books` bucket for PDF files and the `covers` bucket for book cover images.

---

## 🗃️ Main Database Tables

The project can include the following tables:

- `users`
- `books`
- `book_reviews`
- `bookmarks`
- `reading_lists`
- `book_requests`
- `admin_logs`

---

# 📖 Running User Manual

This section explains how to use Bookworm after the project is running.

---

## 1. Open the Website

After starting both the backend and frontend, open:

```bash
http://localhost:5173
```

You will land on the Bookworm home page.

---

## 2. Create an Account

1. Click on **Register**.
2. Enter your name, email, and password.
3. Submit the form.
4. After successful registration, log in using your email and password.

---

## 3. Login

1. Click on **Login**.
2. Enter your registered email and password.
3. After successful login, you will be redirected to the home page or dashboard.

---

## 4. Browse Books

1. Go to the **Home** or **Books** page.
2. View all available books.
3. Each book card shows:
   - Book title
   - Author name
   - Cover image
   - Category
   - Rating
   - Reading status option

---

## 5. Search Books

1. Use the search bar.
2. Enter book name, author name, category, or tag.
3. Matching books will be displayed.

Example searches:

```bash
Atomic Habits
Psychology
Programming
Self Help
```

---

## 6. View Book Details

1. Click on any book.
2. The book details page will show:
   - Book title
   - Author
   - Description
   - Uploaded by
   - Reviews
   - Download option
   - Read online option
   - Add to reading list button

---

## 7. Read Book Online

1. Open a book details page.
2. Click **Read Online**.
3. The PDF reader will open inside the website.
4. You can read the book without downloading it.

---

## 8. Download a Book

1. Open the book details page.
2. Click **Download**.
3. The PDF file will be downloaded to your device.

---

## 9. Add Book to Reading List

1. Open a book.
2. Click **Add to Reading List**.
3. Choose a status:
   - To Be Read
   - Reading
   - Completed
   - Dropped

You can later update the status from your reading list page.

---

## 10. Save Bookmark

While reading a book:

1. Go to the page where you stopped reading.
2. Click **Save Bookmark**.
3. The system will save your current page or reading position.
4. Next time you open the book, you can continue from that position.

---

## 11. Add Review or Comment

1. Open any book details page.
2. Scroll to the review section.
3. Add a rating and comment.
4. Submit your review.

Your review will be visible to other users.

---

## 12. Upload a Book

1. Login to your account.
2. Go to **Upload Book**.
3. Fill in the book details:
   - Book title
   - Author
   - Description
   - Category
   - Tags
4. Upload:
   - PDF file
   - Cover image
5. Submit the form.

The uploaded book will go for admin approval before becoming public.

---

## 13. Request a Book

1. Go to the **Book Request** page.
2. Enter the book name and author.
3. Submit the request.
4. Admin can review the request and upload the book later.

---

## 14. View Profile

1. Go to **Profile**.
2. You can see:
   - Your uploaded books
   - Reading list
   - Reviews
   - Bookmarks
   - Completed books

---

## 15. Admin Dashboard

Admin can access the dashboard after login.

Admin can:

- Approve uploaded books
- Reject uploaded books
- Delete inappropriate books
- Manage users
- View book requests
- Manage reviews
- Monitor platform activity

---

## 🔐 User Roles

### Normal User

A normal user can:

- Read books
- Download books
- Upload books
- Add reviews
- Add bookmarks
- Manage reading list
- Request books

### Admin

An admin can:

- Approve books
- Reject books
- Manage users
- Manage requests
- Remove unwanted content

---

## ▶️ Running Both Frontend and Backend

Open two terminals.

### Terminal 1: Backend

```bash
cd backend
venv\Scripts\activate
python app.py
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Then open:

```bash
http://localhost:5173
```

---

## 🧪 Testing the Application

You can test the app by checking:

- User registration
- User login
- Book upload
- PDF file opening
- PDF download
- Search functionality
- Reading list status update
- Bookmark saving
- Review submission
- Admin approval

---

## 🌐 Deployment

Recommended deployment options:

### Frontend

- Vercel
- Netlify

### Backend

- Render
- Railway
- Fly.io

### Database and Storage

- Supabase

---

## 🔮 Future Enhancements

- AI-based book recommendation system
- Trending books section
- Author profile pages
- Book categories and advanced filters
- Like and save reviews
- Reading progress percentage
- Dark mode
- Email notifications
- Admin analytics dashboard
- Mobile app version

---

## 👨‍💻 Author

**Sanket Barde**

- GitHub: [SANKETBARDE](https://github.com/SANKETBARDE)
- Email: sanketbarde7322@gmail.com

---

## 📄 License

This project is open-source and available for educational and personal learning purposes.