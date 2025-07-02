import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatDetails from '../components/ChatDetails';
import { AppContext } from '../context/AppContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { logout } from '../config/firebase';

// Mock assets import
jest.mock('../assets/assets', () => ({
  arrow_icon: 'path/to/arrow_icon.png',
  Info_icon: 'path/to/info_icon.png',
  green_dot: 'path/to/green_dot.png',
}));

// Mock AppContext
const mockContextValue = {
  messages: [
    { image: 'image_url', video: null, document: null, fileName: 'test_image.jpg' },
    { image: null, video: 'video_url', document: null, fileName: 'test_video.mp4' },
    { image: null, video: null, document: 'document_url', fileName: 'test_document.pdf' },
  ],
  group: null,
  isInfoOpen: true,
  setIsInfoOpen: jest.fn(),
  selectedGroup: null,
  selectedFriend: { friend: { avatar: 'avatar_url', username: 'John Doe', bio: 'Hello there!' } },
  isFriendOnline: true,
};

describe('ChatDetails Component', () => {
  it('should render the friend details and image tab by default', () => {
    render(
      <Router>
        <AppContext.Provider value={mockContextValue}>
          <ChatDetails friend={mockContextValue.selectedFriend} isFriendOnline={mockContextValue.isFriendOnline} />
        </AppContext.Provider>
      </Router>
    );

    // Check if the friend's username is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check if the "Images" tab is rendered and active
    expect(screen.getByText('Images')).toHaveClass('border-b-2 border-customBlue');
    expect(screen.getByText('No images shared.')).toBeInTheDocument();
  });

  it('should toggle between images, videos, and documents tabs', async () => {
    render(
      <Router>
        <AppContext.Provider value={mockContextValue}>
          <ChatDetails friend={mockContextValue.selectedFriend} isFriendOnline={mockContextValue.isFriendOnline} />
        </AppContext.Provider>
      </Router>
    );

    // Check initial tab (Images)
    expect(screen.getByText('Images')).toHaveClass('border-b-2 border-customBlue');
    expect(screen.getByText('No images shared.')).toBeInTheDocument();

    // Switch to Videos tab
    fireEvent.click(screen.getByText('Videos'));
    await waitFor(() => screen.getByText('No videos shared.'));
    expect(screen.getByText('No videos shared.')).toBeInTheDocument();

    // Switch to Documents tab
    fireEvent.click(screen.getByText('Documents'));
    await waitFor(() => screen.getByText('No documents shared.'));
    expect(screen.getByText('No documents shared.')).toBeInTheDocument();
  });

  it('should log out the user', async () => {
    const mockNavigate = jest.fn();
    render(
      <Router>
        <AppContext.Provider value={mockContextValue}>
          <ChatDetails friend={mockContextValue.selectedFriend} isFriendOnline={mockContextValue.isFriendOnline} />
        </AppContext.Provider>
      </Router>
    );

    // Mock logout function
    jest.spyOn(logout, 'mockImplementation').mockResolvedValueOnce();

    // Simulate click on logout button
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('should toggle the info panel when the info icon is clicked', () => {
    const { setIsInfoOpen } = mockContextValue;
    render(
      <Router>
        <AppContext.Provider value={mockContextValue}>
          <ChatDetails friend={mockContextValue.selectedFriend} isFriendOnline={mockContextValue.isFriendOnline} />
        </AppContext.Provider>
      </Router>
    );

    // Check if the info icon exists
    expect(screen.getByAltText('Info icon')).toBeInTheDocument();

    // Simulate clicking the info icon
    fireEvent.click(screen.getByAltText('Info icon'));
    expect(setIsInfoOpen).toHaveBeenCalledWith(true);
  });
});
