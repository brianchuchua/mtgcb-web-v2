# Dashboard Layout Component

A reusable dashboard layout component that provides a responsive layout with header, sidebar, and main content area.

## Features

- Responsive design with different behaviors for mobile and desktop
- Collapsible sidebar
- Persistent or temporary drawer based on viewport size
- Configurable sidebar width
- Context-based state management

## Usage

```tsx
import Dashboard from '@/components/layout/Dashboard';

const App = () => {
  return (
    <Dashboard sidenavWidth={320}>
      <YourContent />
    </Dashboard>
  );
};
```

## Props

- `sidenavWidth` (optional): Width of the sidebar in pixels. Defaults to 320.
- `children`: Main content to render in the dashboard.

## TODO

- Add support for injecting custom sidebar content
- Add support for injecting custom header content
- Add support for custom menu items
- Move to dedicated package if reuse across projects is needed
