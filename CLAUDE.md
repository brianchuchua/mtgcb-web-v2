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
