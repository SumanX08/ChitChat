// ChatBox.test.js

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppContext } from '../context/AppContext';
import ChatBox from '../Components/ChatBox';
import { db } from '../config/firebase'; // Mock Firebase functions

// Mocking necessary Firebase functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
}));

// Mocking the context
const mockContextValue = {
  userData: { id: 'user123' },
  messageId: 'message123',
  setMessages: jest.fn(),
  friends: [],
  selectedFriend: null,
  selectedGroup: null,
  setIsChatOpen: jest.fn(),
  isChatOpen: true,
  isInfoOpen: false,
  setIsInfoOpen: jest.fn(),
};

describe('ChatBox Component', () => {
  it('should render the ChatBox component without crashing', () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <ChatBox />
      </AppContext.Provider>
    );

    // Check if the basic elements are rendered
    expect(screen.getByText('Select a chat to start messaging')).toBeInTheDocument();
  });

  it('should toggle the menu visibility when clicked', () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <ChatBox />
      </AppContext.Provider>
    );

    // Check if menu button is clickable and toggles visibility
    const menuButton = screen.getByAltText('Menu Icon');
    fireEvent.click(menuButton);
    
    // Assuming the menu will be displayed upon click
    expect(screen.getByText('Clear Chat')).toBeInTheDocument();
  });

  it('should call clearChat when Clear Chat is clicked', async () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <ChatBox />
      </AppContext.Provider>
    );

    fireEvent.click(screen.getByAltText('Menu Icon'));
    fireEvent.click(screen.getByText('Clear Chat'));

    // Check if clearChat was called (mocked function)
    await waitFor(() => expect(mockContextValue.setMessages).toHaveBeenCalled());
  });

  it('should handle the scheduling of a message', async () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <ChatBox />
      </AppContext.Provider>
    );

    fireEvent.click(screen.getByAltText('Menu Icon'));
    fireEvent.click(screen.getByText('Schedule Message'));

    const messageInput = screen.getByPlaceholderText('Enter message');
    const timeInput = screen.getByPlaceholderText('Enter time');
    const scheduleButton = screen.getByText('Schedule');

    // Simulating the user input for scheduling a message
    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    fireEvent.change(timeInput, { target: { value: '2025-02-09T10:00' } });
    fireEvent.click(scheduleButton);

    await waitFor(() => expect(mockContextValue.setIsInfoOpen).toHaveBeenCalled());
  });
});
