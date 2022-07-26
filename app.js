//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/**
 * * Conencting to MongoDB
 */
mongoose.connect(
	"mongodb+srv://magsz:NovaAkamaru@cluster0.z5mtn8e.mongodb.net/?retryWrites=true&w=majority",
	{
		useNewUrlParser: true,
	}
);

/**
 ** Creating Item Schema
 */
const ItemsSchema = new mongoose.Schema({
	name: String,
});

/**
 ** Creating an Item Model from the Item Schema
 */
const Item = mongoose.model("Items", ItemsSchema);

/**
 * * Initializing instances of Item model
 * * Item1, Item2, and Item3
 */
const item1 = new Item({ name: "Welcome to your to do list" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "<--- Hit this to delete an item" });

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
	name: String,
	items: [ItemsSchema],
});

const List = mongoose.model("List", listSchema);

// Item.insertMany(defaultItems, (err) => {
// 	if (err) {
// 		console.log(err);
// 	} else {
// 		console.log("succesfully added");
// 	}
// });

// Item.deleteMany({ defaultItems }, (err) => {
// 	if (err) {
// 		console.log(err);
// 	} else {
// 		console.log("deleted");
// 	}
// });

app.get("/", function (req, res) {
	const day = date.getDate();

	// check to see if the DB is empty when the user opens up hte web page
	// if the DB is empty then we will populate the DB with initial information
	// if foundItems.length === 0 then populate DB and redirect to home path
	// loops through again and renders list in web page.

	Item.find({}, (err, foundItems) => {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, (err) => {
				if (err) {
					console.log(err);
				} else {
					console.log("succesfully added");
				}
			});
			res.redirect("/");
		} else {
			res.render("list", { listTitle: day, newListItems: foundItems });
		}
	});
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	// creates new instance of Item Model
	const newItem = new Item({ name: itemName });

	// Saves Item model to DB
	newItem.save();

	// determines if its on the home list page
	if (listName === "Today") {
		newItem.save();
		//redirects to home path for rendering
		res.redirect("/");
	} else {
		List.findOne({ name: listName }, (err, foundList) => {
			foundList.items.push(newItem);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
});

app.post("/delete", (req, res) => {
	const checkedItemID = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		Item.findByIdAndRemove(checkedItemID, (err) => {
			if (err) {
				console.log(err);
			} else {
				console.log("deleted");
				res.redirect("/");
			}
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemID } } },
			(err, foundList) => {
				if (!err) {
					res.redirect("/" + listName);
				}
			}
		);
	}
});

app.get("/:customListName", (req, res) => {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, (err, foundList) => {
		if (!err) {
			if (!foundList) {
				// create a new list
				const list = new List({
					name: customListName,
					items: defaultItems,
				});

				list.save();

				res.redirect("/" + customListName);
			} else {
				// show the existing list
				res.render("list", {
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		}
	});
});

app.get("/about", function (req, res) {
	res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 8000;
}

app.listen(port, function () {
	console.log("Server has started succesfully");
});
