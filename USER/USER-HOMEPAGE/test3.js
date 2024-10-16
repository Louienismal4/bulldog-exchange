import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// Check if the user is logged in and display their profile picture

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize auth after the app
const user = auth.currentUser;

onAuthStateChanged(auth, (user) => {
  const profilePicElement = document.querySelector(".profile-pic");
  if (user) {
    console.log("User logged in:", user.displayName); // Log user object for debugging
    console.log("User is logged in:", user); // Log user object for debugging

    // Set profile picture
    const profilePictureUrl = user.photoURL;
    if (profilePictureUrl) {
      profilePicElement.src = profilePictureUrl; // Set the profile picture
      profilePicElement.alt = user.displayName || "User Profile"; // Set an alternative text
    } else {
      console.warn("User does not have a profile picture. Using default.");
      profilePicElement.src = "../../assets/default.jpg"; // Fallback profile picture
      profilePicElement.alt = "Default Profile"; // Fallback alt text
    }
  } else {
    console.error("User is not logged in.");
    profilePicElement.src = "../../assets/default.jpg"; // Default profile picture for logged-out users
    profilePicElement.alt = "Default Profile"; // Default alt text
  }
});

// Get the userID from localStorage
const userID = localStorage.getItem("userID");
console.log("User ID: ", userID);

// Fetch data from Firestore and update the product-grid
async function fetchItems() {
  try {
    const querySnapshot = await getDocs(collection(db, "Inventory"));

    // Find containers based on their section titles
    let uniformGridContainer = null;
    let merchGridContainer = null;
    let accesoriesGridContainer = null;

    document.querySelectorAll(".section-title").forEach((sectionTitle) => {
      if (sectionTitle.textContent.trim() === "UNIFORM") {
        uniformGridContainer =
          sectionTitle.nextElementSibling.querySelector(".product-grid");
      } else if (sectionTitle.textContent.trim() === "MERCH") {
        merchGridContainer =
          sectionTitle.nextElementSibling.querySelector(".product-grid");
      } else if (sectionTitle.textContent.trim() === "ACCESSORIES") {
        accesoriesGridContainer =
          sectionTitle.nextElementSibling.querySelector(".product-grid");
      }
    });

    if (
      !uniformGridContainer ||
      !merchGridContainer ||
      !accesoriesGridContainer
    ) {
      console.error(
        "Error: Could not find the containers for UNIFORM or MERCH."
      );
      return;
    }

    // Clear existing items
    uniformGridContainer.innerHTML = "";
    merchGridContainer.innerHTML = "";
    accesoriesGridContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const productItem = document.createElement("div");
      productItem.classList.add("product-item");

      productItem.innerHTML = `
                  <img src="${data.ImageURL}" alt="${data.name}">
                  <p>${data.name}</p>
                  <p>Available Stock: ${data.stock}</p>
                  <div class="unavailable-overlay">Out of stock</div>
              `;

      // Check if the item is available
      if (data.availability === false) {
        productItem.classList.add("unavailable"); // Add a class for unavailable items
      }

      // Add a click event to each item to show the modal
      productItem.addEventListener("click", () => {
        if (data.availability !== false) {
          showModal(data, doc.id);
        } else {
          alert("This item is unavailable.");
        }
      });

      // Check the 'type' field and append to the appropriate section
      if (data.type === "Uniform") {
        uniformGridContainer.appendChild(productItem);
      } else if (data.type === "Merch") {
        merchGridContainer.appendChild(productItem);
      } else if (data.type === "Accessories") {
        accesoriesGridContainer.appendChild(productItem);
      }
    });
  } catch (error) {
    console.error("Error fetching items: ", error);
  }
}

