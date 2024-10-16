import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz0s6YhO_x58A1CU8n6rp1jTrhMXDDAhY",
  authDomain: "bulldogs-exchange.firebaseapp.com",
  projectId: "bulldogs-exchange",
  storageBucket: "bulldogs-exchange.appspot.com",
  messagingSenderId: "756908205528",
  appId: "1:756908205528:web:da9563b3e3fc10f40ebead",
  measurementId: "G-Z2H16L9JKM",
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM element references
const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const submitPostButton = document.getElementById("submitPostButton");
const categorySelect = document.getElementById("category-types");

// Function to preview images in thumbnails
function setupThumbnailPreview(
  thumbnailContainerId,
  thumbnailInputId,
  thumbnailPreviewId
) {
  const thumbnailContainer = document.getElementById(thumbnailContainerId);
  const thumbnailInput = document.getElementById(thumbnailInputId);
  const thumbnailPreview = document.getElementById(thumbnailPreviewId);

  thumbnailContainer.addEventListener("click", function () {
    thumbnailInput.click();
  });

  thumbnailInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        thumbnailPreview.src = e.target.result;
        thumbnailPreview.style.display = "block"; // Show the image
        thumbnailContainer.querySelector(".thumbnail-image").style.display =
          "none"; // Hide the text
      };
      reader.readAsDataURL(file);
    }
  });
}

// Setup thumbnail preview for each thumbnail
setupThumbnailPreview(
  "thumbnailContainer1",
  "thumbnailInput1",
  "thumbnailPreview1"
);
setupThumbnailPreview(
  "thumbnailContainer2",
  "thumbnailInput2",
  "thumbnailPreview2"
);
setupThumbnailPreview(
  "thumbnailContainer3",
  "thumbnailInput3",
  "thumbnailPreview3"
);

// Setup image preview for the main image
document
  .getElementById("addImageContainer")
  .addEventListener("click", function () {
    fileInput.click();
  });

fileInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block"; // Show the image
      document.querySelector("#addImageContainer span").style.display = "none"; // Hide the placeholder text
    };
    reader.readAsDataURL(file);
  }
});

// Function to get selected checkbox values
function getSelectedValues(checkboxName) {
  const checkboxes = document.querySelectorAll(
    `input[name="${checkboxName}"]:checked`
  );
  let values = [];
  checkboxes.forEach((checkbox) => {
    values.push(checkbox.value);
  });
  return values;
}

// Function to upload the post to Firestore
async function uploadPost(imageFile, thumbnailFiles) {
  try {
    if (!imageFile || thumbnailFiles.length < 3) {
      alert("Please select both an image and three thumbnails.");
      return;
    }

    // Upload image to Firebase Storage
    const imageStorageRef = ref(storage, `inventory_images/${imageFile.name}`);
    const imageSnapshot = await uploadBytes(imageStorageRef, imageFile);
    const imageURL = await getDownloadURL(imageSnapshot.ref);

    // Upload thumbnails to Firebase Storage
    let thumbnailURLs = [];
    for (let i = 0; i < thumbnailFiles.length; i++) {
      const thumbnailStorageRef = ref(
        storage,
        `thumbnails/${thumbnailFiles[i].name}`
      );
      const thumbnailSnapshot = await uploadBytes(
        thumbnailStorageRef,
        thumbnailFiles[i]
      );
      const thumbnailURL = await getDownloadURL(thumbnailSnapshot.ref);
      thumbnailURLs.push(thumbnailURL);
    }

    // Collect post data
    const name = document.getElementById("postTitle").value.trim();
    const description = document.getElementById("postDescription").value.trim();
    const price = document.getElementById("postPrice").value.trim();
    const colors = getSelectedValues("color");
    const sizes = getSelectedValues("size");
    const type = categorySelect.value;

    if (!name || !description || !price) {
      alert("Please fill out all required fields (Title, Description, Price).");
      return;
    }

    // Create a new document in Firestore under 'Inventory'
    const newPostRef = doc(db, "Inventory", name);
    await setDoc(newPostRef, {
      stocks: 0,
      name: name,
      description: description,
      price: price,
      ImageURL: imageURL,
      thumbnailURLs: thumbnailURLs, // Store the URLs of all thumbnails
      colors: colors,
      sizes: sizes,
      type: type,
      createdAt: new Date().toISOString(),
    });

    alert("Post uploaded successfully!");
  } catch (error) {
    console.error("Error uploading post: ", error);
    alert("Failed to upload post. Please try again.");
  }
}

// Handle form submission
submitPostButton.addEventListener("click", async function () {
  const imageFile = fileInput.files[0];
  const thumbnailFiles = [
    document.getElementById("thumbnailInput1").files[0],
    document.getElementById("thumbnailInput2").files[0],
    document.getElementById("thumbnailInput3").files[0],
  ];

  if (!imageFile || thumbnailFiles.includes(undefined)) {
    alert("Please select both an image and three thumbnails!");
    return;
  }

  await uploadPost(imageFile, thumbnailFiles);
});
