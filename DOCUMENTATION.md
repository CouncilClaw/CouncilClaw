# CouncilClaw Documentation Index

Complete guide to all documentation available for CouncilClaw.

## 🚀 Getting Started

Start here if you're new to CouncilClaw!

### [QUICK_START.md](QUICK_START.md) - Commands Cheat Sheet
- First time setup (2 minutes)
- Core commands
- Common configurations
- Cost-efficient model selections
- Troubleshooting checklist
- **Best for:** People who want quick commands to copy-paste

### [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) - Complete OpenRouter Guide
- What is OpenRouter
- Why use OpenRouter
- Step-by-step account creation
- Getting your API key
- Setting up billing
- Detailed troubleshooting
- Best practices for security and costs
- Multiple model configuration examples
- **Best for:** First-time users who need detailed explanations

### [docs/OPENROUTER_VISUAL_GUIDE.md](docs/OPENROUTER_VISUAL_GUIDE.md) - Visual Diagrams
- Setup flow diagram
- Dashboard navigation map
- Account state diagrams
- Cost visualization
- Compatibility charts
- Checklist for correct setup
- **Best for:** Visual learners who prefer diagrams

---

## 📖 Core Documentation

### [README.md](README.md) - Main Project Documentation
- Project overview and features
- Quick start instructions
- Feature list
- Supported models by provider
- Model selection recommendations
- Links to all other documentation
- **Best for:** Overview and project overview

### [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System Architecture
- High-level system pipeline
- Core modules overview
- Component interactions
- Data flow during execution
- **Best for:** Understanding how CouncilClaw works internally

### [docs/API.md](docs/API.md) - API Reference
- Webhook API endpoints
- Request/response formats
- Authentication
- Error handling
- Code examples
- **Best for:** Integrating CouncilClaw with external systems

---

## 🧠 Memory System Documentation

### [docs/MEMORY.md](docs/MEMORY.md) - Memory System Complete Guide
- Overview and capabilities
- Memory components explanation
- How memory works with council
- Memory storage structure
- Fact categories and confidence scoring
- Configuration options
- API usage examples
- Best practices
- Comparison with OpenClaw
- Troubleshooting
- **Best for:** Understanding and using the memory system

### [docs/MEMORY_ARCHITECTURE.md](docs/MEMORY_ARCHITECTURE.md) - Memory Technical Architecture
- System flow diagrams
- Component interaction diagrams
- Data flow visualization
- Memory categories and scoring
- Session lifecycle
- Integration points
- Performance characteristics
- Error handling and fallbacks
- **Best for:** Technical understanding of memory implementation

### [MEMORY_IMPLEMENTATION.md](MEMORY_IMPLEMENTATION.md) - Memory Implementation Details
- What was implemented
- File structure and line counts
- Key capabilities
- Configuration
- How memory enhances experience
- Build status and testing
- Comparison with OpenClaw
- **Best for:** Developers who implemented/maintain memory system

### [examples/memory-examples.ts](examples/memory-examples.ts) - Memory Code Examples
- 9 complete working examples
- Session management
- Context retrieval
- User profiling
- Real-world progressive learning scenario
- **Best for:** Developers integrating memory into code

---

## 📋 Configuration & Setup

### [SECURITY.md](SECURITY.md) - Security Considerations
- Risk acknowledgment
- Security best practices
- API key management
- Shell command execution safety
- Telemetry and privacy
- **Best for:** Security-conscious users and enterprise deployments

---

## 📚 Additional Resources

### [examples/](examples/) Directory
- `memory-examples.ts` - Memory system examples
- (More examples can be added)

### Web Resources
- **OpenRouter**: https://openrouter.ai
- **OpenRouter Docs**: https://openrouter.ai/docs
- **OpenRouter Dashboard**: https://openrouter.ai/dashboard

---

## 📖 Documentation Map by User Type

### 👤 New User - "I just want to get started"
1. Read [QUICK_START.md](QUICK_START.md) (2 min)
2. Run `npm run setup`
3. Run `npm run chat`
4. Done! ✨

### 🧑‍💻 Developer - "I want to understand the architecture"
1. Read [README.md](README.md) - Overview
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
3. Read [docs/API.md](docs/API.md) - Integration points
4. Check [examples/memory-examples.ts](examples/memory-examples.ts) - Code samples

### 🧠 Memory System User - "I want to use memory effectively"
1. Read [docs/MEMORY.md](docs/MEMORY.md) - Overview
2. Check [examples/memory-examples.ts](examples/memory-examples.ts) - Code examples
3. Review [MEMORY_IMPLEMENTATION.md](MEMORY_IMPLEMENTATION.md) - How it works
4. Deep dive: [docs/MEMORY_ARCHITECTURE.md](docs/MEMORY_ARCHITECTURE.md) - Technical details

