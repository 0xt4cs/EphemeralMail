# Contributing to EphemeralMail

Thank you for your interest in contributing to this project! We welcome all contributions, from bug reports to new features.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/EphemeralMail.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Submit a pull request

## 💻 Development Setup

### Backend Development

```bash
# Clone the repository
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Install dependencies and setup
npm install
cp .env.example .env
# Edit .env with your development settings

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

The application will be available at:
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- SMTP Server: localhost:2525 (development)

### Testing Your Changes

For deployment testing, use the deployment script:

```bash
# Test deployment script
chmod +x deploy.sh
./deploy.sh localhost  # For local testing
```

## 📝 Code Style

- Use TypeScript for type safety
- Follow ESLint rules (run `npm run lint`)
- Use Prettier for code formatting (run `npm run format`)
- Write meaningful commit messages
- Add tests for new features

## 🧪 Testing

Run tests before submitting:

```bash
# Run tests
npm test

# Frontend tests
cd frontend
npm test
```

## 🐛 Bug Reports

When filing a bug report, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs or error messages

## 💡 Feature Requests

For feature requests:

- Explain the use case
- Describe the proposed solution
- Consider backward compatibility
- Discuss potential implementation approaches

## 📋 Pull Request Guidelines

- Keep PRs focused and small
- Include tests for new features
- Update documentation if needed
- Ensure all tests pass
- Follow the existing code style

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed

## 📞 Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions

Thank you for contributing! 🎉
