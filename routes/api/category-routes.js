const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', async (req, res) => {
  // find all categories
  // be sure to include its associated Products
  try {
    const categoryData = await Category.findAll({
      include: [{ model: Product }]
  });

  if (!categoryData) {
    res.status(404).json({ message: 'No categories found' });
    return;
  }

  res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find one category by its `id` value
  // be sure to include its associated Products
  try {
    const categoryData = await Category.findByPk(req.params.id, {
      include: [{ model: Product }]
  });
  if (!categoryData) {
    res.status(404).json({ message: 'No category found with this id' });
    return;
  }
  res.status(200).json(categoryData);
  }
  catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', (req, res) => {
  // create a new category
  Category.create(req.body)
    .then((category) => res.status(200).json(category))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  // update a category by its `id` value
  Category.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((category) => {
      // find all associated products
      return Product.findAll({ where: { category_id: req.params.id } });
    })
    .then((products) => {
      // get array of product ids
      const productIds = products.map(({ id }) => id);
      // create filtered list of new product ids
      const newProductIds = req.body.productIds
        .filter((product_id) => !productIds.includes(product_id))
        .map((product_id) => {
          return {
            product_id,
            category_id: req.params.id,
          };
        });
      // figure out which ones to remove
      const productsToRemove = products
        .filter(({ id }) => !req.body.productIds.includes(id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { category_id: req.params.id, product_id: productsToRemove } }),
        ProductTag.bulkCreate(newProductIds),
      ]);
    })
    .then((updatedProducts) => res.json(updatedProducts))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete a category by its `id` value
  try {
    await Product.destroy({ where: { category_id: req.params.id } });
    const categoryData = await Category.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!categoryData) {
      res.status(404).json({ message: 'No category found with this id' });
      return;
    }

    res.status(200).json(categoryData);
  }

  catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

module.exports = router;