// Search functionality
function searchStocks() {
  const input = document.getElementById("searchBar").value.toLowerCase();
  const productItems = document.querySelectorAll(".product-item");

  productItems.forEach((item) => {
    const productName = item
      .querySelector("p:nth-child(2)")
      .textContent.toLowerCase();
    const matchesSearch = productName.includes(input);
    item.style.display = matchesSearch ? "" : "none"; // Use a direct condition
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("searchBar").addEventListener("input", searchStocks);
});

// Show the modal with product details
function showModal(data, docId) {
  const modal = document.getElementById("productModal");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const modalPrice = document.querySelector(".price");
  const sizeSelect = document.getElementById("size");
  const colorsContainer = document.querySelector(".colors");

  // Set the content of the modal
  modalImage.src = data.ImageURL;
  modalTitle.textContent = data.name;
  modalDescription.textContent =
    data.description || "No description available.";
  modalPrice.textContent = data.price ? `₱${data.price}` : "No price yet"; // Display the price fetched from Firestore

  // Clear existing sizes and colors
  sizeSelect.innerHTML = "";
  colorsContainer.innerHTML = '<label for="color">Color:</label>';

  // Dynamically populate the sizes
  if (data.sizes && Array.isArray(data.sizes)) {
    data.sizes.forEach((size) => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      sizeSelect.appendChild(option);
    });
  } else {
    sizeSelect.innerHTML = "<option>No sizes available</option>";
  }

  // Dynamically populate the colors
  if (data.colors && Array.isArray(data.colors)) {
    data.colors.forEach((color) => {
      const colorInput = document.createElement("input");
      colorInput.type = "radio";
      colorInput.name = "color";
      colorInput.value = color;
      colorInput.id = `color-${color}`;

      const colorLabel = document.createElement("label");
      colorLabel.htmlFor = `color-${color}`;
      colorLabel.textContent = color.charAt(0).toUpperCase() + color.slice(1);

      colorsContainer.appendChild(colorInput);
      colorsContainer.appendChild(colorLabel);
    });
  } else {
    colorsContainer.innerHTML += "No colors available";
  }

  // Display the modal
  modal.style.display = "block";
}

// Close the modal
document.querySelector(".close-button").addEventListener("click", () => {
  document.getElementById("productModal").style.display = "none";
});

