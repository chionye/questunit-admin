import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

afterEach(cleanup);

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Pending</Badge>);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('applies the default variant styles', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toHaveClass('bg-primary/10');
  });

  it('applies the success variant styles', () => {
    render(<Badge variant='success'>Approved</Badge>);
    expect(screen.getByText('Approved')).toHaveClass('bg-green-100');
  });

  it('applies the danger variant styles', () => {
    render(<Badge variant='danger'>Rejected</Badge>);
    expect(screen.getByText('Rejected')).toHaveClass('bg-red-100');
  });

  it('appends a custom className', () => {
    render(<Badge className='mt-2'>Mixed</Badge>);
    expect(screen.getByText('Mixed')).toHaveClass('mt-2');
  });
});