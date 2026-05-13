import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuantityControl from './QuantityControl';

describe('QuantityControl', () => {
  it('renders plus and minus controls and calls handlers', () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();

    render(<QuantityControl value={2} onIncrement={onIncrement} onDecrement={onDecrement} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    fireEvent.click(screen.getByLabelText(/decrease quantity/i));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('disables decrement at the minimum value', () => {
    render(<QuantityControl value={0} min={0} onIncrement={vi.fn()} onDecrement={vi.fn()} />);

    expect(screen.getByLabelText(/decrease quantity/i)).toBeDisabled();
  });
});
