import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'react-toastify';
import Notifications from './Notifications';
import CreateGroup from './CreateGroup';
import { AppContext } from '../context/AppContext';

const ShowMenu = ({ fetchFriends, fetchGroup }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { friends } = useContext(AppContext);
  const navigate = useNavigate();

  const toggleShowMenu = () => setShowMenu((prev) => !prev);

  const handleNewGroup = () => {
    setShowCreateGroup(true);
    setShowMenu(false);
  };

  const handleProfileUpdate = () => {
    navigate('/updateProfile');
    setShowMenu(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error(error.message || "An error occurred during logout.");
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="relative">
        <img
          className="cursor-pointer max-h-5 opacity-65"
          onClick={toggleShowMenu}
          src={assets.menu_icon}
          alt="menu"
        />

        {showMenu && (
          <div className="absolute right-0 z-20 flex flex-col w-32 gap-1 p-2 text-center bg-white rounded cursor-pointer text-customBlack top-10">
            <p onClick={handleProfileUpdate}>Profile</p>
            <hr />
            <p onClick={handleNewGroup}>New Group</p>
            <hr />
            <p onClick={() => setShowNotifications(true)}>Notifications</p>
            <hr />
            <p onClick={handleLogout}>Logout</p>
          </div>
        )}
      </div>

      {showNotifications && (
        <Notifications
          setShowNotifications={setShowNotifications}
          fetchFriends={fetchFriends}
        />
      )}

      {showCreateGroup && (
        <CreateGroup
          fetchGroup={fetchGroup}
          onClose={() => setShowCreateGroup(false)}
          friends={friends}
        />
      )}
    </div>
  );
};

export default ShowMenu;
