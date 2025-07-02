import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const upload = (file) => {
  return new Promise((resolve, reject) => {
    const storage = getStorage();
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);  // Add reject in case of error
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
          resolve(downloadURL);
        });
      }
    );
  });
};

export default upload;
