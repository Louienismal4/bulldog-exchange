import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch data from Firestore and update the product-grid
async function fetchItems() {
  try {
    const querySnapshot = await getDocs(collection(db, "Inventory"));

    // Find containers based on their section titles
    let uniformGridContainer = null;
    let merchGridContainer = null;
    let accessoriesGridContainer = null; // Add accessories container

    document.querySelectorAll(".section-title").forEach((sectionTitle) => {
      if (sectionTitle.textContent.trim() === "UNIFORM") {
        uniformGridContainer =
          sectionTitle.nextElementSibling.querySelector(".product-grid");
      } else if (sectionTitle.textContent.trim() === "MERCH") {
        merchGridContainer =
          sectionTitle.nextElementSibling.querySelector(".product-grid");
      } else if (sectionTitle.textContent.trim() === "ACCESSORIES") {
        // Add the ACCESSORIES section
        accessoriesGridContainer =
          sectionTitle.nextElementSibling.querySelector(".product-grid");
      }
    });

    if (
      !uniformGridContainer ||
      !merchGridContainer ||
      !accessoriesGridContainer
    ) {
      console.error(
        "Error: Could not find the containers for UNIFORM, MERCH, or ACCESSORIES."
      );
      return;
    }

    // Clear existing items
    uniformGridContainer.innerHTML = "";
    merchGridContainer.innerHTML = "";
    accessoriesGridContainer.innerHTML = ""; // Clear accessories container

    function updateAvailability(productData) {
      if (productData.stocks === 0) {
        productData.availability = false;
      }
      return productData;
    }

    querySnapshot.forEach((doc) => {
      let data = doc.data();
      console.log("Item Type: ", data.type); // Add this line

      data = updateAvailability(data); // Update availability based on stocks

      const productItem = document.createElement("div");
      productItem.classList.add("product-item");

      productItem.innerHTML = `
                <img src="${data.ImageURL}" alt="${data.name}">
                <p>${data.name}</p>
                <p>Available Stocks: ${data.stocks}</p>
                <div class="unavailable-overlay">Out of stock</div>
            `;

      // Check if the item is available
      if (data.availability === false) {
        productItem.classList.add("unavailable");
      }

      // Add a click event to each item to show the modal
      productItem.addEventListener("click", () => {
        showModal(data, doc.id);
      });

      // Append the item to the appropriate section based on 'type'
      if (data.type === "Uniform") {
        uniformGridContainer.appendChild(productItem);
      } else if (data.type === "Merch") {
        merchGridContainer.appendChild(productItem);
      } else if (data.type === "Accessories") {
        // Append to the accessories section
        console.log("Accessories item found: ", data);
        accessoriesGridContainer.appendChild(productItem);
      }
    });
  } catch (error) {
    console.error("Error fetching items: ", error);
  }
}

async function deleteItem(docId) {
  try {
    await deleteDoc(doc(db, "Inventory", docId));
    alert("Item deleted successfully!");
    await fetchItems(); // Refresh the list after deletion
  } catch (error) {
    console.error("Error deleting item: ", error);
    alert("Failed to delete item. Please try again.");
  }
}

function searchStocks() {
  // Get the search input value
  const input = document.getElementById("searchBar").value.toLowerCase();

  // Get all product items
  const productItems = document.querySelectorAll(".product-item");

  // Loop through the product items and hide those that don't match the search query
  productItems.forEach((item) => {
    // Access the fields you want to search (e.g., name, description, and type)
    const productName = item
      .querySelector("p:nth-child(2)")
      .textContent.toLowerCase();
    const productDescription = item.querySelector(".product-description")
      ? item.querySelector(".product-description").textContent.toLowerCase()
      : "";
    const productType =
      item.parentElement.parentElement.previousElementSibling.textContent
        .trim()
        .toLowerCase(); // Uniform or Merch section

    // Check if the search input matches any of these fields
    if (
      productName.includes(input) ||
      productDescription.includes(input) ||
      productType.includes(input)
    ) {
      item.style.display = ""; // Show the matching product
    } else {
      item.style.display = "none"; // Hide non-matching products
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("searchBar").addEventListener("input", searchStocks);
});

// Show the modal with product details
function showModal(data, docId) {
  const modal = document.getElementById("productModal");
  const modalImage = document.getElementById("modalImage");
  const modalTitleInput = document.getElementById("modalTitleInput");
  const modalDescriptionInput = document.getElementById(
    "modalDescriptionInput"
  );
  const modalPrice = document.getElementById("modalPrice");
  const modalAvailability = document.getElementById("modalAvailability");
  const modalStocks = document.getElementById("modalStocks");

  // Set the content of the modal
  modalStocks.value = data.stocks || "No Available stocks";
  modalImage.src = data.ImageURL;
  modalTitleInput.value = data.name;
  modalDescriptionInput.value = data.description || "No description available.";
  modalPrice.value = data.price ? `${data.price}` : ""; // Display the price fetched from Firestore
  modalAvailability.value = data.availability ? "true" : "false"; // Set the availability status

  // Display the modal
  modal.style.display = "block";

  // Add listener to update item button to handle changes
  document.querySelector(".update-item").addEventListener("click", async () => {
    try {
      const updatedStocks = modalStocks.value;
      const updatedPrice = modalPrice.value;
      const updatedTitle = modalTitleInput.value;
      const updatedDescription = modalDescriptionInput.value;
      const updatedAvailability = modalAvailability.value === "true"; // Convert to boolean

      // Create a reference to the Firestore document for this product
      const productRef = doc(db, "Inventory", docId);

      // Update the fields in Firestore
      await updateDoc(productRef, {
        stocks: parseInt(updatedStocks), // Make sure the stocks are stored as a number
        price: parseFloat(updatedPrice), // Make sure the price is stored as a number
        name: updatedTitle,
        description: updatedDescription,
        availability: updatedAvailability,
      });

      console.log("Updated product in Firestore:", {
        price: updatedPrice,
        title: updatedTitle,
        description: updatedDescription,
        availability: updatedAvailability,
      });

      // Close modal after updating
      modal.style.display = "none";

      // Optionally: Refresh the page or data to reflect the updated changes
    } catch (error) {
      console.error("Error updating product in Firestore: ", error);
    }
  });
  document.querySelector(".delete-item").addEventListener("click", async () => {
    try {
      await deleteDoc(doc(db, "Inventory", docId));
      document.getElementById("productModal").style.display = "none"; // Close the modal after deletion
      alert("Item deleted successfully!");
      await fetchItems(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting item: ", error);
      alert("Failed to delete item. Please try again.");
    }
  });
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
// Call the fetchItems function when the page loads
window.addEventListener("DOMContentLoaded", fetchItems, deleteItem);
