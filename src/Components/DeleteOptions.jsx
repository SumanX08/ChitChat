import React, { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { AppContext } from "../context/AppContext";

const DeleteOptions = ({
  senderId,
  groupMembers,
  messageId,
  groupId,
  deleteMessage,
  deleteMessageForEveryone,
  setShowDeleteOptions,
}) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { userData, membersInfo, loadGroupUsers } = useContext(AppContext);

  useEffect(() => {
    if (groupId && groupMembers?.length && membersInfo?.length === 0) {
      loadGroupUsers();
    }
  }, [groupId, groupMembers, membersInfo]);

  const toggleSelection = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleDeleteOptions = () => {
    setShowDeleteOptions(false);
  };

  const deleteForSpecificMember = async (memberId) => {
    if (!memberId || typeof memberId !== "string") return;
    try {
      const messageRef = doc(db, "groups", groupId, "messages", messageId);
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) return;

      await updateDoc(messageRef, {
        deletedFor: arrayUnion(memberId),
      });
    } catch (err) {
      console.error("Error deleting for member:", err);
    }
  };

  const handleDelete = async () => {
    if (selectedMembers.includes("me")) await deleteMessage(messageId);
    if (selectedMembers.includes("everyone")) await deleteMessageForEveryone(messageId);

    const otherMemberDeletes = selectedMembers.filter(
      (id) => id !== "me" && id !== "everyone"
    );

    await Promise.all(otherMemberDeletes.map(deleteForSpecificMember));

    setShowDeleteOptions(false);
  };

  const isSender = userData?.id === senderId;
  const availableMembers = membersInfo?.filter((m) => m?.id !== userData?.id) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg">
        <p className="mb-4 text-lg font-semibold">Select an option:</p>

       
        <div className="flex items-center justify-between mb-2">
          <p className="w-1/2 px-4 py-2 mb-2 text-sm text-white rounded-lg bg-customBlue">
            Delete for Me
          </p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={selectedMembers.includes("me")}
            onChange={() => toggleSelection("me")}
          />
        </div>

        
        {isSender && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="w-1/2 px-4 py-2 mb-2 text-sm text-white rounded-lg bg-customBlue">
                Delete for Everyone
              </p>
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={selectedMembers.includes("everyone")}
                onChange={() => toggleSelection("everyone")}
              />
            </div>

            {availableMembers.map((user) => (
              <div key={user.id} className="flex items-center justify-between mb-2">
                <p className="w-1/2 px-4 py-2 mb-2 text-sm text-white rounded-lg bg-customBlue">
                  {user.name}
                </p>
                <input
                  type="checkbox"
                  className="cursor-pointer"
                  checked={selectedMembers.includes(user.id)}
                  onChange={() => toggleSelection(user.id)}
                />
              </div>
            ))}
          </>
        )}

        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded-lg cursor-pointer hover:bg-red-600"
        >
          Delete
        </button>

        <button
          onClick={toggleDeleteOptions}
          className="w-full px-4 py-2 mt-4 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteOptions;
