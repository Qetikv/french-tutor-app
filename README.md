# 🇫🇷 French Language Tutor

An interactive French language learning platform built with SvelteKit that provides real-time translation, grammar checking, vocabulary exploration, and pronunciation practice.

## 🔒 Security Note

Before deploying or pushing to GitHub:
1. Ensure your `.env` file is listed in `.gitignore`
2. Never commit API keys, passwords, or sensitive credentials
3. Use environment variables for all sensitive data
4. Check `.env.example` contains only placeholder values
5. Review all files for any hardcoded sensitive information

## ✨ Features

### 🎯 Practice Chat
- Real-time bilingual conversations
- Instant translations between English and French
- Interactive pronunciation with text-to-speech
- Context-aware translations with grammar explanations
- Sentence-level audio playback for proper pronunciation

### ✍️ Grammar Check
- Advanced French grammar analysis
- Detailed error explanations
- Correction suggestions
- Common mistake identification
- Usage examples

### 📚 Word Explorer
- Comprehensive vocabulary learning
- Word definitions and usage examples
- Pronunciation guides with audio support
- Cultural context and usage notes
- Related words and expressions

### 💡 French Tips
- Cultural insights
- Language learning strategies
- Common expressions
- Usage guidelines
- Learning resources

## 🛠 Technology Stack

- **Frontend**: SvelteKit
- **UI Framework**: Sveltestrap
- **Text-to-Speech**: Web Speech API
- **Styling**: Custom CSS with responsive design
- **Animations**: CSS transitions and keyframes

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Qetikv/french-tutor.git
```

2. Install dependencies:
```bash
cd french-tutor
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Replace placeholder values with your actual credentials
   - Never commit `.env` file to version control
   - Keep your API keys and sensitive data secure

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 💻 Development

The application is structured into several key components:
- Modern, responsive UI with a clean and intuitive design
- Real-time speech synthesis for pronunciation practice
- Tab-based navigation for different learning modes
- Interactive chat interface for practice sessions

## 🌟 Key Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Interactive Learning**: Real-time feedback and corrections
- **Audio Support**: Native text-to-speech for pronunciation
- **Multiple Learning Modes**: Different approaches to language learning
- **User-Friendly Interface**: Clean and intuitive design

## 🔐 Environment Variables

The following environment variables need to be set in your `.env` file:
```
# API Configuration
API_KEY=your_api_key_here
API_URL=your_api_url_here

# Other Configuration
NODE_ENV=development
PORT=3000
```

Remember:
- Never commit real API keys or sensitive data
- Use placeholder values in `.env.example`
- Keep your `.env` file secure and local only
- Use environment variables for all sensitive configuration

