# Roomie Board 🏠

A smart roommate management app built with React, TypeScript, and Supabase. Manage chores, bills, kitchen inventory, and noise considerations with your roommates in one place.

Demo video here - https://www.youtube.com/watch?v=c7GrHeyzK5o

## ✨ Features

- **Chore Management** - Assign and track household tasks
- **Bill Splitting** - Split expenses and track who owes what
- **Kitchen Inventory** - Manage shared kitchen items
- **Noise Notes** - Communicate quiet time requests
- **Real-time Updates** - See changes instantly across all devices
- **Comment System** - Discuss and coordinate with roommates
- **Activity Feed** - Track all recent activities
- **Secure Authentication** - Email-based signup with password reset



## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (Auth, Database, Real-time)
- **Deployment**: Netlify
- **Notifications**: React Toastify

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd roomie-board
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🗄 Database Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Get your project URL and anon key

### 2. Create Profiles Table
Run this SQL in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '👤',
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    '👤'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🚀 Deployment

### Deploy to Netlify

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Click "Deploy site"

3. **Configure Environment Variables**
   - In your Netlify dashboard, go to Site settings > Environment variables
   - Add your Supabase environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Configure Redirects**
   The `netlify.toml` file is already configured, but you can also add this in Netlify's dashboard:
   - Go to Site settings > Redirects
   - Add rule: `/* /index.html 200`

### Alternative: Deploy with Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

### Supabase Configuration

1. **Authentication Settings**
   - Go to Authentication > Settings in Supabase
   - Configure your site URL (your Netlify domain)
   - Add redirect URLs for password reset

2. **Email Templates**
   - Customize email templates in Authentication > Email Templates
   - Update the password reset email template

## 📱 Usage

1. **Sign Up**: Create an account with your email
2. **Verify Email**: Check your inbox and verify your account
3. **Invite Roommates**: Share the app with your roommates
4. **Start Managing**: Add chores, bills, and other items
5. **Stay Updated**: Check the activity feed for recent changes

## 🔒 Security Features

- Email verification required for new accounts
- Secure password reset via email links
- Row Level Security (RLS) on database
- HTTPS enforced in production
- XSS protection headers
- CSRF protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your browser, OS, and steps to reproduce

## 🎯 Roadmap

- [ ] Push notifications
- [ ] Mobile app
- [ ] Calendar integration
- [ ] Expense categories
- [ ] Roommate profiles
- [ ] File sharing
- [ ] Voice notes
- [ ] Integration with smart home devices

---

Made with ❤️ for better roommate living 
