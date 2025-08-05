import React, { useEffect, useState, useContext } from 'react';
import { doc, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppContext } from '../context/AppContext';
import assets from '../assets/assets';
import upload from '../storage/upload';

function GroupInfo({ groupInfo, setGroupInfo }) {
  const { selectedGroup, setGroup, friends, membersInfo, loadGroupUsers } = useContext(AppContext);

  const [groupSettings, setGroupSettings] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [editingGroupImage, setEditingGroupImage] = useState(false);
  const [newGroupImage, setNewGroupImage] = useState(null);
  const [addingMembers, setAddingMembers] = useState(false);
  const [newMembers, setNewMembers] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [newGroupName, setNewGroupName] = useState(selectedGroup?.groupName || '');

  // Load user info for group members
  
  useEffect(() => {
    if (selectedGroup?.members?.length) {
      loadGroupUsers(selectedGroup.members);
    }
  }, [selectedGroup?.id]);

  const handleAddMembers = () => {
    setAddingMembers(true);
    const groupMemberIds = selectedGroup.members || [];
    const friendsNotInGroup = friends.filter(
      friend => !groupMemberIds.includes(friend.friend.id)
    );
    setFilteredFriends(friendsNotInGroup);
  };

  const handleEditGroupName = async () => {
    try {
      const groupRef = doc(db, "groups", selectedGroup.id);
      await updateDoc(groupRef, { groupName: newGroupName });

      setGroup(prev =>
        prev.map(g =>
          g.id === selectedGroup.id ? { ...g, groupName: newGroupName } : g
        )
      );
      setEditingGroupName(false);
    } catch (error) {
      console.error("Error updating group name:", error);
    }
  };

  const handleEditGroupImage = async () => {
    if (!newGroupImage) return;

    try {
      const newImageUrl = await upload(newGroupImage);
      const groupRef = doc(db, "groups", selectedGroup.id);
      await updateDoc(groupRef, { groupImage: newImageUrl });

      setGroup(prev =>
        prev.map(g =>
          g.id === selectedGroup.id ? { ...g, groupImage: newImageUrl } : g
        )
      );
      setEditingGroupImage(false);
    } catch (error) {
      console.error("Error updating group image:", error);
    }
  };

  const handleAddNewMembers = async () => {
    try {
      const newMemberIds = newMembers.map(m => m.friend.id);
      const groupRef = doc(db, "groups", selectedGroup.id);

      await updateDoc(groupRef, {
        members: arrayUnion(...newMemberIds),
      });

      setGroup(prev =>
        prev.map(g =>
          g.id === selectedGroup.id
            ? { ...g, members: [...g.members, ...newMemberIds] }
            : g
        )
      );

      setAddingMembers(false);
      setNewMembers([]);
    } catch (error) {
      console.error("Error adding new members:", error);
    }
  };

  const removeMember = async (memberId) => {
    try {
      const groupRef = doc(db, "groups", selectedGroup.id);
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
      });
      
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };


  return (
    <div className="relative">
      {groupInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-11/12 max-w-md p-6 bg-white rounded-lg shadow-lg lg:w-1/3">
            <div className="flex items-center justify-between pb-3 border-b-2">
              <h2 className="text-lg font-bold text-gray-800">Group Info</h2>
              <button onClick={() => setGroupInfo(false)} className="text-gray-500 hover:text-gray-800">
                ✖
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <img src={selectedGroup.groupImage} className="w-20 h-20 rounded-full" alt="Group" />
                <p className="text-lg font-bold text-gray-800">{selectedGroup.groupName}</p>
              </div>
              <div className="relative">
                <img
                  className="w-6 cursor-pointer"
                  onClick={() => setGroupSettings(!groupSettings)}
                  src={assets.Bmenu_icon}
                  alt="Settings"
                />
                {groupSettings && (
                  <div className="absolute right-0 z-20 flex flex-col p-1 bg-gray-200 rounded shadow-md w-44 text-customBlack" style={{ top: '100%' }}>
                    <p className="py-2 text-center cursor-pointer hover:bg-gray-300" onClick={() => setEditingGroupName(true)}>Edit Group Name</p>
                    <p className="py-2 text-center cursor-pointer hover:bg-gray-300" onClick={() => setEditingGroupImage(true)}>Edit Group Image</p>
                    <p className="py-2 text-center cursor-pointer hover:bg-gray-300" onClick={handleAddMembers}>Add Members</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-medium text-customBlack">Members</h3>
              <ul className="divide-y divide-gray-200">
                {membersInfo.map((member) => (
                  <li key={member.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4">
                      <img src={member.avatar} alt={member.username} className="w-8 h-8 rounded-full" />
                      <p className="text-lg text-gray-800">{member.username}</p>
                    </div>
                    <img
                      onClick={() => removeMember(member.id)}
                      src={assets.reject_icon}
                      className="w-6 cursor-pointer"
                      alt="Remove"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      
      {editingGroupName && (
        <Modal title="Edit Group Name" onCancel={() => setEditingGroupName(false)} onSave={handleEditGroupName}>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full p-2 mt-2 border rounded"
          />
        </Modal>
      )}

      {editingGroupImage && (
        <Modal title="Edit Group Image" onCancel={() => setEditingGroupImage(false)} onSave={handleEditGroupImage}>
          <input type="file" onChange={(e) => setNewGroupImage(e.target.files[0])} className="w-full p-2 mt-2 border rounded" />
        </Modal>
      )}

      {addingMembers && (
        <Modal title="Add New Members" onCancel={() => setAddingMembers(false)} onSave={handleAddNewMembers}>
          {filteredFriends.map((user) => (
            <div key={user.id} className="flex items-center gap-2 my-2">
              <input
                type="checkbox"
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setNewMembers(prev =>
                    isChecked
                      ? [...prev, user]
                      : prev.filter(member => member.id !== user.id)
                  );
                }}
              />
              <img src={user.friend.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
              <p className="text-customBlack">{user.friend.username}</p>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}


function Modal({ title, children, onCancel, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-white rounded shadow-lg w-[90%] max-w-md">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <div>{children}</div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 bg-gray-200 rounded">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-white bg-blue-600 rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default GroupInfo;
