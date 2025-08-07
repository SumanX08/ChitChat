import React, { useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { AppContext } from '../context/AppContext';
import { auth, db } from '../config/firebase';
import upload from '../storage/upload';
import assets from '../assets/assets';

const UpdateProfile = () => {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [uid, setUid] = useState('');
  const [prevImage, setPrevImage] = useState('');
  const [avatarURL, setAvatarURL] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { setUserData } = useContext(AppContext);

  const filePreview = useMemo(() => {
    return image ? URL.createObjectURL(image) : avatarURL || assets.avatar_icon;
  }, [image, avatarURL]);

  const fetchUserData = async (uid) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setLoading(true);

    try {
      const uploadedUrl = await upload(file);
      setAvatarURL(uploadedUrl);
     
    } catch (err) {
      toast.error('Image upload failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const profileUpdate = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Name cannot be empty.');
    if (!avatarURL) return toast.error('Please upload a profile picture.');

    setLoading(true);
    try {
      const updates = {
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatarURL,
      };

      await updateDoc(doc(db, 'users', uid), updates);

      const updatedData = await fetchUserData(uid);
      setUserData(updatedData);
      toast.success('Profile updated successfully!');
      navigate('/chat');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const data = await fetchUserData(user.uid);
        if (data) {
          setName(data.name || '');
          setBio(data.bio || '');
          setAvatarURL(data.avatar || '');
          setPrevImage(data.avatar || '');
        }
      } else {
        toast.error('Please login first.');
        navigate('/login');
      }
    });

    return unsubscribe;
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#3b82f6]">
      <div className="flex flex-col-reverse bg-white rounded-xl w-356px min-h-96 lg:flex-row lg:min-w-700px">
        <form onSubmit={profileUpdate} className="flex flex-col justify-end gap-5 p-5 lg:min-w-96 lg:p-10 lg:pr-0">
          <h2 className="text-2xl font-semibold text-customBlack">Profile Details</h2>

          <label htmlFor="avatar" className="flex items-center gap-3 text-lg cursor-pointer text-textColor">
            <input
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg ,.webp"
              hidden
              onChange={handleImageChange}
            />
            <img
              src={filePreview}
              alt="Profile Preview"
              className="w-12 rounded-full aspect-square lg:w-14"
            />
            Update Profile Picture
          </label>

          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 p-2 font-semibold border border-borderColor text-customBlack"
            required
          />

          <textarea
            placeholder="Your Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="h-16 p-2 font-semibold border resize-none border-borderColor text-customBlack"
          />

          <button
            type="submit"
            disabled={loading}
            className={`h-10 text-white rounded bg-customBlue`}
          >
            Save
          </button>
        </form>

        <img
          src={filePreview}
          alt="Profile Avatar Preview"
          className="w-24 mx-auto mt-5 rounded-full aspect-square lg:w-40 lg:m-auto"
        />
      </div>
    </div>
  );
};

export default UpdateProfile;