### 🔧 OpenRouter Setup - "I need help with API key"
**Choose your learning style:**
- 💨 **Quick:** [QUICK_START.md](QUICK_START.md) → Section: "OpenRouter API Key"
- 📖 **Detailed:** [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) → Full guide
- 🎨 **Visual:** [docs/OPENROUTER_VISUAL_GUIDE.md](docs/OPENROUTER_VISUAL_GUIDE.md) → Diagrams

### 🚀 Production Deployment - "I need security and reliability"
1. Read [SECURITY.md](SECURITY.md) - Security considerations
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
3. Read [docs/API.md](docs/API.md) - API documentation
4. Review [docs/MEMORY.md](docs/MEMORY.md) - Memory configuration

### 🐛 Troubleshooting - "Something isn't working"
1. Check [QUICK_START.md](QUICK_START.md) → "Troubleshooting Checklist"
2. Check [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) → "Troubleshooting" section
3. Run `npm run verify` to check system
4. Check GitHub issues if still stuck

---

## 📊 Documentation Statistics

| Document | Purpose | Length |
|----------|---------|--------|
| [README.md](README.md) | Main documentation | ~500 lines |
| [QUICK_START.md](QUICK_START.md) | Command reference | ~200 lines |
| [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) | Setup guide | ~355 lines |
| [docs/OPENROUTER_VISUAL_GUIDE.md](docs/OPENROUTER_VISUAL_GUIDE.md) | Visual guide | ~250 lines |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture | ~30 lines |
| [docs/MEMORY.md](docs/MEMORY.md) | Memory system guide | ~400 lines |
| [docs/MEMORY_ARCHITECTURE.md](docs/MEMORY_ARCHITECTURE.md) | Memory technical details | ~300 lines |
| [MEMORY_IMPLEMENTATION.md](MEMORY_IMPLEMENTATION.md) | Implementation details | ~200 lines |
| [docs/API.md](docs/API.md) | API reference | ~150 lines |
| [SECURITY.md](SECURITY.md) | Security guide | ~100 lines |
| **Total** | **All documentation** | **~2,500 lines** |

---

## 🔄 Documentation Relationships

```
README.md (Entry point)
    ├── QUICK_START.md (Quick reference)
    ├── docs/OPENROUTER_SETUP.md (API key setup)
    ├── docs/OPENROUTER_VISUAL_GUIDE.md (Visual diagrams)
    ├── docs/ARCHITECTURE.md (How it works)
    ├── docs/API.md (Integration)
    ├── docs/MEMORY.md (Memory system overview)
    │   ├── docs/MEMORY_ARCHITECTURE.md (Technical details)
    │   ├── MEMORY_IMPLEMENTATION.md (What was built)
    │   └── examples/memory-examples.ts (Code samples)
    ├── SECURITY.md (Security guide)
    └── [Source code](src/)
```

---

## 🎯 Quick Links

### Setup & Configuration
- First time: [QUICK_START.md](QUICK_START.md)
- OpenRouter help: [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md)
- Visual guide: [docs/OPENROUTER_VISUAL_GUIDE.md](docs/OPENROUTER_VISUAL_GUIDE.md)

### Learning & Understanding
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Memory system: [docs/MEMORY.md](docs/MEMORY.md)
- API reference: [docs/API.md](docs/API.md)

### Security & Deployment
- Security guide: [SECURITY.md](SECURITY.md)
- Best practices section in guides

### Code & Examples
- Memory examples: [examples/memory-examples.ts](examples/memory-examples.ts)
- Source code: [src/](src/)

---

## 📝 How to Use This Index

1. **New?** → Start with [QUICK_START.md](QUICK_START.md)
2. **Stuck?** → Use "Troubleshooting" sections in relevant docs
3. **Want details?** → Find your topic in the table above
4. **Learning style:**
   - **Quick scripts/commands** → [QUICK_START.md](QUICK_START.md)
   - **Step-by-step text** → [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md)
   - **Visual diagrams** → [docs/OPENROUTER_VISUAL_GUIDE.md](docs/OPENROUTER_VISUAL_GUIDE.md)
   - **Code examples** → [examples/](examples/)
   - **Technical deep dive** → [docs/MEMORY_ARCHITECTURE.md](docs/MEMORY_ARCHITECTURE.md)

---

## 🔗 External Links

- **OpenRouter** (Get API key): https://openrouter.ai
- **OpenRouter Docs**: https://openrouter.ai/docs
- **OpenRouter Dashboard**: https://openrouter.ai/dashboard
- **OpenRouter Models**: https://openrouter.ai/models
- **CouncilClaw GitHub**: [Your repository URL]

---

**Last updated:** March 4, 2026

Need something not listed here? → Check the [README.md](README.md) or create an issue on GitHub!
