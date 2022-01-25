//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
})

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema)
const item1 = new Item({
  name: "Sleep"
});

const item2 = new Item({
  name: "Eat"
});

const item3 = new Item({
  name: "Play"
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String, 
  // item document associated with it
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {
  // call the mongoose method
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      //refer to the item model
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully saved")
        }
      });
      res.redirect('/')
    } else {
    res.render("list", {
      listTitle: "Today",
      newListItems: foundItems
    });
  }})


});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list; // correspond to the name the button
  //create a new item document based on the documents in the mongodb
  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect('/')
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save()
      res.redirect("/" + listName)
    })
  }
  
});

app.post('/delete', function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err) {
        console.log("success")
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect('/' + listName)
      }
    })
  }

  
})

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, async function(err, foundList){
    if(!err) {
      if(!foundList) {
        //Create a new list 
        const list = new List({
          name: customListName, // the name of the list theuser typed in
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      } else {
        //show an existing list
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
  
  
})

app.get("/about", function (req, res) {
  res.render("about");
});



app.listen(3000, function () {
  console.log("Server started on port 3000");
});