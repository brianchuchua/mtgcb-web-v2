/**
 * Setup validation test
 * Purpose: Verify Jest + React Testing Library are configured correctly
 */

import React from 'react';
import { renderHook } from '@testing-library/react';

describe('Testing Infrastructure Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to jest matchers', () => {
    expect('hello').toBe('hello');
    expect([1, 2, 3]).toHaveLength(3);
    expect({ name: 'test' }).toHaveProperty('name');
  });

  it('should have access to jest-dom matchers', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);

    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello World');
  });

  it('should render a simple hook', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = React.useState(0);
      return { count, setCount };
    });

    expect(result.current.count).toBe(0);
  });

  it('should have mocked localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');

    localStorage.clear();
    expect(localStorage.getItem('test')).toBeNull();
  });

  it('should have mocked sessionStorage', () => {
    sessionStorage.setItem('test', 'value');
    expect(sessionStorage.getItem('test')).toBe('value');

    sessionStorage.clear();
    expect(sessionStorage.getItem('test')).toBeNull();
  });

  it('should have mocked Next.js router', () => {
    const { useRouter } = require('next/navigation');
    const router = useRouter();

    expect(router.push).toBeDefined();
    expect(router.replace).toBeDefined();
  });
});
