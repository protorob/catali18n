/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3292755704",
    "help": "",
    "hidden": false,
    "id": "relation105650625",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "category",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3292755704",
    "help": "",
    "hidden": false,
    "id": "relation3470122981",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "extra_categories",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("relation105650625")

  // remove field
  collection.fields.removeById("relation3470122981")

  return app.save(collection)
})
