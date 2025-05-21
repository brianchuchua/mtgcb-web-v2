# MTGCB Web Code Style Guidelines

This document outlines the preferred code style for the MTG CB Web project.

## General Principles

- Follow a top-down readability approach (Clean Code style)
- Main components/functions appear first, with implementation details below
- Organize functions by decreasing importance/abstraction level
- Use descriptive function and variable names
- Apply single-responsibility principle to component design
- Create small, focused functions that do one thing well

## React Components

- Use functional components with hooks instead of class components
- Define prop interfaces with explicit TypeScript types
- Place prop interfaces close to the components that use them
- Use default props within the function parameter destructuring
- Follow component composition pattern with many small, focused components
- Use conditional rendering for optional UI elements

```typescript
// Example component structure
const MyComponent: React.FC<MyComponentProps> = ({
  requiredProp,
  optionalProp = defaultValue,
}) => {
  // Component logic here

  return (
    <Wrapper>
      {optionalProp && <OptionalElement />}
      <MainContent>{requiredProp}</MainContent>
    </Wrapper>
  );
};

interface MyComponentProps {
  requiredProp: string;
  optionalProp?: boolean;
}
```

## Styling

- Use Material-UI (MUI) for component styling
- Prefer styled components approach for custom styling
- Follow consistent theme spacing and color usage
- Use responsive design patterns

```typescript
const StyledComponent = styled(MuiComponent)(({ theme }) => ({
  padding: theme.spacing(2),
  color: theme.palette.primary.main,
  [theme.breakpoints.down('md')]: {
    // Responsive styles
  },
}));
```

## TypeScript

- Use explicit typing for all variables, functions, and components
- Create interfaces for component props and other complex objects
- Use type guards where appropriate to narrow types
- Follow TypeScript best practices for null/undefined handling

## File Organization

- Group related components, interfaces, and utility functions together
- Export default the main component of a file
- Export named components/functions that may be reused elsewhere

## Project Information

### Project Overview

MTG Collection Builder (MTG CB) is a web application for Magic: The Gathering card collectors to track their collection and its value. The application allows users to browse cards and sets, manage their collection, and view pricing information from TCGPlayer.

### Tech Stack

- **Framework**: Next.js 15.x with React 19
- **UI Library**: Material-UI (MUI) 6.x
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Emotion (CSS-in-JS)
- **Form Handling**: React Hook Form
- **Virtualization**: React Virtuoso for performant card lists
- **Testing**: Playwright for end-to-end testing
- **TypeScript**: Strict typing throughout the codebase

### Key Features

- Browse Magic: The Gathering cards and sets
- Toggle between grid and table views
- Set display preferences for cards and tables
- Filter cards by various attributes (color, set, type, etc.)
- Sort results by different criteria
- User authentication system
- Collection management
- TCGPlayer integration for pricing data and affiliate links
- Responsive design for desktop and mobile devices

### Project Structure

- `/src/api`: API service definitions using RTK Query
- `/src/app`: Next.js App Router pages and layout components
- `/src/components`: Reusable UI components
- `/src/features`: Feature-specific components and logic
- `/src/hooks`: Custom React hooks
- `/src/redux`: Redux store configuration and slices
- `/src/styles`: Global styling and theme
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions

### Development Workflow

1. Make it work
2. Make it fast
3. Make it clean