// Close the modal if the user clicks outside of it
window.addEventListener("click", (event) => {
  const modal = document.getElementById("productModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
});

document
  .querySelector(".add-to-cart")
  .addEventListener("click", addToCartAndSave);

// Combined function to add an item to the cart and save it to Firestore
async function addToCartAndSave() {
  const modalTitle = document.getElementById("modalTitle").textContent;
  const size = document.getElementById("size").value;
  const colorElement = document.querySelector('input[name="color"]:checked');
  const color = colorElement ? colorElement.value : "No available colors";
  const price = document.querySelector(".price").textContent;
  const imageUrl = document.getElementById("modalImage").src;

  // Get the currently logged-in user
  const user = auth.currentUser;

  if (!user) {
    console.error("User is not logged in. Cannot save reserved item.");
    return;
  }

  const userDisplayName = user.displayName || "Anonymous";

  // Create a new reserved item element
  const reservedItem = document.createElement("div");
  reservedItem.classList.add("reserved-item");

  reservedItem.innerHTML = `
      <div class="reserved-item-image">
          <img src="${imageUrl}" alt="${modalTitle}" />
      </div>
      <div class="reserved-item-details">
          <p class="item-title">${modalTitle}</p>
          <p class="item-price">${price}</p>
          <p class="item-color">Color: ${color}</p>
          <p class="item-size">Size: ${size}</p>
          <button class="delete-item">Remove</button>
      </div>
    `;

  // Append the reserved item to the cart
  document.querySelector(".listCart").appendChild(reservedItem);

  // Close the modal after adding to the cart
  document.getElementById("productModal").style.display = "none";

  // Update cart count
  updateCartCount();

  // Structure the reserved item data for Firestore
  const itemData = {
    title: modalTitle,
    price: price,
    color: color,
    size: size,
    imageUrl: imageUrl,
    addedBy: userDisplayName,
    userId: user.uid,
    userEmail: user.email,
    dateAndTime: new Date(), // Add current date and time
  };

  try {
    // Save the item under the user's Cart collection in Firestore
    const docRef = await addDoc(
      collection(db, "Reserves", user.uid, "Cart"),
      itemData
    );
    console.log("Item successfully added to cart and saved to Firestore");

    // Add newField to user's uid collection
    const userDocRef = doc(db, "Reserves", user.uid);
    await setDoc(userDocRef, { newField: "newValue" }, { merge: true });

    console.log("New field added to user document.");

    // Set the data-id attribute to the Firestore document ID
    reservedItem
      .querySelector(".delete-item")
      .setAttribute("data-id", docRef.id);
  } catch (error) {
    console.error("Error saving item to Firestore:", error);
  }
}

// Update the event listener for the "Add to Cart" button
document
  .querySelector(".add-to-cart")
  .addEventListener("click", addToCartAndSave);

// Fetch reserved items from Firestore and update the UI
async function fetchReservedItems() {
  if (!userID) {
    console.error("User is not logged in. Cannot fetch reserved items.");
    return;
  }

  try {
    // Fetch the reserved items from Firestore under the user's Cart
    const cartCollection = collection(db, "Reserves", userID, "Cart");
    const querySnapshot = await getDocs(cartCollection);

    const cartList = document.querySelector(".listCart");
    cartList.innerHTML = ""; // Clear previous content

    querySnapshot.forEach((doc) => {
      const itemData = doc.data();

      // Create a new reserved item element
      const reservedItem = document.createElement("div");
      reservedItem.classList.add("reserved-item");

      reservedItem.innerHTML = `
            <div class="reserved-item-image">
                <img src="${itemData.imageUrl}" alt="${itemData.title}" />
            </div>
            <div class="reserved-item-details">
                <p class="item-title">${itemData.title}</p>
                <p class="item-price">${itemData.price}</p>
                <p class="item-color">Color: ${itemData.color}</p>
                <p class="item-size">Size: ${itemData.size}</p>
                <button class="delete-item" data-id="${doc.id}">Remove</button>
            </div>
          `;

      // Append the reserved item to the cart
      cartList.appendChild(reservedItem);
    });

    // Update the cart count after loading the reserved items
    updateCartCount();
  } catch (error) {
    console.error("Error fetching reserved items: ", error);
  }
}

// Use event delegation to handle remove item clicks
document.querySelector(".listCart").addEventListener("click", async (event) => {
  if (event.target.classList.contains("delete-item")) {
    event.preventDefault(); // Prevent default action
    event.stopPropagation(); // Stop event from bubbling up to other click handlers

    const reservedItem = event.target.closest(".reserved-item");
    const itemId = event.target.getAttribute("data-id"); // Fetch the itemId from the data-id attribute

    if (itemId) {
      // Remove the item from the DOM
      reservedItem.remove();
      updateCartCount();

      // Remove the item from Firestore
      await removeReservedItemFromFirestore(itemId);
    } else {
      console.error("Error: itemId is null or undefined.");
    }
  }
});

async function removeReservedItemFromFirestore(itemId) {
  if (!userID) {
    console.error("User is not logged in. Cannot remove reserved item.");
    return;
  }

  try {
    // Delete the item from Firestore
    await deleteDoc(doc(db, "Reserves", userID, "Cart", itemId));
    console.log("Item successfully removed from Firestore");
  } catch (error) {
    console.error("Error removing item from Firestore:", error);
  }
}

// Function to update the cart count in the icon
function updateCartCount() {
  const cartCount = document.querySelector(".listCart").children.length;
  document.querySelector(".icon-box span").textContent = cartCount;
}

// Close modal logic (already in place)
document.querySelector(".close-button").addEventListener("click", () => {
  document.getElementById("productModal").style.display = "none";
});

window.addEventListener("click", (event) => {
  const modal = document.getElementById("productModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
});

// Function to remove an item from the cart
function closeCartTab() {
  const cartTab = document.querySelector(".cartTab");
  cartTab.style.transform = "translateX(100%)"; // Move the cart tab to the right
  cartTab.style.transition = "transform 0.3s ease-in-out"; // Add transition for smooth effect
}

document.querySelector(".close").addEventListener("click", closeCartTab);

function openCartTab() {
  const cartTab = document.querySelector(".cartTab");
  cartTab.style.transform = "translateX(0%)"; // Move the cart tab to the right
  cartTab.style.transition = "transform 0.3s ease-in-out"; // Add transition for smooth effect
}

document.querySelector(".icon-box").addEventListener("click", openCartTab);

window.addEventListener("DOMContentLoaded", fetchItems);

window.addEventListener("click", (event) => {
  const cartTab = document.querySelector(".cartTab");
  if (!cartTab.contains(event.target) && !event.target.closest(".icon-box")) {
    closeCartTab();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Setup the event listener for "Add to Cart" button
  document
    .querySelector(".add-to-cart")
    .addEventListener("click", addToCartAndSave);

  // Fetch items and any other initialization tasks
  fetchItems();
  updateCartCount();
  fetchReservedItems();
});
