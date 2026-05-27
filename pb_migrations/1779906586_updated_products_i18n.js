/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2591419373")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_043a7g0hnj` ON `products_i18n` (\n  `record`,\n  `language`\n)",
      "CREATE UNIQUE INDEX `idx_u1odtnotk0` ON `products_i18n` (`slug`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2591419373")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_043a7g0hnj` ON `products_i18n` (\n  `record`,\n  `language`\n)"
    ]
  }, collection)

  return app.save(collection)
})
