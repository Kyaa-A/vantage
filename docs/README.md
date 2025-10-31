# VANTAGE Documentation

Welcome to the VANTAGE documentation! This directory contains comprehensive documentation for the Seal of Good Local Governance for Barangays (SGLGB) assessment platform.

## Quick Links

- **New to VANTAGE?** Start with [Getting Started](./getting-started/README.md)
- **Need help?** Check [Troubleshooting](./troubleshooting/README.md)
- **Building features?** See [Developer Guides](./guides/README.md)
- **Understanding the system?** Read [Architecture](./architecture/README.md)

## Documentation Structure

### 🚀 Getting Started
New developer onboarding and setup instructions.
- [Installation](./getting-started/installation.md) - Initial setup
- [Local Development](./getting-started/local-development.md) - Running locally
- [Docker Setup](./getting-started/docker-setup.md) - Docker environment

### 🏗️ Architecture
System design, patterns, and technical decisions.
- [System Overview](./architecture/system-overview.md) - High-level architecture
- [Backend Architecture](./architecture/backend-architecture.md) - FastAPI structure
- [Frontend Architecture](./architecture/frontend-architecture.md) - Next.js structure
- [Database Schema](./architecture/database-schema.md) - Data model design
- [Type Generation](./architecture/type-generation.md) - Type safety workflow
- [Decisions (ADR)](./architecture/decisions.md) - Architectural decisions

### 📡 API Documentation
RESTful API endpoints, authentication, and schemas.
- [API Overview](./api/README.md)
- [Authentication](./api/authentication.md)
- [Endpoints by Domain](./api/endpoints/)

### 📚 Developer Guides
Step-by-step guides for common development tasks.
- [Adding Features](./guides/adding-features.md) - Feature development workflow
- [Database Migrations](./guides/database-migrations.md) - Alembic workflow
- [Testing](./guides/testing.md) - Testing guidelines
- [Service Layer Pattern](./guides/service-layer-pattern.md) - Backend pattern
- [Deployment](./guides/deployment.md) - Deployment process

### 🔄 Business Workflows
SGLGB assessment workflow documentation.
- [BLGU Assessment](./workflows/blgu-assessment.md) - BLGU submission workflow
- [Assessor Validation](./workflows/assessor-validation.md) - Assessor review process
- [Classification Algorithm](./workflows/classification-algorithm.md) - 3+1 SGLGB logic
- [Intelligence Layer](./workflows/intelligence-layer.md) - AI-powered insights

### 📋 Product Requirements (PRDs)
Detailed product requirement documents for major features.
- [Core User Authentication](./prds/prd-core-user-authentication-and-management.md)
- [BLGU Pre-Assessment Workflow](./prds/prd-blgu-pre-assessment-workflow.md)
- [Assessor Validation & Rework Cycle](./prds/prd-assessor-validation-rework-cycle.md)
- [Core Intelligence Layer](./prds/prd-core-intelligence-layer.md)

### 🔧 Troubleshooting
Common issues and solutions.
- [Docker Issues](./troubleshooting/docker.md)
- [Backend Issues](./troubleshooting/backend.md)
- [Frontend Issues](./troubleshooting/frontend.md)
- [Common Errors](./troubleshooting/common-errors.md)

## Other Resources

- **[Project Roadmap](./project-roadmap.md)** - Feature development roadmap
- **[CLAUDE.md](../CLAUDE.md)** - Instructions for Claude Code AI assistant
- **[API Docs (Live)](http://localhost:8000/docs)** - Interactive FastAPI documentation (when backend is running)

## Contributing to Documentation

We follow these documentation standards:

- **Python**: Google-style docstrings
- **TypeScript**: JSDoc comments
- **Markdown**: GitHub-flavored markdown
- **Diagrams**: Mermaid.js for architecture diagrams

See [Contributing Guide](./guides/contributing.md) for more details.

## Getting Help

- Check the [Troubleshooting](./troubleshooting/README.md) section first
- Review relevant [Developer Guides](./guides/README.md)
- Consult the [Architecture](./architecture/README.md) docs for design questions
- Ask in the team channel

---

**Last Updated**: 2025-10-31
**Maintained By**: VANTAGE Development Team
