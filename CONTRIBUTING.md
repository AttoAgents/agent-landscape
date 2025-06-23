# Contributing to Agent Landscape

Thank you for your interest in contributing to Agent Landscape project! This document provides guidelines for contributing to our knowledge graph that maps relationships between companies, investors, products, services, use cases, and protocols.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Data Schema](#data-schema)
- [Contributing Guidelines](#contributing-guidelines)
- [Recognition](#recognition)
- [License](#license)

## Project Overview

This project maintains a graph database that visualizes relationships in the technology ecosystem, particularly focusing on:
- Companies and their products/services
- Investment relationships
- Technology protocols and implementations
- Use cases and application areas
- Interconnections between different entities

## Getting Started

### Prerequisites

- Basic understanding of graph databases and JSON format
- Familiarity with Git and GitHub workflows
- Knowledge of the technology domain you're contributing to

### Setting Up Your Environment

1. Fork the repository
2. Clone your fork locally:
   ```bash
   git clone https://github.com/AttoAgents/agent-landscape.git
   cd agent-landscape
   ```
3. Create a new branch for your contribution:
    ```
    git checkout -b feature/your-contribution-name
    ```

## Data Schema

Our graph database follows a specific schema with nodes and edges:

### Node Types

Type | Description	
-----|--------------
Company	| Technology companies and organizations
Investor | Investment firms, VCs, and funding entities
Product	| Software products, platforms, and applications
Service	| MCP services and technical services 
UseCase	| Application areas and use cases
Protocol | Technical protocols and standards

### Node Structure

```json
{
  "data": {
    "id": "unique_id",
    "label": "Display Name",
    "type": "NodeType",
    "properties": {
      "url": "https://example.com",
      "github": "https://github.com/example",
      "description": "Brief description of the entity",
      "license": "MIT License"
    }
  }
}
```

### Edge Types

Relationship | Description | Example
-------------|-------------|----------------------------------
`INVESTED_IN`| Investment relationship | Investor → Company
`ACQUIRED` | Acquisition relationship | Company → Company
`DEVELOPED` | Development relationship | Company → Product/Service
`IN_AREA` | Application area relationship | Product/Service → UseCase
`SERVER` | Protocol server relationship | Service → Protocol
`CLIENT` | Protocol client relationship | Service → Protocol
`USES` | Usage relationship | Product → Product

### Edge Structure

```json
{
  "data": {
    "id": "unique_edge_id",
    "source": "source_node_id",
    "target": "target_node_id",
    "label": "RELATIONSHIP_TYPE"
  }
}
```

## Contributing Guidelines

### Types of Contributions

- Adding New Entities: Companies, products, services, protocols, etc.
- Adding Relationships: New connections between existing entities
- Updating Information: Correcting or enhancing existing data
- Code Improvements: Visualization, validation, or tooling enhancements
- Documentation: Improving guides, examples, or explanations

### Data Contribution Process

Adding New Nodes
1. Research thoroughly: Ensure the entity doesn't already exist
2. Provide complete information:
    - Accurate label/name
    - Valid URLs when available
    - GitHub repositories if applicable
    - Concise, informative descriptions
3. Verify all links: Ensure URLs are accessible and correct

Adding New Relationships
1. Verify both nodes exist: Source and target nodes must be present
2. Use correct relationship types: Follow the established edge labels
3. Ensure logical connections: Relationships should make business/technical sense
4. Avoid duplicates: Check if the relationship already exists

### Example Contribution

Adding a new company with its product to `data.json` file :

```json
{
  "nodes": [
    {
      "data": {
        "id": "c3",
        "label": "TechCorp Inc",
        "type": "Company",
        "properties": {
          "url": "https://techcorp.com",
          "github": "https://github.com/techcorp",
          "description": "AI-powered enterprise solutions provider"
        }
      }
    },
    {
      "data": {
        "id": "p3",
        "label": "TechCorp AI Platform",
        "type": "Product",
        "properties": {
          "url": "https://techcorp.com/ai-platform",
          "github": "https://github.com/techcorp/ai-platform",
          "description": "Enterprise AI platform for automated decision making"
        }
      }
    }
  ],
  "edges": [
    {
      "data": {
        "id": "e15",
        "source": "c3",
        "target": "p3",
        "label": "DEVELOPED"
      }
    }
  ]
}
```

### Submission Process

### Pull Request Guidelines

1. Create descriptive commits:
```bash
git commit -m "Add TechCorp Inc and AI Platform with development relationship"
```
2. Write clear PR descriptions:

 - What entities/relationships you're adding
 - Why they're relevant to the database
 - Sources for your information

3. Use the PR template

```markdown
## Changes Made
- [ ] Added new company: [Company Name]
- [ ] Added new product: [Product Name]
- [ ] Added relationship: [Type]
- [ ] Updated existing data
- [ ] Code improvements

## Verification
- [ ] All URLs tested and working
- [ ] No duplicate entities
- [ ] Follows schema guidelines
- [ ] JSON is valid

## Sources
- Company website: [URL]
- Additional sources: [URLs]
```

## Recognition

Contributors will be recognized through:

- GitHub contributor statistics
- Acknowledgment in release notes
- Community highlights for significant contributions

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.