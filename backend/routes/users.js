var express = require("express");
var router = express.Router();
var User = require("../firebase_config");

const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const getAllUsers = async () => {
  try {
    const snapshot = await User.get();
    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push(data);
    });
    return users.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error(error);
    return JSON.stringify({ error: "Failed to get users" });
  }
};

//get all user
router.get("/", async function (req, res, next) {
  const data = await getAllUsers();
  res.send(data);
});

const add_employee = async (data) => {
  try {
    //Get current counter value
    const counterRef = firebase
      .firestore()
      .collection("Counter")
      .doc("userCounter");
    const counterDoc = await counterRef.get();
    let counter = counterDoc.exists ? counterDoc.data().value : 1;
    const documentId = counter.toString();

    data.id = documentId;
    data.leavesLeft = data.leavesTotal;

    //Set Id for new document
    const collectionRef = firebase.firestore().collection("Employees");
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(data);

    //increment counter for next iteration
    counter++;
    await counterRef.set({ value: counter });

    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

router.post("/add", async function (req, res, next) {
  const status = await add_employee(req.body);
  if (status.success) {
    res.status(200).send({ msg: "Added User." });
  } else {
    res.status(500).send({ error: "Failed to add document" });
  }
});

const update_details = async (data) => {
  try {
    const id = data.id;
    delete data.id;
    await User.doc(id).update(data);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

router.post("/update", async function (req, res, next) {
  const status = await update_details(req.body);
  if (status.success) {
    res.status(200).send({ msg: "Updated User Details." });
  } else {
    res.status(500).send({ error: "Failed to update document" });
  }
});

const delete_employee = async (id) => {
  try {
    await User.doc(id).delete();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

router.post("/delete", async function (req, res, next) {
  const status = await delete_employee(req.body.id);
  if (status.success) {
    res.status(200).send({ msg: "Deleted User." });
  } else {
    res.status(500).send({ error: "Failed to delete document" });
  }
});

module.exports = {
  router: router,
  getAllUsers: getAllUsers,
  update_details: update_details,
  delete_employee: delete_employee,
  add_employee: add_employee,
};
