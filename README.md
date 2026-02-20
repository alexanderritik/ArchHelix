# ArchHelix

ArchHelix is an Architecture Intelligence tool that analyzes codebases and visually maps their structure, components, and dependencies. It currently supports analyzing Go and Python project architectures out-of-the-box.

## Features
- **Visual Graph**: An interactive graph UI mapping your codebase.
- **Polyglot Analysis**: Analyze structural DNA from various languages (Go, Python).
- **Embedded Web UI**: ArchHelix runs a local React-based UI directly from the binary.
- **Code Dependency Context**: Understand how different domains interact with each other.

## Installation

You can install ArchHelix easily through a single curl command.

### macOS and Linux
```bash
curl -sL https://raw.githubusercontent.com/ritiksrivastava/archhelix/main/install.sh | bash
```

Alternatively, you can build from source:

```bash
# Clone the repository
git clone https://github.com/ritiksrivastava/archhelix
cd archhelix

# Build the Frontend Map
cd ui
npm ci
npm run build
cd ..

# Build Go Binary
go build -o archhelix

# Run
./archhelix clone <repository-url>
```

## Quick Start

1. Start analyzing a remote or local project by running the clone command with any remote Git URL.
```bash
archhelix clone https://github.com/user/repository.git
```
2. The UI will automatically start on `http://localhost:8080`.

## Supported Languages
- Go
- Python

## License
MIT License
# ArchHelix
