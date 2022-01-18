//jshint esversion:6

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const _ = require('lodash')
const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))


mongoose.connect(
  'mongodb+srv://<username>:<password>@cluster0.zajoz.mongodb.net/todolistDB?retryWrites=true&w=majority'
)

const itemSchema = new mongoose.Schema({
  name: String
})
const Item = mongoose.model('Item', itemSchema)

const item1 = new Item({
  name: 'Welcome to to do list'
})
// item1.save();
const item2 = new Item({
  name: 'Add + to add'
})
const item3 = new Item({
  name: 'Tick checkbox to delete'
})

const defaultItem = [item1, item2, item3]
const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model('List', listSchema)

app.get('/', function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log('Successfully added all items to DB.')
        }
      })
      res.redirect('/')
    } else {
      res.render('list', { listTitle: 'Today', newListItems: foundItems })
    }
  })
})

app.post('/', function (req, res) {
  const itemName = req.body.newItem
  const listName = req.body.list
  const addedItem = new Item({
    name: itemName
  })
  if (listName === 'Today') {
    addedItem.save()
    res.redirect('/')
  } else {
    List.findOne({ name: listName }, function (err, results) {
      if (!err) {
        results.items.push(addedItem)
        results.save()
        res.redirect('/' + listName)
      }
    })
  }
})
app.post('/delete', function (req, res) {
  const deleteItem = req.body.checkbox
  const listName = req.body.listName
  if (listName === 'Today') {
    Item.deleteOne({ _id: deleteItem }, function (err) {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully deleted')
      }
    })
    res.redirect('/')
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: deleteItem } } },
      function (err, results) {
        if (!err) {
          res.redirect('/' + listName)
        }
      }
    )
  }
})

app.get('/:listName', function (req, res) {
  const listName = _.capitalize(req.params.listName)
  List.findOne({ name: listName }, function (err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: listName,
          items: defaultItem
        })
        list.save()
        res.redirect('/' + listName)
      } else {
        res.render('list', {
          listTitle: results.name,
          newListItems: results.items
        })
      }
    }
  })
})

app.get('/about', function (req, res) {
  res.render('about')
})

let port = process.env.PORT
if (port == null || port == '') {
  port = 3000
}
app.listen(port, function () {
  console.log('Server started ')
})
