
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './src/pages/Profile';
import api from './src/services/api';
import '@testing-library/jest-dom';

jest.mock('./src/services/api');

const mockProfile = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  phone_number: '555-1234',
};

describe('Profile', () => {
  it('should render profile data after a successful fetch', async () => {
    api.get.mockResolvedValue({ data: mockProfile });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveValue('John');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
      expect(screen.getByLabelText('Email')).toHaveValue('john.doe@example.com');
      expect(screen.getByLabelText('Address')).toHaveValue('123 Main St');
      expect(screen.getByLabelText('City')).toHaveValue('Anytown');
      expect(screen.getByLabelText('State')).toHaveValue('CA');
      expect(screen.getByLabelText('Phone Number')).toHaveValue('555-1234');
    });
  });

  it('should render an error message on fetch failure', async () => {
    api.get.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile data.')).toBeInTheDocument();
    });
  });
});
