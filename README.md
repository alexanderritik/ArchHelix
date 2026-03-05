<div align="center">
  <h1>ArchHelix</h1>
  <p><b>Understand any codebase in seconds.</b></p>
  <p>Architecture Intelligence tool that analyzes codebases and visually maps their structure, components, and dependencies.</p>

  <p>
    <a href="https://github.com/alexanderritik/ArchHelix/releases"><img src="https://img.shields.io/github/v/release/alexanderritik/ArchHelix?style=flat-square" alt="Release"></a>
    <a href="https://github.com/alexanderritik/ArchHelix/blob/main/LICENSE"><img src="https://img.shields.io/github/license/alexanderritik/ArchHelix?style=flat-square" alt="License"></a>
    <a href="https://github.com/alexanderritik/ArchHelix/stargazers"><img src="https://img.shields.io/github/stars/alexanderritik/ArchHelix?style=flat-square" alt="Stars"></a>
    <a href="https://github.com/alexanderritik/ArchHelix/issues"><img src="https://img.shields.io/github/issues/alexanderritik/ArchHelix?style=flat-square" alt="Issues"></a>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#benchmarks">Benchmarks</a> •
    <a href="#supported-languages">Languages</a>
  </p>
</div>

---

## 🚀 Why ArchHelix?

Jumping into a new repository? Dealing with messy spaghetti code? ArchHelix instantly reverse-engineers the codebase into a beautiful, interactive dependency graph. Find orphaned nodes, analyze domain interactions, and map codebase DNA without reading thousands of lines of code.

**Watch the Interactive UI Demo:**
<br>
<img src="https://raw.githubusercontent.com/alexanderritik/ArchHelix/main/docs/assets/demo.webp" width="100%" alt="ArchHelix Interactive UI Demo" />

## ✨ Features

- **Blazing Fast Analysis**: Parses ASTs locally in milliseconds.
- **Interactive Visual Graph**: Pan, zoom, and explore a beautiful React-based dependency map.
- **Polyglot Parsing**: Understands structural DNA out-of-the-box (Go, Python + more coming).
- **Embedded Web UI**: No SaaS, no cloud, no friction. The UI is embedded directly into the single binary.
- **Code Context Inspector**: Click any node to instantly view the code and its exact dependencies.

## ⚡ Quick Start

ArchHelix is absurdly simple to set up. No complex configs or containers required.

### 1. Install (macOS / Linux)
```bash
curl -sL https://raw.githubusercontent.com/alexanderritik/ArchHelix/main/install.sh | bash
```

### 2. Run
Point it to **any** local path or remote Git repository:
```bash
archhelix clone https://github.com/user/repository.git
```
*The UI will automatically open at `http://localhost:8080/`.*

## 📊 Benchmarks

ArchHelix is built for speed, designed to handle large-scale enterprise repositories locally without breaking a sweat.

| Project Size | Lines of Code | Analysis Time | Memory Usage |
|--------------|---------------|---------------|--------------|
| Small CLI    | ~10,000       | `< 50ms`      | `~15 MB`     |
| Mid API      | ~100,000      | `< 300ms`     | `~45 MB`     |
| Large Repo   | ~1,000,000    | `< 2.5s`      | `~180 MB`    |

*(Note: Benchmarks performed on an Apple M1 Pro. Performance scales beautifully with available cores.)*

## 🛠️ Supported Languages

- [x] **Go** (Full AST Parsing, precise dependency mapping, ignores test files automatically)
- [x] **Python** (AST Parsing, robust import resolution)
- [ ] *TypeScript/JavaScript (Coming Soon)*
- [ ] *Java (Coming Soon)*

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

<br>

**Dependency Graph View**
![Graph View](https://raw.githubusercontent.com/alexanderritik/ArchHelix/main/docs/assets/graph.png)

**File Inspector**
![Code Inspector](https://raw.githubusercontent.com/alexanderritik/ArchHelix/main/docs/assets/inspector.png)

</details>

## 💻 Build From Source

Want to hack on ArchHelix? 

```bash
# Clone the repository
git clone https://github.com/alexanderritik/ArchHelix
cd archhelix

# Build the Frontend Map (React)
cd ui
npm ci
npm run build
cd ..

# Build Go Binary
go build -o archhelix

# Run against a test repository
./archhelix clone <repository-url>
```

## 🤝 Contributing

We love contributions! Feel free to open issues, submit PRs, and help expand language support (e.g., TS/JS provider). Check out our open issues to get started.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
