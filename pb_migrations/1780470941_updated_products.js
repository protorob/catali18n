/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(6, new Field({
    "help": "",
    "hidden": false,
    "id": "number1841282274",
    "max": null,
    "min": null,
    "name": "product_width_cm",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "help": "",
    "hidden": false,
    "id": "number866201949",
    "max": null,
    "min": null,
    "name": "product_lenght_cm",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "help": "",
    "hidden": false,
    "id": "number2884263647",
    "max": null,
    "min": null,
    "name": "product_height_cm",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "help": "",
    "hidden": false,
    "id": "number4036997225",
    "max": null,
    "min": null,
    "name": "product_weight_kg",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "help": "",
    "hidden": false,
    "id": "number1549452487",
    "max": null,
    "min": null,
    "name": "product_net_w_kg",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "help": "",
    "hidden": false,
    "id": "number527480703",
    "max": null,
    "min": null,
    "name": "product_per_box",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "help": "",
    "hidden": false,
    "id": "number4157084881",
    "max": null,
    "min": null,
    "name": "box_width_cm",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "help": "",
    "hidden": false,
    "id": "number2364221411",
    "max": null,
    "min": null,
    "name": "box_lenght_cm",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "help": "",
    "hidden": false,
    "id": "number346048609",
    "max": null,
    "min": null,
    "name": "box_height_cm",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "help": "",
    "hidden": false,
    "id": "number1339401943",
    "max": null,
    "min": null,
    "name": "box_weight_kg",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("number1841282274")

  // remove field
  collection.fields.removeById("number866201949")

  // remove field
  collection.fields.removeById("number2884263647")

  // remove field
  collection.fields.removeById("number4036997225")

  // remove field
  collection.fields.removeById("number1549452487")

  // remove field
  collection.fields.removeById("number527480703")

  // remove field
  collection.fields.removeById("number4157084881")

  // remove field
  collection.fields.removeById("number2364221411")

  // remove field
  collection.fields.removeById("number346048609")

  // remove field
  collection.fields.removeById("number1339401943")

  return app.save(collection)
})
