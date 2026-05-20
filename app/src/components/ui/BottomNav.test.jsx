import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useCart } from '../../lib/hooks/useCart';

describe('BottomNav', () => {
  beforeEach(() => {
    localStorage.clear();
    useCart.setState({ items: [], vendorId: null });
  });

  it('shows a cart item badge when the buyer has selected items', () => {
    useCart.setState({
      items: [
        { id: 'burger', name: 'Burger', price: 8.5, quantity: 2 },
        { id: 'fries', name: 'Fries', price: 3, quantity: 1 },
      ],
      vendorId: 'vendor-1',
    });

    render(
      <MemoryRouter initialEntries={['/order/vendor/vendor-1']}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('3 cart items')).toBeInTheDocument();
  });
});
