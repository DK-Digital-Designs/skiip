import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HoldToConfirmButton from './HoldToConfirmButton';

describe('HoldToConfirmButton', () => {
  it('requires the full hold duration before confirming', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();

    render(
      <HoldToConfirmButton onConfirm={onConfirm} holdMs={500}>
        Cancel
      </HoldToConfirmButton>,
    );

    const button = screen.getByRole('button', { name: /cancel/i });
    fireEvent.mouseDown(button);
    vi.advanceTimersByTime(300);
    fireEvent.mouseUp(button);
    vi.advanceTimersByTime(300);

    expect(onConfirm).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('confirms after a completed hold', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();

    render(
      <HoldToConfirmButton onConfirm={onConfirm} holdMs={500}>
        Cancel
      </HoldToConfirmButton>,
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: /cancel/i }));
    vi.advanceTimersByTime(500);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
