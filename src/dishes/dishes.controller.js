const path = require("path");


const dishes = require(path.resolve("src/data/dishes-data"));


const nextId = require("../utils/nextId");




function Match(req, res, next) {
  const { dishId } = req.params; 
  const { data: { id } = {} } = req.body; 

  if (dishId && id) {
    if (dishId === id) {
      return next();
    }

    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function Fields(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const data = req.body.data || {};
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }
  next();
}

function Zero(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function Number(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price !== "number") { 
    return next({
      status: 400,
      message: "Dish price is not a number",
    });
  }
  next();
}

function Exists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.foundDish = foundDish; 
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}


function list(req, res, next) {
  res.json({ data: dishes });
}


function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish); 
  res.status(201).json({ data: newDish });
}


function read(req, res, next) {
  res.status(200).json({ data: res.locals.foundDish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body; 
  const data = req.body.data || {};
  const dish = res.locals.foundDish; 
  const requiredFields = ["name", "description", "price", "image_url"];

  for (const field of requiredFields) {
    if (data[field] !== dish[field]) {
      dish[field] = data[field];
    }
  }

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [Fields, Zero, create],
  read: [Exists, read],
  update: [
    Exists,
    Fields,
    Number,
    Zero,
    Match,
    update,
  ],
  Exists,
};