const path = require("path");


const orders = require(path.resolve("src/data/orders-data"));


const nextId = require("../utils/nextId");


function Fields(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const data = req.body.data || {};
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }
  next();
}

function Valid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (
    (Array.isArray(dishes) && !dishes.length) ||
    !Array.isArray(dishes) ||
    dishes === undefined
  ) {
    return next({
      status: 400,
      message: "dish",
    });
  }
  
  for (let index = 0; index < dishes.length; index++) {
    const dish = dishes[index];

    if (
      dish.quantity == undefined ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function Exists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId); 
  if (foundOrder) {
    res.locals.foundOrder = foundOrder; 
    return next();
  }
  next({
    status: 404,
    message: `Order doesn't exist: ${orderId}`,
  });
}

function statusValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery"];
  if (status == undefined || status === "" || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}


function Match(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && orderId !== id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}


function Pending(req, res, next) {
  const order = res.locals.foundOrder;
  if (order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}


function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.foundOrder });
}

function update(req, res, next) {
  const order = res.locals.foundOrder;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const orderId = req.params;
  const index = orders.findIndex((order) => order.id === orderId); 
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [Fields, Valid, create],
  read: [Exists, read],
  update: [
    Exists,
    Match,
    Fields,
    Valid,
    statusValid,
    update,
  ],
  destroy: [Exists, Pending, destroy],
};